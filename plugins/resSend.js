module.exports = (res, success, data, message) => {
  return res.send({
    success,
    data,
    message,
  });
};
