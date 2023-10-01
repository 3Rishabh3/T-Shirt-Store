const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  adminGetProducts,
  getOneProduct,
} = require("../controllers/productController");
const { isLoggedIn, customRole } = require("../middlewares/user");

// user routes
router.route("/products").get(getProducts);
router.route("/product/:id").get(getOneProduct);

// admin routes
router
  .route("/admin/products/add")
  .post(isLoggedIn, customRole("admin"), addProduct);
router
  .route("/admin/products")
  .get(isLoggedIn, customRole("admin"), adminGetProducts);

module.exports = router;
