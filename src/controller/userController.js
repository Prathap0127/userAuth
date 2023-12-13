const User = require("../models/UserModel");
const crypto = require("crypto");

const sendEmail = require("../utils/sendEmail");

//Register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(401).json({ message: "User already exists" });
    }

    const newUser = await User.create({ name, email, password });

    if (!newUser) {
      return res.status(500).json({ message: "Something went wrong" });
    }

    // Send Email for Verification
    const activationToken = newUser.getAccountActivationToken();
    await newUser.save({ validateBeforeSave: true });
    const activateUrl = `${process.env.BASE_URL}/activate-account/${activationToken}`;
    const message1 = `Welcome to Short URL's. Click the link below to activate your account.    `;
    const message2 = "";
    console.log(activateUrl);

    await sendEmail({
      recipient: newUser.email,
      to_name: newUser.name ? newUser.name : "",
      subject: "Account Activation Link",
      message1,
      link1: activateUrl,
      message2,
    });

    // Create JWT token for Cookies
    const token = await newUser.getSignedJwtToken();

    // Option for cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRATION_TIME * 24 * 60 * 60 * 1000
      ),
      withCredentials: true,
    };

    res.status(200).cookie("token", token, options).json({
      success: true,
      token: token,
      user: newUser,
      message: "New User created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

//login
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(
        res
          .status(400)
          .cookie("token", "none", {
            expires: new Date(Date.now() + 10 * 1000),
          })
          .json({ message: "Please fill all fields" })
      );

    // Find User by Username
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(404)
        .cookie("token", "none", {
          expires: new Date(Date.now() + 10 * 1000),
        })
        .json({ message: "Invalid User" });
    }
    // Verify the Password
    const isMatch = await user.comparePassword(password);

    // If Password doesn't match
    if (!isMatch) {
      return res
        .status(401)
        .cookie("token", "none", {
          expires: new Date(Date.now() + 10 * 1000) /* httpOnly: true */,
        })
        .json({ message: "Invalid Password" });
    }

    const token = await user.getSignedJwtToken();
    // Option for cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRATION_TIME * 24 * 60 * 60 * 1000
      ),
    };
    // console.log(token, user);

    return res.status(200).cookie("token", token, options).json({
      success: true,
      token: token,
      user,
      message: "User LogIn Successful",
    });
  } catch (error) {
    res.status(500).send("Error" + error);
  }
};

//logout
exports.logoutUser = async (req, res, next) => {
  res.status(200).cookie("token", "none").json({
    success: true,
    token: "none",
    message: "User Logout Successful",
  });
};

//forgot password
exports.forgotUserPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.reset_email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get Reset Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // create reset password url
  const resetUrl = `${process.env.BASE_URL}/resetpassword/${resetToken}`;

  const message1 = `This email is recived because you have requested the reset new password for User Authentication System Account.\n\n
  Please click on the link to complete the process:
  `;
  const message2 = "kindly ignore if you dont want to reset the password.";

  try {
    await sendEmail({
      recipient: user.email,
      to_name: user.name ? user.name : "",
      subject: "Password Reset Link",
      message1,
      link1: resetUrl,
      message2,
    });

    res.status(200).json({
      success: true,
      message:
        "check your email" +
        user.email +
        " a Mail has been sent to to Reset the Password",
    });
  } catch (error) {
    user.resetPasswordTokenExpires = undefined;
    user.resetPasswordToken = undefined;

    await user.save({ validateBeforeSave: false });
    console.log(error);
    return next(Error(error.message, 500));
  }
};

//reset password Link generation
exports.resetPasswordLink = async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log(hashedToken);
  try {
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send("Password reset token is invalid or has expired");
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).send(" Check Passwords do not match");
    }

    // Set new password
    user.password = req.body.password;
    await user.save();
    return res.status(200).json({
      success: true,
      user,
      message: "New Password Changed Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
};

//Account Activation
exports.activateAccountLink = async (req, res, next) => {
  try {
    const activationToken = req.params.activationToken;

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const activated_user = await User.findOne({
      accountActivationToken: hashedToken,
      verified: true,
    });
    if (activated_user) {
      // console.log(`Account has been activated Already.`);
      return res.json({
        success: true,
        message: "User Account has been activated Already.",
      });
    }

    const user = await User.findOne({
      accountActivationToken: hashedToken,
      accountActivationTokenExpires: { $gt: Date.now() },
    });

    console.log(user);
    if (!user) {
      return res.json({
        success: false,
        message: "Account Activation token is invalid or has expired",
      });
    }
    user.accountActivationTokenExpires = undefined;
    user.verified = true;
    await user.save();

    res.json({ success: true, message: "User Account Activated Successfully" });
  } catch (error) {
    console.error(error);
    res.send(error);
  }
};
