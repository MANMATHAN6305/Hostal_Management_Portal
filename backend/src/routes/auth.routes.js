const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken, verifyToken } = require('../middleware/auth');

const stripTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const isLocalhostUrl = (value) => {
  try {
    const url = new URL(String(value || '').trim());
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch (_error) {
    return false;
  }
};

const getRenderFrontendFromBackendUrl = (backendUrl) => {
  try {
    const parsed = new URL(backendUrl);
    if (!parsed.hostname.endsWith('.onrender.com')) return null;

    const candidateHost = parsed.hostname
      .replace('-backend.', '-portal.')
      .replace('-api.', '-portal.')
      .replace('-frontend.', '-portal.');

    return `${parsed.protocol}//${candidateHost}`;
  } catch (_error) {
    return null;
  }
};

const BACKEND_URL = stripTrailingSlash(
  process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'https://hostal-management-backend.onrender.com'
);

const FRONTEND_URL = (() => {
  const explicitFrontendUrl = stripTrailingSlash(process.env.FRONTEND_URL || 'http://localhost:5173');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction || !isLocalhostUrl(explicitFrontendUrl)) {
    return explicitFrontendUrl;
  }

  // Guard against production misconfiguration where FRONTEND_URL is left as localhost.
  return getRenderFrontendFromBackendUrl(BACKEND_URL) || explicitFrontendUrl;
})();
const EXTRA_ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const GOOGLE_CALLBACK_URL = (() => {
  const configuredCallbackUrl = stripTrailingSlash(process.env.GOOGLE_CALLBACK_URL || '');
  const fallbackCallbackUrl = `${BACKEND_URL}/api/auth/google/callback`;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!configuredCallbackUrl) {
    return fallbackCallbackUrl;
  }

  // Guard against production misconfiguration where callback stays on localhost.
  if (isProduction && isLocalhostUrl(configuredCallbackUrl)) {
    return fallbackCallbackUrl;
  }

  return configuredCallbackUrl;
})();

const isPlaceholder = (value) => !value || /^your-google-/i.test(value);
const isGoogleOAuthConfigured =
  !isPlaceholder(GOOGLE_CLIENT_ID) && !isPlaceholder(GOOGLE_CLIENT_SECRET);

const normalizeOrigin = (origin) => origin.replace(/\/+$/, '').toLowerCase();

const allowedFrontendOrigins = new Set(
  [FRONTEND_URL, ...EXTRA_ALLOWED_ORIGINS]
    .filter(Boolean)
    .map(normalizeOrigin)
);

const encodeBase64Url = (value) =>
  Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const decodeBase64Url = (value) => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
};

const parseOAuthState = (stateValue) => {
  if (!stateValue || typeof stateValue !== 'string') return null;
  try {
    return JSON.parse(decodeBase64Url(stateValue));
  } catch (_error) {
    return null;
  }
};

const isTrustedFrontendOrigin = (origin) => {
  try {
    const url = new URL(origin);
    if (!/^https?:$/.test(url.protocol)) return false;

    const normalized = normalizeOrigin(url.origin);
    if (allowedFrontendOrigins.has(normalized)) return true;

    // Allow Render frontend domains when explicit envs are not fully aligned.
    if (url.hostname.endsWith('.onrender.com')) return true;

    return false;
  } catch (_error) {
    return false;
  }
};

