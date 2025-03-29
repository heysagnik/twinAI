const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler');
const { connectDB } = require('./config/env');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to the database
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Export the app for use in index.js
module.exports = app;