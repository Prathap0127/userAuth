var express = require("express");
var router = express.Router();

//home route
router.get("/", function (req, res, next) {
  res.render("index", { title: "User Authentication System" });
});

module.exports = router;
