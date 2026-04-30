const mongoose = require('mongoose');

const connectDB = async () => {
  // Always read from global so the cached value is shared across warm invocations
  if (global._mongooseConn && mongoose.connection.readyState === 1) {
    return global._mongooseConn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .catch((error) => {
        global._mongoosePromise = null;
        throw error;
      });
  }

  global._mongooseConn = await global._mongoosePromise;
  console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
  return global._mongooseConn;
};

module.exports = connectDB;
