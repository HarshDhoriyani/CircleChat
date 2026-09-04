import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let isDbConnected = false;

export const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI?.trim();
  const uri = rawUri ? rawUri : 'mongodb://127.0.0.1:27017/aetherchat';

  // Reduce command buffering timeout so API calls never hang for 10+ seconds
  mongoose.set('bufferTimeoutMS', 2500);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });

    isDbConnected = true;
    logger.info(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`❌ MongoDB Connection Error: ${err.message}`);
      isDbConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB Disconnected.');
      isDbConnected = false;
    });

    return conn;
  } catch (error) {
    isDbConnected = false;
    logger.warn(`⚠️ MongoDB Connection could not be established (${error.message}).`);
    logger.info('💡 Ensure MongoDB is running on mongodb://127.0.0.1:27017 or set MONGODB_URI in backend/.env');
  }
};

export const getDbStatus = () => isDbConnected;
export default connectDB;
