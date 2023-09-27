const BigPromise = require("../middlewares/bigPromise");

exports.home = BigPromise(async (req, res) => {
  // const db = await something()
  res.status(200).json({
    success: true,
    greetings: "Hello from API",
  });
});

exports.homeDummy = async (req, res) => {
  try {
    // const db = await something()
    res.status(200).json({
      success: true,
      greetings: "Hello from dummy API",
    });
  } catch (error) {
    console.log(error);
  }
};
