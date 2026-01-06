import dotenv from 'dotenv';
import { app } from '../src/app.js';
import { initializeApp } from '../src/utils/init.utils.js';

// Load environment variables
dotenv.config();

// Set Vercel environment flag
process.env.VERCEL = '1';

// Initialize the application for serverless
let isInitialized = false;

const initializeServerless = async () => {
  if (!isInitialized) {
    try {
      await initializeApp();
      isInitialized = true;
      console.log('✅ Serverless application initialized');
    } catch (error) {
      console.error('❌ Serverless initialization failed:', error);
      throw error;
    }
  }
};

// Export the Express app for Vercel serverless functions
export default async (req, res) => {
  try {
    // Initialize on first request
    await initializeServerless();

    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};