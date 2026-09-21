import mongoose from 'mongoose';

export const dbState = { ready: false };

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    dbState.ready = false;
    const errorMsg = 'MONGODB_URI environment variable is required. Local fallback is disabled.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    dbState.ready = true;
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 30000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      dbState.ready = true;
      console.log(`MongoDB connected to: "${m.connection.name}"`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    dbState.ready = true;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    dbState.ready = false;
    throw e;
  }

  return cached.conn;
};

mongoose.connection.on('disconnected', () => {
  dbState.ready = false;
});

mongoose.connection.on('connected', () => {
  dbState.ready = true;
});

export default mongoose;
