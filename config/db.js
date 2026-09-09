const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the connection string in MONGO_URI.
 * The process exits if the initial connection fails, since the API
 * is useless without a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
