const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Connects to the database named 'connecthub' using Mongoose
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error(
        'MONGO_URI is not defined in your environment variables.\n' +
        'Please create a backend/.env file based on backend/.env.example and provide your MongoDB connection string.'
      );
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'connecthub'
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
