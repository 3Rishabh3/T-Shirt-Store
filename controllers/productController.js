const BigPromise = require("../middlewares/bigPromise");
const Product = require("../models/product");
const cloudinary = require("cloudinary");
const CustomError = require("../utils/customErrors");

exports.addProduct = BigPromise(async (req, res, next) => {
  // handling images coming in req, converting images in model format

  if (!req.files) {
    return next(new CustomError("Please provide photos of product.", 401));
  }

  let imageArray = [];
  for (let i = 0; i < req.files.photos.length; i++) {
    const file = req.files.photos[i].tempFilePath;
    const result = await cloudinary.v2.uploader.upload(file, {
      folder: "products",
    });

    imageArray.push({
      id: result.public_id,
      secure_url: result.secure_url,
    });
  }

  req.body.photos = imageArray;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.ststus(200).json({
    success: true,
    product,
  });
});
