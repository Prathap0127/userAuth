const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
var cookies = require("cookie-parser");

exports.isAuthorized = async (req, res, next) => {
  console.log("isAuthorized");
  const token = req.cookies.token;
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  try {
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(402).json({ error: error });
  }
};
