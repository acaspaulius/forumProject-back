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

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('sendMessage', async (data) => {
    console.log(data);
    if (!data.from || !data.to || !data.message) {
      console.error('Error: Missing required fields');
      return;
    }

    try {
      const message = new messageSchema({
        from: data.from,
        to: data.to,
        message: data.message,
        createdAt: data.createdAt || new Date(),
      });

      const savedMessage = await message.save();

      io.emit('receiveMessage', {
        content: savedMessage._doc,
        from: data.from,
        to: data.to,
      });
    } catch (err) {
      console.log(err);
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(2500, () => console.log('Server running on port 2500'));
