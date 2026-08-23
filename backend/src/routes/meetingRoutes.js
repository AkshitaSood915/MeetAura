import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import {
  uploadMeeting,
  transcribeMeeting,
  analyzeMeeting,
  getMeetings,
  getMeetingStats,
  getMeetingById,
  deleteMeeting,
  toggleActionItem,
  askQuestion
} from '../controllers/meetingController.js';

const router = express.Router();

// POST /api/meetings/upload (Multipart form audio file + title)
router.post('/upload', upload.single('audio'), uploadMeeting);

// POST /api/meetings/:id/transcribe (Transcribe audio using Gemini AI)
router.post('/:id/transcribe', transcribeMeeting);

// POST /api/meetings/:id/analyze (Analyze transcript for summary, decisions, action items)
router.post('/:id/analyze', analyzeMeeting);

// POST /api/meetings/:id/ask (Ask MeetAura question grounded in meeting transcript)
router.post('/:id/ask', askQuestion);

// PATCH /api/meetings/:id/action-items/:itemIndex (Toggle or update action item completion)
router.patch('/:id/action-items/:itemIndex', toggleActionItem);

// GET /api/meetings/stats (Aggregated statistics from MongoDB)
router.get('/stats', getMeetingStats);

// GET /api/meetings (List all meetings with optimized card projection)
router.get('/', getMeetings);

// GET /api/meetings/:id (Get single meeting details)
router.get('/:id', getMeetingById);

// DELETE /api/meetings/:id (Delete meeting & audio file)
router.delete('/:id', deleteMeeting);

export default router;

