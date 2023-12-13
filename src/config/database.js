const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((conn) => {
      console.log(
        "Database connection has been established\nHost:" +
          conn.connection.host +
          "\n"
      );
    })
    .catch((err) => {
      console.log("Database connection error", err);
      process.exit(1);
    });
};

module.exports = connectDatabase;
