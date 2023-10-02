const BigPromise = require("../middlewares/bigPromise");
const Order = require("../models/order");
const Product = require("../models/product");
const CustomError = require("../utils/customErrors");

exports.createOrder = BigPromise(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    taxAmount,
    shippingAmount,
    totalAmount,
    user: req.user._id,
  });

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new CustomError("Please check order id", 401));
  }

  if (order.user.email !== req.user.email) {
    return next(new CustomError("This order is not associated to you.", 400));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.getLoggedInUserOrder = BigPromise(async (req, res, next) => {
  const order = await Order.find({ user: req.user._id });

  if (!order) {
    return next(new CustomError("Please check order id", 401));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
  const orders = await Order.find();
  res.status(200).json({
    success: true,
    orders,
  });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new CustomError("order not found", 401));
  }

  const enums = [
    "awaitingPayment",
    "failed",
    "expired",
    "paymentRecieved",
    "inTransist",
    "cancelled",
    "delivered",
    "returnInProgress",
    "returnCompleted",
    "refundInProgress",
    "refundedCompleted",
  ];
  if (
    order.orderStatus === enums[1] || // failed
    order.orderStatus === enums[2] || // expired
    order.orderStatus === enums[10] // refundedCompleted
  ) {
    return next(
      new CustomError(`Order is already marked for ${order.orderStatus}`),
      401
    );
  }

  order.orderStatus = req.body.orderStatus;

  order.orderItems.forEach(async (product) => {
    await updateProductStock(
      product.product,
      product.quantity,
      order.orderStatus,
      enums
    );
  });
  await order.save();

  res.status(200).json({
    success: true,
    order,
  });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  await order.deleteOne();

  res.status(200).json({
    success: true,
    order,
  });
});

async function updateProductStock(productId, quantity, orderStatus, enums) {
  const product = await Product.findById(productId);

  if (orderStatus === enums[3]) {
    // payment recieved
    product.stock = product.stock - quantity;
  }
  if (orderStatus === enums[8]) {
    // return complete
    product.stock = product.stock + quantity;
  }
  await product.save({ validateBeforeSave: false });
}
