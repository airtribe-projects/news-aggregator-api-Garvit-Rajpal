require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
const userRouter = require("./routes/userRouter");
const newsRouter = require("./routes/newsRouter");
const {
  connectRedis
} = require("./services/redis-client/redis-client");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/users", userRouter);
app.use("", newsRouter);

mongoose
  .connect(process.env.DB_CONNECTION_STRING)
  .then(() => {
    console.log("Connected to DB successfully");
    connectRedis().then(() => {
      app.listen(port, (err) => {
        if (err) {
          return console.log("Something bad happened", err);
        }
        console.log(`Server is listening on ${port}`);
      });
    });
  })
  .catch((err) => console.log("Error connecting to DB", err));

module.exports = app;
