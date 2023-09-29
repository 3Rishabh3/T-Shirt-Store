const jwt = require("jsonwebtoken");
const CustomError = require("../utils/customErrors");
const BigPromise = require("./bigPromise");
const User = require("../models/user");

exports.isLoggedIn = BigPromise(async (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.body?.token;

  if (!token) {
    return next(new CustomError("You are not logged in"), 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id);

  next();
});
