const validator = require('email-validator');
const jwt = require('jsonwebtoken');
const resSend = require('../plugins/resSend');
const userSchema = require('../schemas/userSchema');

require('dotenv').config();

module.exports = {
  validEmail: (req, res, next) => {
    const { email } = req.body;

    if (!validator.validate(email)) {
      // Notice the HTTP status code is now included
      return resSend(res, false, null, 'Invalid email address.', 400);
    }
    next();
  },

  validPassword: (req, res, next) => {
    const { password1, password2 } = req.body;

    if (password1.length < 4 || password1.length > 20) {
      return resSend(res, false, null, 'Password length is incorrect. Length must be between 4 and 20 characters.', 400);
    } else if (password1 !== password2) {
      return resSend(res, false, null, 'Passwords do not match.', 400);
    } else if (!/[A-Z]/.test(password1)) {
      return resSend(res, false, null, 'Password must contain at least one uppercase letter.', 400);
    } else if (!/[0-9]/.test(password1)) {
      return resSend(res, false, null, 'Password must contain at least one digit.', 400);
    }
    //  else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password1)) {
    //   return resSend(res, false, null, 'Password must contain at least one special character.', 400);
    // }
    // To add special character validation

    next();
  },
  validToken: (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return resSend(res, false, null, 'No token provided.', 401); // 401 Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, async (error, decoded) => {
      if (error) return resSend(res, false, null, 'Invalid validation token.', 403); // 403 Forbidden

      const user = await userSchema.findOne({ username: decoded.username });
      if (!user) {
        return resSend(res, false, null, 'User not found.', 404); // 404 Not Found
      }

      req.user = user;
      next();
    });
  },
  validLink: (req, res, next) => {
    const { newImg } = req.body;

    if (!newImg.startsWith('http://') && !newImg.startsWith('https://')) {
      return resSend(res, false, null, 'Invalid newImg URL. It must start with http:// or https://.', 400);
    }
    next();
  },
};
