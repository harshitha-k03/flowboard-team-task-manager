const mongoose = require("mongoose");

const connectDB = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  mongoose.set("strictQuery", true);
  mongoose.set("sanitizeFilter", true);
  mongoose.set("bufferCommands", false);

  await mongoose.connect(MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== "production",
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10,
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE) || 1
  });

  return mongoose.connection;
};

module.exports = connectDB;
