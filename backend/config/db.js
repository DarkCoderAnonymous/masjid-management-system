const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      "mongodb+srv://Afzaal:Afzaal123@cluster0.ea0uaof.mongodb.net/masjidDB?retryWrites=true&w=majority"
    );
    console.log(`✅ MongoDB Connected: ${JSON.stringify(conn.connection.host)}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
// 
