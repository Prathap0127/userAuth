var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// Deps
const dotenv = require("dotenv").config({ path: "./src/config/config.env" });
const cors = require("cors");

// Router
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/userRoute");

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const corsConfig0 = { credentials: true, origin: true };
const corsConfig1 = { credentials: true, origin: "*" };
app.use(cors(corsConfig0));

//DB connection
const connectDatabase = require("./src/config/database");
connectDatabase();

//Routes
app.use("/", indexRouter);
//user Route
app.use("/api/user", usersRouter);

// Error Handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
