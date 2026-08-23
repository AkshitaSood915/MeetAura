import mongoose from 'mongoose';
import { config } from './env.js';

let isConnected = false;

/**
 * Connect to MongoDB database via Mongoose
 */
export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout if local server is down
      connectTimeoutMS: 3000,
    });

    isConnected = true;
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ Notice: MongoDB is not currently running at ${config.mongoUri}.`);
    console.log(`💾 Using resilient JSON persistence layer in backend/data/ for active storage until MongoDB starts.`);
    return null;
  }
};

export const getIsConnected = () => isConnected;

export default connectDB;
