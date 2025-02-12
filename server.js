const { configDotenv } = require("dotenv")
// exposing ENVIRONMENT variable to our app.
configDotenv({ path: "./config.env" })

// handling unhandlerejection error
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION💥:shutting down.... ");
  console.log(err.name, err.message);
  process.exit(1);

});
// handling uncaughtException error
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION💥:shutting down.... ");
  console.log(err.name, err.message);
  process.exit(1);

});
// 
const mongoose = require("mongoose")
const app = require("./app")

// connecting our db
const db = process.env.DATABASE.replace("<PASSWORD/>", process.env.DB_PASSWORD)

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("database successfuly connected"))
  .catch((err) => {
    throw err;
  });

// LISTENING TO SERVER
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`listening on port ${port}....`);
});
