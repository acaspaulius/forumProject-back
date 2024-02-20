module.exports = (res, success, data, message, status) => {
  return res.status(status).send({
    success,
    data,
    message,
  });
};
