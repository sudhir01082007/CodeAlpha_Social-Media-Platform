const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const commentRoutes = require('./comments');

// Re-route into comments router for /api/posts/:postId/comments
router.use('/:postId/comments', commentRoutes);

// ==============================================================================
// 1. GET /api/posts
// @desc    Get all posts from newest to oldest
// @access  Public
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'fullName username avatar bio')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Fetch Posts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching posts',
      error: error.message
    });
  }
});

// ==============================================================================
// 2. GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
// ==============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id).populate('user', 'fullName username avatar bio');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    return res.status(200).json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Fetch Single Post Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching post',
      error: error.message
    });
  }
});

// ==============================================================================
// 3. POST /api/posts
// @desc    Create a new post
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    // Support both 'caption' and 'content' for flexibility
    const caption = req.body.caption || req.body.content;
    const image = req.body.image || req.body.imageUrl || '';

    // Validate caption text presence
    if (!caption || !caption.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post text content or caption is required'
      });
    }

    const newPost = await Post.create({
      user: req.user._id,
      caption: caption.trim(),
      image: image.trim(),
      likes: [],
      comments: []
    });

    // Populate author details before returning
    const populatedPost = await newPost.populate('user', 'fullName username avatar bio');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create Post Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: error.message
    });
  }
});

// ==============================================================================
// 4. DELETE /api/posts/:id
// @desc    Delete a post (Only post author can delete)
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check post ownership
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only delete your own posts'
      });
    }

    await Post.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedPostId: id
    });
  } catch (error) {
    console.error('Delete Post Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting post',
      error: error.message
    });
  }
});

// ==============================================================================
// 5. POST /api/posts/:id/like
// @desc    Like or Unlike a post (Toggle behavior)
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.post('/:id/like', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format'
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if the user already liked this post
    const alreadyLikedIndex = post.likes.findIndex(
      (userId) => userId.toString() === req.user._id.toString()
    );

    let isLiked = false;

    if (alreadyLikedIndex > -1) {
      // User has already liked -> Remove like (Unlike)
      post.likes.splice(alreadyLikedIndex, 1);
      isLiked = false;
    } else {
      // User has not liked -> Add like
      post.likes.push(req.user._id);
      isLiked = true;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: isLiked,
      likesCount: post.likes.length,
      likes: post.likes
    });
  } catch (error) {
    console.error('Toggle Post Like Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating post like status',
      error: error.message
    });
  }
});

module.exports = router;
