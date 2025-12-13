import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
  try {
    console.log("Transmuting connection string...");
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connection Successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

testConnection();
