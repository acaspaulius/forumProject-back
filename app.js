const express = require('express');
const app = express();
const cors = require('cors');
const mainRouter = require('./router/mainRouter');
const mongoose = require('mongoose');

require('dotenv').config();

mongoose
  .connect(process.env.MONGO_KEY)
  .then(() => {
    console.log('Connection ok');
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use('/', mainRouter);
app.listen(2500);
