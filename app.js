var createError = require("http-errors");

var express = require("express");

var path = require("path");

const mongoose = require("mongoose");



var bodyparser = require("body-parser");

var logger = require("morgan");

var ejslayout = require("express-ejs-layouts");



var Users = require("./routes/Users");

const model = require("./routes/Users").model;

const session = require("express-session");
const { userInfo } = require("os");



var app = express();




app.use(
  session({
    secret: "key",
    cookie: { maxAge: 600000000000000 },
    resave: false,
    saveUninitialized: true,
  })
);

// view engine setup

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

app.set("layout", "layout/layout.ejs");

app.use(ejslayout);


app.use(logger("dev"));

app.use(express.json());

app.use(bodyparser.urlencoded({ extended: true }));

app.use(bodyparser.json());


app.use(express.static(path.join(__dirname, "public")));




app.use("/User", Users.router);



app.use(function (req, res, next) {
  next(createError(404));
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
