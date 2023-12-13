const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: "string",
    required: ["true", "Please Enter your name"],
    maxLength: [30, "Your name cannot exceed 30 characters"],
  },
  email: {
    type: "string",
    required: ["true", "Please Enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: "string",
    required: ["true", "Please Enter your password"],
  },
  role: {
    type: "string",
    enum: ["user", "admin"],
    default: "admin",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordTokenExpires: Date,
  accountActivationToken: String,
  accountActivationTokenExpires: Date,
});

// password Encryption using Bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  console.log(this.password);
  this.resetPasswordTokenExpires = new Date();
  next();
});

// token for sign in
userSchema.methods.getSignedJwtToken = function () {
  console.log(process.env.JWT_EXPIRES_IN);
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

// compare password for reset
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordTokenExpires = Date.now() + 24 * 60 * 60 * 1000; //30 minutes

  return resetToken;
};

// Generate Account Activation Token
userSchema.methods.getAccountActivationToken = function () {
  const activationToken = crypto.randomBytes(20).toString("hex");
  this.accountActivationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");
  this.accountActivationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

  return activationToken;
};

module.exports = mongoose.model("User", userSchema);
