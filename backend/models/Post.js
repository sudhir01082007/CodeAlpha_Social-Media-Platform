const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post author is required']
    },
    caption: {
      type: String,
      required: [true, 'Post caption or text content is required'],
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters']
    },
    image: {
      type: String,
      default: ''
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property to get total likes count
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
