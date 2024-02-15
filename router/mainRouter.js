const express = require('express');
const router = express.Router();

const {
  register,
  login,
  autoLogin,
  verifyActivationCode,
  changeImage,
  createTopic,
  getTopics,
  getDiscussions,
  createDiscussion,
  getSingleDiscussion,
  createComment,
  getUserComments,
  getUserDiscussions,
  getChatUsers,
  getMessages,
} = require('../controller/mainController');
const { validEmail, validPassword, validToken, validLink } = require('../middleware/middleware');

router.post('/register', validEmail, validPassword, register);
router.post('/login', login);
router.post('/verifyActivationCode', verifyActivationCode);
router.post('/changeImage', validToken, validLink, changeImage);

router.post('/autoLogin', validToken, autoLogin);
router.post('/topics', validToken, createTopic);

router.get('/getTopics', getTopics);

router.get('/forum/:topic', getDiscussions);
router.post('/discussions', validToken, createDiscussion);
router.get('/forum/:topic/:id', getSingleDiscussion);

router.post('/forum/:topic/:id/comments', validToken, createComment);

// Route to get discussions created by the user
router.get('/userDiscussions', validToken, getUserDiscussions);

// Route to get comments made by the user
router.get('/userComments', validToken, getUserComments);

router.get('/api/chat/users', validToken, getChatUsers);
router.get('/api/messages/:toId', validToken, getMessages);

module.exports = router;
