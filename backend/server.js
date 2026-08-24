import express from 'express';
import cors from 'cors';
import { config } from './src/config/env.js';
import connectDB from './src/config/db.js';
import apiRoutes from './src/routes/apiRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { notFoundHandler } from './src/middleware/notFoundHandler.js';
import { UPLOADS_DIR } from './src/middleware/uploadMiddleware.js';

const app = express();

// Parse CORS Allowed Origins from CLIENT_URL
const allowedOrigins = config.clientUrl.split(',').map(url => url.trim());

// Global Middleware
app.use(cors({
  origin:process.env.CLIENT_URL,
  credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded audio files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'MeetAura API',
    version: '2.0.0',
    tagline: 'Turn conversations into clear next steps.',
    endpoints: {
      health: '/api/health',
      meetings: '/api/meetings',
      upload: '/api/meetings/upload'
    }
  });
});

// Mount API Routes
app.use('/api', apiRoutes);

// Error and 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start Server immediately and connect to MongoDB asynchronously
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`✨ MeetAura Backend Server running on http://localhost:${PORT}`);
  console.log(`🚀 Health Check available at http://localhost:${PORT}/api/health`);
  console.log(`📁 Audio storage directory ready at ${UPLOADS_DIR}`);
  
  // Connect to MongoDB in background
  connectDB();
});

export default app;
