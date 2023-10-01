const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  adminGetProducts,
  getOneProduct,
  adminUpdateOneProduct,
  adminDeleteOneProduct,
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
router
  .route("/admin/product/:id")
  .put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);

module.exports = router;
