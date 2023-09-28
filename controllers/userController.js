const User = require("../models/User");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customErrors");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");

exports.signup = BigPromise(async (req, res, next) => {
  let result;

  if (req.files) {
    let file = req.files.photo;
    result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
      folder: "users",
      width: 150,
      crop: "scale",
    });
  }

  const { name, email, password } = req.body;

  if (email && (await User.findOne({ email }))) {
    res.status(401).send("User already exists");
  }

  if (!email || !name || !password) {
    return next(new CustomError("Name, email, password are required", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result?.public_id,
      secure_url: result?.secure_url,
    },
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  // check if email or password is missing
  if (!email || !password) {
    return next(new CustomError("Email and Password both are required", 400));
  }

  // get user from db
  const user = await User.findOne({ email }).select("+password");

  // if user not found in db
  if (!user) {
    return next(new CustomError("Email is not registered", 400));
  }

  // match the password
  const isValidPassword = await user.isValidPassword(password);

  // if password do not match
  if (!isValidPassword) {
    return next(new CustomError("Password is not correct", 400));
  }

  // if everything is fine then generate token
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logout success",
  });
});
