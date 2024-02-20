const { v4: uuidv4 } = require('uuid');
const resSend = require('../plugins/resSend');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const userSchema = require('../schemas/userSchema');
const topicSchema = require('../schemas/topicSchema');
const messageSchema = require('../schemas/messageSchema');

require('dotenv').config();

module.exports = {
  register: async (req, res) => {
    const { username, email, password1, role } = req.body;
    try {
      const existingUsernameUser = await userSchema.findOne({ username });
      if (existingUsernameUser) {
        return resSend(res, false, null, 'Username already taken.', 409); // 409 Conflict
      }

      const existingEmailUser = await userSchema.findOne({ email });
      if (existingEmailUser) {
        return resSend(res, false, null, 'Email already taken.', 409); // 409 Conflict
      }

      const hashedPassword = await bcrypt.hash(password1, 10);
      const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newUser = new userSchema({
        username,
        email,
        password: hashedPassword,
        role: role,
        image: 'https://www.redditstatic.com/avatars/avatar_default_02_0079D3.png',
        emailActivation: activationCode,
        isActive: false,
      });

      await newUser.save();

      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAIL,
          pass: process.env.GMAIL_PASS,
        },
      });
      const mailOptions = {
        from: 'Forum Control',
        to: email,
        subject: 'Your activation code.',
        text: `Your activation code is: ${activationCode}`,
      };
      await transporter.sendMail(mailOptions);

      resSend(res, true, null, 'Registration successful. Please check your email for the activation code.', 201); // 201 Created
    } catch (error) {
      resSend(res, false, null, 'Internal server error.', 500); // 500 Internal Server Error
    }
  },

  login: async (req, res) => {
    const { username, password1 } = req.body;
    try {
      const existingUser = await userSchema.findOne({ username });

      if (!existingUser) {
        return resSend(res, false, null, 'Wrong username or password.', 401); // 401 Unauthorized
      }

      if (!existingUser.isActive) {
        return resSend(res, false, null, 'User is not verified. Please enter activation code.', 401); // 401 Unauthorized
      }

      const isPasswordMatch = await bcrypt.compare(password1, existingUser.password);
      if (isPasswordMatch) {
        const token = jwt.sign({ username: existingUser.username }, process.env.JWT_SECRET, {
          expiresIn: '12h',
        });

        return resSend(
          res,
          true,
          {
            token,
            username: existingUser.username,
            email: existingUser.email,
            image: existingUser.image,
            role: existingUser.role,
            _id: existingUser._id,
          },
          'Login successful.',
          200
        );
      } else {
        return resSend(res, false, null, 'Wrong username or password.', 401); // 401 Unauthorized
      }
    } catch (error) {
      return resSend(res, false, null, 'Error during login.', 500); // 500 Internal Server Error
    }
  },

  autoLogin: async (req, res) => {
    const { token } = req.body;

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userSchema.findOne({
        username: decodedToken.username,
      });

      if (!user || !user.isActive) {
        return resSend(res, false, null, 'User not found or not active.', 404); // 404 Not Found
      }

      resSend(
        res,
        true,
        {
          _id: user._id,
          username: user.username,
          image: user.image,
          role: user.role,
        },
        'Successfully authenticated.',
        200
      );
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        resSend(res, false, null, 'Token expired.', 401); // 401 Unauthorized
      } else if (error.name === 'JsonWebTokenError') {
        resSend(res, false, null, 'Invalid token.', 400); // 400 Bad Request
      } else {
        resSend(res, false, null, 'Error during auto login.', 500); // 500 Internal Server Error
      }
    }
  },

  verifyActivationCode: async (req, res) => {
    const { username, activationCode } = req.body;

    try {
      const user = await userSchema.findOne({
        username,
        emailActivation: activationCode.trim(),
      });
      if (!user) {
        return resSend(res, false, null, 'Incorrect code or user.', 400);
      }

      user.isActive = true;
      user.emailActivation = '';
      await user.save();

      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });

      resSend(res, true, { token, username: user.username }, 'User successfully activated.', 200);
    } catch (error) {
      resSend(res, false, null, 'Error verifying activation code.', 500);
    }
  },

  changeImage: async (req, res) => {
    const { newImg } = req.body;
    const { username } = req.user;

    const updatedUser = await userSchema.findOneAndUpdate({ username }, { $set: { image: newImg } }, { new: true, runValidators: true });

    if (!updatedUser) {
      return resSend(res, false, null, 'User not found or could not be updated.', 404);
    }

    return resSend(res, true, { username, image: updatedUser.image, role: updatedUser.role }, 'Image updated successfully.', 200);
  },

  createTopic: async (req, res) => {
    const { title } = req.body;
    const { username } = req.user;

    try {
      // First, find the user to check if they are an admin
      const user = await userSchema.findOne({ username });
      if (!user) {
        return resSend(res, false, null, 'User not found.', 404);
      }

      if (user.role !== 'admin') {
        return resSend(res, false, null, 'Only admins can create topics.', 403);
      }

      // User is found and is an admin, create the topic
      const newTopic = new topicSchema({
        title: title.toLowerCase(),
        createdBy: user._id, // Assuming you have a createdBy field that references the User model
      });

      console.log(newTopic);

      await newTopic.save();
      return resSend(res, true, newTopic, 'Topic created successfully.', 201);
    } catch (error) {
      console.error('Create Topic Error:', error);
      return resSend(res, false, null, 'Internal server error.', 500);
    }
  },

  getTopics: async (req, res) => {
    try {
      const topics = await topicSchema.find(); // Fetch all topics
      resSend(res, true, topics, 'Topics fetched successfully.', 200);
    } catch (error) {
      console.error('Error fetching topics:', error);
      resSend(res, false, null, 'Internal server error', 500);
    }
  },

  createDiscussion: async (req, res) => {
    try {
      // Convert topic title from the request body to lowercase to ensure consistency
      const topicTitle = req.body.topic.toLowerCase();

      const topic = await topicSchema.findOne({ title: topicTitle });

      if (!topic) {
        return resSend(res, false, 'Topic not found', 404);
      }

      const newDiscussion = {
        title: req.body.title,
        description: req.body.description,
        user: req.user._id, // Assuming you have user data in req.user
      };

      topic.discussions.push(newDiscussion);
      await topic.save();
      resSend(res, true, newDiscussion, 'Discussion created successfully', 201);
    } catch (error) {
      resSend(res, false, error.message, 500);
    }
  },

  getDiscussions: async (req, res) => {
    try {
      // Convert topic in the URL parameter to lowercase to ensure consistency
      const topicTitle = req.params.topic.toLowerCase();

      const topic = await topicSchema.findOne({ title: topicTitle });
      if (!topic) {
        return resSend(res, false, 'Topic not found', 404);
      }
      resSend(res, true, topic.discussions, 'Discussions retrieved successfully', 201);
    } catch (error) {
      resSend(res, false, error.message, 500);
    }
  },

  getSingleDiscussion: async (req, res) => {
    try {
      // Ensure you're finding the topic that contains the discussion
      const topic = await topicSchema
        .findOne({ 'discussions._id': req.params.id })
        .populate({
          path: 'discussions.user', // Populate the discussion creator
          select: 'username image',
        })
        .populate({
          // Attempt to populate replies' user information directly might not work as expected due to path definition
          path: 'discussions.replies.user',
          model: 'forumUsers', // Ensure this matches your User model's name
          select: 'username image',
        });

      if (!topic) {
        return resSend(res, false, 'Topic not found', 404);
      }

      // Extract the specific discussion from the topic document, this part remains unchanged
      const discussion = topic.discussions.id(req.params.id);
      if (!discussion) {
        return resSend(res, false, 'Discussion not found', 404);
      }

      resSend(res, true, discussion, 'Discussion retrieved successfully', 200);
    } catch (error) {
      resSend(res, false, error.message, 500);
    }
  },

  createComment: async (req, res) => {
    try {
      const { topic, id } = req.params; // 'topic' is the title of the topic
      const { text, youtubeVideoId, imageUrl } = req.body;
      const userId = req.user._id;

      // Find the topic by its title
      const topicDocument = await topicSchema.findOne({ title: topic });
      if (!topicDocument) {
        return resSend(res, false, 'Topic not found', 404);
      }

      // Find the specific discussion by ID within the topic
      const discussion = topicDocument.discussions.find((discussion) => discussion._id.toString() === id);
      if (!discussion) {
        return resSend(res, false, 'Discussion not found', 404);
      }

      // Add the comment to the found discussion
      discussion.replies.push({
        user: userId,
        message: text,
        youtubeVideoId, // Save if provided
        imageUrl, // Save if provided
        createdAt: new Date(),
      });

      // Mark the modified path before saving
      topicDocument.markModified('discussions');

      // Save the updated topic document
      await topicDocument.save();

      resSend(res, true, { replies: discussion.replies }, 'Comment added successfully', 200);
    } catch (error) {
      console.error('Error adding comment:', error);
      resSend(res, false, error.message, 500);
    }
  },

  deleteComment: async (req, res) => {
    try {
      const { topic, id, commentId } = req.params;
      const userId = req.user._id.toString();

      // Find the topic document that contains the discussion
      const topicDocument = await topicSchema.findOne({ 'discussions._id': id });

      if (!topicDocument) {
        return resSend(res, false, 'Discussion not found', 404);
      }

      // Find the specific discussion
      const discussion = topicDocument.discussions.id(id);
      if (!discussion) {
        return resSend(res, false, 'Discussion not found', 404);
      }

      // Find the specific comment and check if the user is authorized to delete it
      const commentIndex = discussion.replies.findIndex((c) => c._id.toString() === commentId && c.user.toString() === userId);
      if (commentIndex === -1) {
        return resSend(res, false, 'Comment not found or user not authorized', 401);
      }

      // Remove the comment
      discussion.replies.splice(commentIndex, 1);

      // Save the updated topic document
      await topicDocument.save();

      resSend(res, true, {}, 'Comment deleted successfully', 200);
    } catch (error) {
      console.error('Error deleting comment:', error);
      resSend(res, false, error.message, 500);
    }
  },

  getUserDiscussions: async (req, res) => {
    try {
      const userId = req.user._id;

      const userDiscussions = await topicSchema
        .find({ 'discussions.user': userId })
        .select({
          'discussions.$': 1,
          title: 1,
          _id: 0,
        })
        .lean();
      const simplifiedData = userDiscussions.map((topic) => ({
        topic: topic.title,
        topicId: topic._id,
        ...topic.discussions[0],
      }));

      resSend(res, true, simplifiedData, 'User discussions retrieved successfully.', 200);
    } catch (error) {
      console.error('Error fetching user discussions:', error);
      resSend(res, false, error.message, 500);
    }
  },

  getUserComments: async (req, res) => {
    try {
      const userId = req.user._id;
      const topics = await topicSchema.find({
        'discussions.replies.user': userId,
      });
      let userComments = [];

      topics.forEach((topic) => {
        topic.discussions.forEach((discussion) => {
          discussion.replies.forEach((reply) => {
            if (reply.user.toString() === userId.toString()) {
              userComments.push({
                discussionTitle: discussion.title,
                comment: reply.message,
                topic: topic, // Assuming the topic object has an _id field
                discussionId: discussion._id, // Assuming the discussion object has an _id field
                time: reply.createdAt,
              });
            }
          });
        });
      });
      resSend(res, true, userComments, 'User comments retrieved successfully.', 200);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      resSend(res, false, error.message, 500);
    }
  },

  getChatUsers: async (req, res) => {
    try {
      // Instead of getting userId from params, use it from the verified token
      const userId = req.user._id; // Assuming req.user is set by validToken middleware

      const messages = await messageSchema
        .find({
          $or: [{ from: userId }, { to: userId }],
        })
        .populate('from to', 'username');

      const userIds = [...new Set(messages.flatMap((msg) => [msg.from.id, msg.to.id].filter((id) => id.toString() !== userId.toString())))];

      const users = await userSchema.find({ _id: { $in: userIds } }).select('username _id image'); // Assuming you want to return usernames and ids

      resSend(res, true, users, 'Chat users fetched successfully.', 200);
    } catch (err) {
      console.error('Error fetching chat users:', err);
      resSend(res, false, null, 'Internal server error.', 500);
    }
  },

  getMessages: async (req, res) => {
    try {
      // Use req.user to fetch messages for the authenticated user
      const userId = req.user._id; // Assuming req.user is set by validToken middleware
      const { toId } = req.params; // Assuming you're fetching messages between the authenticated user and another specified user

      const messages = await messageSchema
        .find({
          $or: [
            { from: userId, to: toId },
            { from: toId, to: userId },
          ],
        })
        .sort('createdAt');
      resSend(res, true, messages, 'Messages fetched successfully.', 200);
    } catch (err) {
      console.error('Error fetching messages:', err);
      resSend(res, false, null, 'Internal server error.', 500);
    }
  },
};
