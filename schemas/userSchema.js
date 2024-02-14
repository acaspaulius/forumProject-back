const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  emailActivation: {
    type: String,
    required: false,
    default: '',
  },
  isActive: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const order = mongoose.model('forumUsers', userSchema);
module.exports = order;
