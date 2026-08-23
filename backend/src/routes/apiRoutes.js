import express from 'express';
import healthRoutes from './healthRoutes.js';
import meetingRoutes from './meetingRoutes.js';

const router = express.Router();

// Mount sub-routes
router.use('/health', healthRoutes);
router.use('/meetings', meetingRoutes);

export default router;
