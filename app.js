const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const mainRouter = require('./router/mainRouter');
const messageSchema = require('./schemas/messageSchema');

require('dotenv').config();

const app = express();

const http = require('http');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

mongoose
  .connect(process.env.MONGO_KEY)
  .then(() => console.log('MongoDB connection established'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use('/', mainRouter);

// listen for new socket connections
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // listen for 'sendMessage' events from clients
  socket.on('sendMessage', async (data) => {
    // validate that required fields are present
    if (!data.from || !data.to || !data.message) {
      console.error('Error: Missing required fields');
      return;
    }

    // try to save the new message to the database
    try {
      const message = new messageSchema({
        from: data.from,
        to: data.to,
        message: data.message,
        createdAt: data.createdAt || new Date(),
      });

      const savedMessage = await message.save();

      // emit the saved message to all connected clients
      io.emit('receiveMessage', {
        content: savedMessage._doc,
        from: data.from,
        to: data.to,
      });

      // emit an event to update unread message count
      io.emit('receiveUnreadCount', {
        from: data.from,
        to: data.to,
        value: 1,
      });
    } catch (err) {
      console.log(err);
      console.error('Error saving message:', err);
    }
  });

  // listen for 'requestUnreadMessages' events from clients
  socket.on('requestUnreadMessages', async (data) => {
    try {
      // query for unread messages directed to the user
      const messages = await messageSchema.find({
        to: data.from,
        isRead: false,
      });

      // send the count of unread messages to the requesting client
      io.to(data.socketId).emit('receiveUnreadMessages', {
        content: { unread: messages.length },
      });
    } catch (error) {
      io.to(data.socketId).emit('receiveUnreadMessages', {
        content: { unread: 0 },
      });
    }
  });

  // listen for 'markAsRead' events from clients
  socket.on('markAsRead', async (data) => {
    try {
      // update the status of messages to 'read'
      const result = await messageSchema.updateMany({ from: data.from, to: data.to }, { $set: { isRead: true } });

      // emit the updated unread message count
      io.emit('receiveUnreadCount', {
        from: data.from,
        to: data.to,
        value: -result.modifiedCount,
      });
    } catch (error) {
      console.error(error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(2500, () => console.log('Server running on port 2500'));
