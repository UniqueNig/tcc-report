// import mongoose from "mongoose";

// let isConnected = false;

// export async function connectDB() {
//   if (isConnected) return;

//   const URI = process.env.MONGO_DB_URI!;

//   try {
//     await mongoose.connect(URI);
//     isConnected = true;
//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.error(error, "MongoDB Connection Failed");
//     throw error;
//   }
// }


import mongoose from "mongoose";

const MONGO_DB_URI = process.env.MONGO_DB_URI!;

if (!MONGO_DB_URI) {
  throw new Error("MONGO_DB_URI is not defined in environment variables");
}

// ── Cached connection (Next.js hot reload safe) ────────
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGO_DB_URI, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
