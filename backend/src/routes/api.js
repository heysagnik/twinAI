const express = require('express');
const emailRoutes = require('./emailRoutes.js');
const meetingRoutes = require('./meetingRoutes.js');
const todoRoutes = require('./todoRoutes.js');
const twinRoutes = require('./twinRoutes.js');

const router = express.Router();

// API routes
router.use('/emails', emailRoutes);
router.use('/meetings', meetingRoutes);
router.use('/todos', todoRoutes);
router.use('/twins', twinRoutes);

module.exports = router;