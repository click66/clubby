const express = require("express");
const app = express();
const path = require("path");

app.use("/static", express.static(path.join(__dirname, "static")));

app.listen(80, () => {
  console.log("Listening on port 80");
});
