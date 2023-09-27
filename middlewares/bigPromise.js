// try-catch and async-await || use Promise

module.exports = (func) => (req, res, next) =>
  Promise.resolve(func).catch(next);
