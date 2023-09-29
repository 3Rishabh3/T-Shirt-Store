const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customErrors");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

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

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // if user not found in db
  if (!user) {
    return next(new CustomError("Email is not registered", 400));
  }

  const forgotToken = user.getForgotPasswordToken();

  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${forgotToken}`;

  const message = `Copy paste this link in your url and hit enter \n\n ${url}`;

  try {
    await mailHelper({
      email: user.email,
      subject: "TStore Password reset email",
      message,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // send error response
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  const encryToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Token is invalid or expired", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("Password and confirmed password do not match", 400)
    );
  }

  user.password = req.body.password;

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  await user.save();

  // send JSON response or token
  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return next(
      new CustomError(
        "Old password, new password, and confirm new password are required."
      )
    );
  }

  if (newPassword != confirmNewPassword) {
    return next(
      new CustomError("new password, and confirm new password are not same.")
    );
  }

  const user = await User.findById(req.user.id).select("+password");

  const isOldPasswordValid = await user.isValidPassword(req.body.oldPassword);

  if (!isOldPasswordValid) {
    return next(new CustomError("Old password does not match.", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  cookieToken(user, res);
});
