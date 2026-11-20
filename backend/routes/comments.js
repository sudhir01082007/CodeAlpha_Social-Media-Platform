const express = require('express');
const router = express.Router({ mergeParams: true });
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// ==============================================================================
// 1. POST /api/posts/:postId/comments
// @desc    Add a comment to a specific post
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.post('/', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const text = req.body.text || req.body.content || req.body.comment;

    // 1. Validate Post ID format
    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing post ID format'
      });
    }

    // 2. Validate Comment text
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    // 3. Verify post exists in database
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // 4. Create comment
    const newComment = await Comment.create({
      text: text.trim(),
      user: req.user._id,
      post: postId
    });

    // 5. Add comment reference to Post
    post.comments.push(newComment._id);
    await post.save();

    // 6. Populate author info (excluding password)
    const populatedComment = await newComment.populate('user', 'fullName username avatar bio');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding comment',
      error: error.message
    });
  }
});

// ==============================================================================
// 2. GET /api/posts/:postId/comments
// @desc    Get all comments for a specific post (oldest to newest)
// @access  Public
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing post ID format'
      });
    }

    // Check post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await Comment.find({ post: postId })
      .populate('user', 'fullName username avatar bio')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    console.error('Fetch Comments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching comments',
      error: error.message
    });
  }
});

// ==============================================================================
// 3. DELETE /api/comments/:id  (or /api/posts/:postId/comments/:id)
// @desc    Delete a comment (Only author can delete)
// @access  Private (Requires Bearer Token)
// ==============================================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID format'
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check ownership: only comment author can delete
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized: You can only delete your own comments'
      });
    }

    // Remove comment reference from Post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id }
    });

    // Delete comment
    await Comment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      deletedCommentId: id
    });
  } catch (error) {
    console.error('Delete Comment Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting comment',
      error: error.message
    });
  }
});

module.exports = router;
