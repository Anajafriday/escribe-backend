const express = require("express");
const morgan = require("morgan");
const app = express();
const globalErrorHandler = require("./controllers/erroController");
// parser
app.use(express.json())
if (process.env.NODE_ENV === "development") {
  // LOGGED FORMAT
  app.use(morgan("dev"));
}

const audioRoute = require("./routes/audioRoutes");
const transcriptionRoute = require("./routes/transcriptionRoutes");
const translationRoute = require("./routes/translationRoutes");
const AppError = require("./utils/appError");
app.use("/api/v1/transcripts", transcriptionRoute)
app.use("/api/v1/audios", audioRoute)
app.use("/api/v1/translation", translationRoute)
// Handle undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`The page ${req.originalUrl} cannot be found`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
