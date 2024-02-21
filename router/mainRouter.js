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
  deleteComment,
} = require('../controller/mainController');
const { validEmail, validPassword, validToken, validLink } = require('../middleware/middleware');

router.post('/register', validEmail, validPassword, register);
router.post('/login', login);
router.post('/verifyActivationCode', verifyActivationCode);
router.post('/changeImage', validToken, validLink, changeImage);

router.post('/autoLogin', validToken, autoLogin);
router.post('/topics', validToken, createTopic);
router.post('/discussions', validToken, createDiscussion);

router.get('/getTopics', getTopics);
router.get('/forum/:topic', getDiscussions);
router.get('/forum/:topic/:id', getSingleDiscussion);

router.post('/forum/:topic/:id/comments', validToken, createComment);
router.post('/forum/:topic/:id/comments/:commentId', validToken, deleteComment);

router.get('/userDiscussions', validToken, getUserDiscussions);
router.get('/userComments', validToken, getUserComments);

router.get('/chat/users', validToken, getChatUsers);
router.get('/messages/:toId', validToken, getMessages);

module.exports = router;
