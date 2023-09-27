const app = require("./app");
require("dotenv").config();

app.listen(process.env.PORT, () =>
  console.log(`Server is up and running at ${process.env.PORT}`)
);
