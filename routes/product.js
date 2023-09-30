const express = require("express");
const router = express.Router();

const { testProduct } = require("../controllers/productController");

router.route("/testProduct").get(testProduct);

module.exports = router;
