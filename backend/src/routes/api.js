import express from 'express';
import emailRoutes from './emailRoutes.js';
import meetingRoutes from './meetingRoutes.js';
import todoRoutes from './todoRoutes.js';
import twinRoutes from './twinRoutes.js';

const router = express.Router();

// API routes
router.use('/emails', emailRoutes);
router.use('/meetings', meetingRoutes);
router.use('/todos', todoRoutes);
router.use('/twins', twinRoutes);

export default router;