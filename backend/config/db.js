const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Connect to MongoDB Atlas
 * Connects to the database named 'connecthub' using Mongoose with retry logic
 */
const connectDB = async (retryCount = 0) => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    const errorMsg =
      'MONGO_URI is not defined in your environment variables.\n' +
      'Please create a backend/.env file based on backend/.env.example and provide your MongoDB connection string.';
    console.error(`❌ Database Configuration Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const options = {
    dbName: 'connecthub',
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 2,
  };

  try {
    const conn = await mongoose.connect(mongoUri, options);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection attempt ${retryCount + 1}/${MAX_RETRIES} failed: ${error.message}`);
    if (retryCount < MAX_RETRIES - 1) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`⏳ Retrying MongoDB connection in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      return connectDB(retryCount + 1);
    } else {
      console.error(`❌ All ${MAX_RETRIES} MongoDB connection attempts failed.`);
      throw error;
    }
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;
