const BigPromise = require("../middlewares/bigPromise");

exports.signup = BigPromise(async (req, res, next) => {
  res.send("signup route");
});
