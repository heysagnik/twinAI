const mongoose = require('mongoose');
const env = require('./env');
const path = require('path');
const dotenv = require('dotenv');

// Force dotenv to load from project root
const rootPath = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootPath, '.env') });

const connectDB = async () => {
    // Print current working directory and env values for debugging
    console.log('Current working directory:', process.cwd());
    console.log('Looking for .env in:', rootPath);
    console.log('Environment variables loaded:', {
        'process.env.DB_URI': process.env.DB_URI,
        'env.DB_URI': env.DB_URI
    });

    // Use fallback connection string for MongoDB Atlas or your preferred DB
    const connectionString = env.DB_URI || process.env.DB_URI || 'mongodb://localhost:27017/twinAI';
    
    console.log('Attempting to connect with:', connectionString.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs
    
    try {
        await mongoose.connect(connectionString);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.error('Please ensure your .env file contains a valid DB_URI');
        // Don't exit process in dev, allow server to run even without DB
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;