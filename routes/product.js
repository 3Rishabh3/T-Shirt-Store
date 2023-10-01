const express = require("express");
const router = express.Router();

const { addProduct, getProducts } = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../middlewares/user");

// user routes
router.route("/products").get(getProducts);

// admin routes
router
  .route("/admin/products/add")
  .post(isLoggedIn, customRole("admin"), addProduct);

module.exports = router;
