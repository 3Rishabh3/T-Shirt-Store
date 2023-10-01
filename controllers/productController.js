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

exports.addProductReview = BigPromise(async (req, res, next) => {
  const { comment, rating, productId } = req.body;
  console.log(req.user);
  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  let product = await Product.findById(productId);

  const alreadyReview = product.reviews.find(
    (review) => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReview) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numberOfReviews = product.reviews.length;
  }

  let ratingsSum = 0;
  for (let i = 0; i < product.reviews.length; i++) {
    ratingsSum = ratingsSum + product.reviews[i].rating;
  }

  product.ratings = ratingsSum / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

exports.deleteProductReview = BigPromise(async (req, res, next) => {
  const { productId } = req.query;

  const product = await Product.findById(productId);

  const reviews = product.reviews.filter(
    (review) => review.user.toString() !== req.user._id.toString()
  );

  const numberOfReviews = reviews.length;

  let ratingsSum = 0;
  console.log(reviews);
  console.log(reviews.length);
  for (let i = 0; i < reviews.length; i++) {
    ratingsSum = ratingsSum + reviews[i].rating;
  }

  const ratings = reviews.length ? ratingsSum / reviews.length : 0;

  await Product.findByIdAndUpdate(
    productId,
    {
      reviews,
      ratings,
      numberOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});

// admin only routes
exports.adminGetProducts = BigPromise(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

exports.adminUpdateOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new CustomError(`Product with id ${req.params.id} not found.`, 401)
    );
  }

  if (req.files) {
    // first work on to remove old pictures from cloudinary
    let oldPhotos = [...product.photos];

    for (let i = 0; i < oldPhotos.length; i++) {
      await cloudinary.v2.uploader.destroy(oldPhotos[i].id);
      console.log(`Photo ${i + 1} removed successfully...`);
    }

    // upload new images one by one on cloudinary
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

      console.log(`file ${i + 1} uploaded successfully...`);
    }
    req.body.photos = imageArray;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    updatedProduct,
  });
});

exports.adminDeleteOneProduct = BigPromise(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new CustomError(`Product with id ${req.params.id} not found.`, 401)
    );
  }

  // remove old pictures from cloudinary
  let oldPhotos = [...product.photos];
  for (let i = 0; i < oldPhotos.length; i++) {
    await cloudinary.v2.uploader.destroy(oldPhotos[i].id);
    console.log(`Photo ${i + 1} removed successfully...`);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product is deleted",
  });
});
