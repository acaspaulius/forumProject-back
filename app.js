const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const mainRouter = require('./router/mainRouter');
const messageSchema = require('./schemas/messageSchema');

require('dotenv').config();

const app = express();

// Assuming Socket.IO and Express should share the same port
const io = new Server(3000, {
  cors: {
    origin: 'http://localhost:3000',
  },
});

mongoose
  .connect(process.env.MONGO_KEY)
  .then(() => console.log('MongoDB connection established'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use('/', mainRouter);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async (data) => {
    console.log('Received message:', data);
    try {
      const message = {
        from: data.from,
        to: data.to,
        message: data.message,
        createdAt: data.createdAt,
      };
      // Ensure that 'from' field is populated with user's ID
      const savedMessage = await new messageSchema(message).save();
      io.emit('receiveMessage', savedMessage); // Emit to all clients for simplicity
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.listen(2500);
