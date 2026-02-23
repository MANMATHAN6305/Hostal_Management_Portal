const express = require('express');
const router = express.Router();
const User = require('../models/User');

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
        role: null
      });
    }
    
    if (!user.isActive) {
      return res.json({
        success: false,
        message: 'Account is deactivated',
        userId: null,
        fullName: null,
        email: null,
        role: null
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
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
