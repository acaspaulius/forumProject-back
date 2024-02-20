const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a Reply schema
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
  // Add any other fields as necessary
});

// Define a Discussion schema
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
  replies: [replySchema], // Embed the replies here
});

// Define the main Topic schema
const topicSchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true, // Topic titles should be unique
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'forumUsers',
    required: true,
  },
  discussions: [discussionSchema], // Embed the discussions directly within the topic
});

const order = mongoose.model('forumTopics', topicSchema);

module.exports = order;
