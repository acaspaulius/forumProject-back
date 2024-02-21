const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const replySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'forumUsers',
    required: true,
  },
  message: {
    type: String,
    required: false,
  },
  youtubeVideoId: {
    type: String,
    required: false,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const discussionSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'forumUsers',
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  replies: [replySchema],
});

const topicSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'forumUsers',
    required: true,
  },
  discussions: [discussionSchema],
});

const order = mongoose.model('forumTopics', topicSchema);

module.exports = order;
