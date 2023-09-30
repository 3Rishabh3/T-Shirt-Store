const BigPromise = require("../middlewares/bigPromise");

exports.testProduct = BigPromise(async (req, res) => {
  res.status(200).json({
    success: true,
    greetings: "Hello from Product API",
  });
});
