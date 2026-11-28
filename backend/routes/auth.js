const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/**
 * Generate a JWT token for an authenticated user
 * @param {string} id - User ObjectId string
 * @param {string} username - User username string
 * @returns {string} Signed JWT Token
 */
const generateToken = (id, username) => {
  return jwt.sign(
    { id, username },
    process.env.JWT_SECRET || 'connecthub_dev_secret_key_change_in_production',
    {
      expiresIn: '7d'
    }
  );
};

// ==============================================================================
// 1. POST /api/auth/register
// @desc    Register a new ConnectHub user
// @access  Public
// ==============================================================================
router.post('/register', async (req, res) => {
  try {
    const { fullName, username, email, password, bio, avatar } = req.body;

    // 1. Validate required fields
    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: fullName, username, email, and password'
      });
    }

    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    // 2. Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // 3. Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // 4. Validate username format (alphanumeric + underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores'
      });
    }

    // 5. Check if email already registered
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // 6. Check if username already taken
    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken. Please choose another username'
      });
    }

    // 7. Hash the password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8. Create new user in MongoDB
    const newUser = await User.create({
      fullName: trimmedFullName,
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword,
      bio: bio ? bio.trim() : undefined,
      avatar: avatar ? avatar.trim() : undefined
    });

    // 9. Generate JWT Token
    const token = generateToken(newUser._id, newUser.username);

    // 10. Return response without password hash
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        bio: newUser.bio,
        avatar: newUser.avatar,
        followersCount: newUser.followers.length,
        followingCount: newUser.following.length,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user registration',
      error: error.message
    });
  }
});

// ==============================================================================
// 2. POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
// ==============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 3. Verify password with bcryptjs
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 4. Generate JWT Token
    const token = generateToken(user._id, user.username);

    // 5. Return success response (never exposing password)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during user login',
      error: error.message
    });
  }
});

// ==============================================================================
// 3. GET /api/auth/me
// @desc    Get currently logged in user profile
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.get('/me', protect, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Fetch Current User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
      error: error.message
    });
  }
});

module.exports = router;
