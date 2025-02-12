/* eslint-disable no-unused-vars */
const AppError = require("../utils/appError");

const devError = (error, req, res) => {
  res.status(error.statusCode || 500).json({
    status: error.status,
    message: error.message,
    error,
    stack: error.stack,
  });
};
const prodError = (error, req, res) => {
  // A) API
  // A1)
  if (error.isOperational)
    return res
      .status(error.statusCode)
      .json({ status: error.status, message: error.message });

  // generic message for client
  return res.status(500).json({
    status: "error",
    message: "something went very  wrong",
  });
};

const handleCastErrorDB = (error) => {
  const message = `Invalid${error.path}:${error.value}`;
  return new AppError(message, 400);
};
const handleDublicateFieldDB = (error) => {
  const val = error.keyValue.name;
  const message = `Duplicate field name:${val} ,pls use another name`;
  return new AppError(message, 400);
};

const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input:${errors.join(". ")}`;
  return new AppError(message, 400);
};
const handleJWTError = () => new AppError("invalid token,pls login again", 401);
const handleJWTTokenExpiredError = () =>
  new AppError("expired token,pls login again", 401);

//
module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  if (process.env.NODE_ENV === "development") {
    devError(error, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let err = { ...error };
    err.message = error.message;
    if (error.name === "CastError") err = handleCastErrorDB(err);
    if (error.code === 11000) err = handleDublicateFieldDB(err);
    if (error.name === "ValidationError") err = handleValidationError(err);
    if (error.name === "JsonWebTokenError") err = handleJWTError();
    if (error.name === "TokenExpiredError") err = handleJWTTokenExpiredError();
    prodError(err, req, res);
  }
};
