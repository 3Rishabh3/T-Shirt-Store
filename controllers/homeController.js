exports.home = (req, res) => {
  res.status(200).json({
    success: true,
    greetings: "Hello from API",
  });
};

exports.homeDummy = (req, res) => {
  res.status(200).json({
    success: true,
    greetings: "Hello from dummy API",
  });
};
