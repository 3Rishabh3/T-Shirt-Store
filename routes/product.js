const express = require("express");
const router = express.Router();

const {} = require("../controllers/productController");

router.route("/testProduct").get();

module.exports = router;
