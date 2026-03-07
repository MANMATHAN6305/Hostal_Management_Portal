const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken, verifyToken } = require('../middleware/auth');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  'https://hostal-management-backend.onrender.com'
).replace(/\/+$/, '');

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const GOOGLE_CALLBACK_URL = (
  process.env.GOOGLE_CALLBACK_URL ||
  `${BACKEND_URL}/api/auth/google/callback`
).trim();

const isPlaceholder = (value) => !value || /^your-google-/i.test(value);
const isGoogleOAuthConfigured =
  !isPlaceholder(GOOGLE_CLIENT_ID) && !isPlaceholder(GOOGLE_CLIENT_SECRET);

const redirectToLoginError = (res, errorCode) =>
  res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(errorCode)}`);

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
  if (!isGoogleOAuthConfigured) {
    return redirectToLoginError(res, 'google_oauth_not_configured');
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      return redirectToLoginError(res, 'google_oauth_not_configured');
    }
    return next();
  },
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed` }),
  async (req, res) => {
    try {
      const user = req.user;
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
      
      res.redirect(`${FRONTEND_URL}/login?${params.toString()}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }
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
