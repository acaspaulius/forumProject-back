const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'forumUsers', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'forumUsers', required: true },
  message: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const order = mongoose.model('forumMessages', MessageSchema);
module.exports = order;