const resolveFrontendBase = ({ stateValue, queryOrigin } = {}) => {
  const state = parseOAuthState(stateValue);
  const originFromState = state?.redirectOrigin;
  if (originFromState && isTrustedFrontendOrigin(originFromState)) {
    return originFromState.replace(/\/+$/, '');
  }

  if (queryOrigin && isTrustedFrontendOrigin(queryOrigin)) {
    return queryOrigin.replace(/\/+$/, '');
  }

  return FRONTEND_URL;
};

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const fullName = profile.displayName;
      const googleId = profile.id;
      
      // Check if user exists
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Create new user with Google OAuth
        user = await User.create({
          fullName,
          email,
          googleId,
          role: 'STUDENT', // Default role for new Google sign-ins
          isActive: true
        });
      } else if (!user.googleId) {
        user.googleId = googleId;
      }

      // Backward compatibility for legacy users with placeholder role values
      if (!user.role || user.role === 'Select Role') {
        user.role = 'STUDENT';
      }
      await user.save();
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const queryOrigin = String(req.query.redirect_origin || '').trim();
  const frontendBase = resolveFrontendBase({ queryOrigin });

  if (!isGoogleOAuthConfigured) {
    return res.redirect(`${frontendBase}/login?error=${encodeURIComponent('google_oauth_not_configured')}`);
  }

  const authOptions = {
    scope: ['profile', 'email']
  };

  if (frontendBase) {
    authOptions.state = encodeBase64Url(JSON.stringify({ redirectOrigin: frontendBase }));
  }

  return passport.authenticate('google', authOptions)(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      const frontendBase = resolveFrontendBase({ stateValue: req.query.state });
      return res.redirect(`${frontendBase}/login?error=${encodeURIComponent('google_oauth_not_configured')}`);
    }
    return next();
  },
  (req, res, next) => {
    passport.authenticate('google', { session: false }, async (error, user) => {
      const frontendBase = resolveFrontendBase({ stateValue: req.query.state });
      const redirectError = (errorCode) =>
        res.redirect(`${frontendBase}/login?error=${encodeURIComponent(errorCode)}`);

      if (error || !user) {
        if (error) console.error('Google auth failure:', error);
        return redirectError('google_auth_failed');
      }

      try {
        const token = generateToken(user);

        // Get student ID if applicable
        let studentId = null;
        if (user.role === 'STUDENT') {
          const student = await Student.findOne({ where: { email: user.email } });
          if (student) {
            studentId = student.id;
          }
        }

        // Redirect to login page with auth data - login page will handle storing and redirecting
        const params = new URLSearchParams({
          token,
          userId: user.id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role
        });

        if (studentId) {
          params.append('studentId', studentId.toString());
        }

        return res.redirect(`${frontendBase}/login?${params.toString()}`);
      } catch (callbackError) {
        console.error('Google callback error:', callbackError);
        return redirectError('google_auth_failed');
      }
    })(req, res, next);
  }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.json({
        success: false,
        message: 'Invalid email or password',
        userId: null,
        fullName: null,
        email: null,
        role: null,
        token: null
      });
    }

    if (!user.password && !user.googleId) {
      return res.json({
        success: false,
        message: 'Account has no password set. Use Google login.',
        userId: null,
        fullName: null,
        email: null,
        role: null,
        token: null
      });
    }

    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
      const isLegacyPlainMatch = user.password === password;
      if (!isMatch && !isLegacyPlainMatch) {
        return res.json({
          success: false,
          message: 'Invalid email or password',
          userId: null,
          fullName: null,
          email: null,
          role: null,
          token: null
        });
      }
    }
    
    if (!user.isActive) {
      return res.json({
        success: false,
        message: 'Account is deactivated',
        userId: null,
        fullName: null,
        email: null,
        role: null,
        token: null
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // If student, also get student ID
    let studentId = null;
    if (user.role === 'STUDENT') {
      const student = await Student.findOne({ where: { email: user.email } });
      if (student) studentId = student.id;
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: token,
      studentId: studentId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, staffRole, phone } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({
        success: false,
        message: 'Email already exists',
        userId: null,
        fullName: null,
        email: null,
        role: null
      });
    }
    
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create new user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'STUDENT',
      staffRole: role === 'STAFF' ? (staffRole || null) : null,
      phone: phone || null,
      isActive: true
    });

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Registration successful',
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      staffRole: user.staffRole,
      studentId: null,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'role', 'isActive']
    });
    
    res.json(users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      password: null, // Don't return password
      role: user.role,
      isActive: user.isActive
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

module.exports = router;
