const mongoose = require('mongoose');

let cached = global._mongooseConnection;

const connectDB = async () => {
  if (cached && cached.conn) {
    return cached.conn;
  }

  if (!cached) {
    cached = global._mongooseConnection = { conn: null, promise: null };
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI)
      .then((mongoose) => mongoose)
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB Connected: ${cached.conn.connection.host}`);
    return cached.conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
