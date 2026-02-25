const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Student = require('../models/Student');
const { generateToken, verifyToken } = require('../middleware/auth');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const fullName = profile.displayName;
      
      // Check if user exists
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Create new user with Google OAuth
        user = await User.create({
          fullName,
          email,
          password: 'google-oauth-' + Date.now(), // Placeholder password for OAuth users
          role: 'STUDENT', // Default role for new Google sign-ins
          isActive: true
        });

        // Create student record for new users
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await Student.create({
          studentId: 'STU' + Date.now(),
          firstName,
          lastName,
          email,
          department: 'Not Assigned',
          year: 1,
          gender: 'Select Gender'
        });
      }
      
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
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=google_auth_failed' }),
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
      
      res.redirect(`http://localhost:5173/login?${params.toString()}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('http://localhost:5173/login?error=google_auth_failed');
    }
  }
);

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email, password } });
    
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
      let student = await Student.findOne({ where: { email: user.email } });
      
      // If no student record exists, create one for existing users
      if (!student) {
        const nameParts = user.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';
        
        student = await Student.create({
          studentId: 'STU' + Date.now(),
          firstName,
          lastName,
          email: user.email,
          department: 'Not Assigned',
          year: 1,
          gender: 'Select Gender'
        });
      }
      
      studentId = student.id;
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
    const { fullName, email, password, role } = req.body;
    
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
    
    // Create new user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'STAFF',
      isActive: true
    });

    // If registering as a student, also create a Student record
    if (role === 'STUDENT') {
      // Split fullName into firstName and lastName
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Generate a student ID (e.g., STU + timestamp)
      const studentId = 'STU' + Date.now();
      
      await Student.create({
        studentId,
        firstName,
        lastName,
        email,
        department: 'Not Assigned',
        year: 1,
        gender: 'Select Gender'
      });
    }
    
    res.json({
      success: true,
      message: 'Registration successful',
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
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
