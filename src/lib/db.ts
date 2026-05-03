import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const URI = process.env.MONGO_DB_URI!;

  try {
    await mongoose.connect(URI);
    isConnected = true;
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error, "MongoDB Connection Failed");
    throw error;
  }
}
