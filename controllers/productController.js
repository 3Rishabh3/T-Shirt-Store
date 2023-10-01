const BigPromise = require("../middlewares/bigPromise");
const Product = require("../models/product");
const cloudinary = require("cloudinary");
const CustomError = require("../utils/customErrors");
const WhereClause = require("../utils/whereClause");

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

  res.status(200).json({
    success: true,
    product,
  });
});

exports.getProducts = BigPromise(async (req, res, next) => {
  const resultPerPage = 6;
  const totalCountOfAllTheProductsInStore = await Product.countDocuments();

  const productsObj = new WhereClause(Product.find(), req.query)
    .search()
    .filter();

  let products = await productsObj.base;
  const countOfAllFilteredProducts = products.length;

  productsObj.pager(resultPerPage);
  products = await productsObj.base.clone();

  res.status(200).json({
    success: true,
    products,
    countOfAllFilteredProducts,
    totalCountOfAllTheProductsInStore,
  });
});

exports.adminGetProducts = BigPromise(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

exports.getOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new CustomError(`Product with id ${req.params.id} not found.`, 401)
    );
  }

  res.status(200).json({
    success: true,
    product,
  });
});
