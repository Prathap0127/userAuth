var express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotUserPassword,
  resetPasswordLink,
  activateAccountLink,
} = require("../src/controller/userController");
const { isAuthorized } = require("../src/middleware/auth");
var router = express.Router();

//Register Users
router.post("/register", registerUser);

//Login Users
router.post("/login", loginUser);

//Logout Users
router.get("/logout", logoutUser);

//Protected
router.post("/", isAuthorized);

//forgot user Pssword
router.post("/password/forgot_password", forgotUserPassword);

//password reset Link
router.post("/password/reset/:token", resetPasswordLink);

//Activate Account link
router.post("/activate/:token", activateAccountLink);

module.exports = router;
