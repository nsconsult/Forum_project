const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100 
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['general', 'tech', 'sports'], 
    default: 'general' 
  },
  replies: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Reply' 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Thread', threadSchema);