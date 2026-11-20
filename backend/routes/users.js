const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ==============================================================================
// 1. POST /api/users/:id/follow
// @desc    Follow another user
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // 1. Validate Target User ID format
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // 2. Prevent user from following themselves
    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    // 3. Find target user and current user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to follow not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current authenticated user not found'
      });
    }

    // 4. Check for duplicate follow request
    const isAlreadyFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: `You are already following @${targetUser.username}`
      });
    }

    // 5. Update target user's followers list
    targetUser.followers.push(currentUserId);
    await targetUser.save();

    // 6. Update current user's following list
    currentUser.following.push(targetUser._id);
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: `You are now following @${targetUser.username}`,
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        followersCount: targetUser.followers.length
      },
      currentUser: {
        _id: currentUser._id,
        username: currentUser.username,
        followingCount: currentUser.following.length
      }
    });
  } catch (error) {
    console.error('Follow User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error following user',
      error: error.message
    });
  }
});

// ==============================================================================
// 2. DELETE /api/users/:id/follow  (Also supports POST /api/users/:id/unfollow)
// @desc    Unfollow another user
// @access  Private (Requires Bearer Token)
// ==============================================================================
const unfollowUserHandler = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // 1. Validate Target User ID format
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // 2. Prevent user from unfollowing themselves
    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself'
      });
    }

    // 3. Find target user and current user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User to unfollow not found'
      });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Current authenticated user not found'
      });
    }

    // 4. Verify user is currently following target user
    const isFollowing = targetUser.followers.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!isFollowing) {
      return res.status(400).json({
        success: false,
        message: `You are not following @${targetUser.username}`
      });
    }

    // 5. Remove current user from target user's followers
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );
    await targetUser.save();

    // 6. Remove target user from current user's following list
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUser._id.toString()
    );
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: `You have unfollowed @${targetUser.username}`,
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        followersCount: targetUser.followers.length
      },
      currentUser: {
        _id: currentUser._id,
        username: currentUser.username,
        followingCount: currentUser.following.length
      }
    });
  } catch (error) {
    console.error('Unfollow User Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error unfollowing user',
      error: error.message
    });
  }
};

router.delete('/:id/follow', protect, unfollowUserHandler);
router.post('/:id/unfollow', protect, unfollowUserHandler);

// ==============================================================================
// 3. GET /api/users/:id/followers
// @desc    Get all followers of a user
// @access  Public
// ==============================================================================
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).populate(
      'followers',
      'fullName username avatar bio createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username
      },
      count: user.followers.length,
      followers: user.followers
    });
  } catch (error) {
    console.error('Fetch Followers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching followers',
      error: error.message
    });
  }
});

// ==============================================================================
// 4. GET /api/users/:id/following
// @desc    Get all users that a user is following
// @access  Public
// ==============================================================================
router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).populate(
      'following',
      'fullName username avatar bio createdAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        username: user.username
      },
      count: user.following.length,
      following: user.following
    });
  } catch (error) {
    console.error('Fetch Following Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching following users',
      error: error.message
    });
  }
});

// ==============================================================================
// 5. GET /api/users/:id
// @desc    Get a user profile by ID
// @access  Public
// ==============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
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
    console.error('Fetch User Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
      error: error.message
    });
  }
});

// ==============================================================================
// 6. GET /api/users
// @desc    Get all users (e.g. for suggested users sidebar)
// @access  Public
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .limit(20)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Fetch All Users Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching users',
      error: error.message
    });
  }
});

// ==============================================================================
// 7. PUT /api/users/profile
// @desc    Update current authenticated user's profile
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.body.fullName) user.fullName = req.body.fullName.trim();
    if (req.body.bio !== undefined) user.bio = req.body.bio.trim();
    if (req.body.avatar) user.avatar = req.body.avatar.trim();

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        followersCount: updatedUser.followers.length,
        followingCount: updatedUser.following.length,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message
    });
  }
});

module.exports = router;
