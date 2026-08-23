import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Meeting } from '../models/Meeting.js';
import { UPLOADS_DIR } from '../middleware/uploadMiddleware.js';
import { transcribeAudioFile } from '../services/transcriptionService.js';
import { analyzeMeetingTranscript, askMeetingQuestion } from '../services/analysisService.js';

/**
 * @desc   Upload meeting audio and create MongoDB meeting record
 * @route  POST /api/meetings/upload
 */
export const uploadMeeting = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No audio file uploaded. Please select an audio file (MP3, WAV, M4A, MP4, AAC, OGG, WEBM, FLAC).'
      });
    }

    // Check for empty files (0 bytes)
    if (req.file.size === 0) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          await fs.promises.unlink(req.file.path);
        } catch (unlinkErr) {
          console.error('Failed to cleanup empty uploaded file:', unlinkErr);
        }
      }
      return res.status(400).json({
        status: 'error',
        message: 'The uploaded audio file is empty (0 bytes). Please upload a valid audio recording.'
      });
    }

    let title = typeof req.body.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    if (!title) {
      const ext = path.extname(req.file.originalname);
      title = path.basename(req.file.originalname, ext)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .slice(0, 200);
    }

    const meeting = await Meeting.create({
      title,
      originalFileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype || 'audio/mpeg',
      status: 'uploaded',
      duration: 0,
      transcript: '',
      summary: '',
      keyPoints: [],
      decisions: [],
      actionItems: [],
      errorMessage: ''
    });

    res.status(201).json({
      status: 'ok',
      message: 'Meeting uploaded successfully',
      meeting
    });
  } catch (error) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Failed to cleanup uploaded file on error:', unlinkErr);
      }
    }
    next(error);
  }
};

/**
 * @desc   Transcribe meeting audio using Gemini API
 * @route  POST /api/meetings/:id/transcribe
 */
export const transcribeMeeting = async (req, res, next) => {
  const { id } = req.params;
  const force = req.body.force === true;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    // Idempotency check
    if (meeting.status === 'transcribed' && meeting.transcript && !force) {
      return res.status(200).json({
        status: 'ok',
        message: 'Meeting already transcribed.',
        meeting
      });
    }

    if (meeting.status === 'transcribing' && !force) {
      return res.status(200).json({
        status: 'ok',
        message: 'Meeting transcription is currently in progress. Please wait.',
        meeting
      });
    }

    const fullAudioPath = path.isAbsolute(meeting.filePath)
      ? meeting.filePath
      : path.join(UPLOADS_DIR, meeting.filePath);

    if (!fs.existsSync(fullAudioPath)) {
      meeting.status = 'failed';
      meeting.errorMessage = 'Audio file was not found on server disk.';
      await meeting.save();

      return res.status(404).json({
        status: 'error',
        message: 'Stored audio file was not found on server. Please re-upload the meeting audio.'
      });
    }

    meeting.status = 'transcribing';
    meeting.errorMessage = '';
    await meeting.save();

    try {
      const transcript = await transcribeAudioFile(fullAudioPath, meeting.mimeType, id);

      if (!transcript || transcript.trim() === '') {
        throw new Error('Received an empty transcription from Gemini AI.');
      }

      meeting.transcript = transcript;
      meeting.status = 'transcribed';
      meeting.errorMessage = '';
      await meeting.save();

      res.status(200).json({
        status: 'ok',
        message: 'Meeting transcribed successfully',
        meeting
      });

    } catch (transcribeError) {
      meeting.status = 'failed';
      meeting.errorMessage = transcribeError.message || 'Transcription processing failed.';
      await meeting.save();

      res.status(500).json({
        status: 'error',
        message: transcribeError.message || 'Transcription could not be completed. Please try again.',
        meeting
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Analyze meeting transcript using Gemini API (Summary, Key Points, Decisions, Action Items)
 * @route  POST /api/meetings/:id/analyze
 */
export const analyzeMeeting = async (req, res, next) => {
  const { id } = req.params;
  const force = req.body.force === true;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    if (!meeting.transcript || meeting.transcript.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Meeting transcript is missing or empty. Please generate a transcript before running AI analysis.'
      });
    }

    // Idempotency check
    if (meeting.status === 'completed' && meeting.summary && !force) {
      return res.status(200).json({
        status: 'ok',
        message: 'Meeting analysis already completed.',
        meeting
      });
    }

    if (meeting.status === 'analyzing' && !force) {
      return res.status(200).json({
        status: 'ok',
        message: 'Meeting analysis is currently in progress. Please wait.',
        meeting
      });
    }

    meeting.status = 'analyzing';
    meeting.errorMessage = '';
    await meeting.save();

    try {
      const analysis = await analyzeMeetingTranscript(meeting.transcript, id);

      meeting.summary = analysis.summary;
      meeting.keyPoints = analysis.keyPoints;
      meeting.decisions = analysis.decisions;
      meeting.actionItems = analysis.actionItems;
      meeting.status = 'completed';
      meeting.errorMessage = '';
      await meeting.save();

      res.status(200).json({
        status: 'ok',
        message: 'Meeting analysis completed successfully',
        meeting
      });

    } catch (analysisError) {
      meeting.status = 'failed';
      meeting.errorMessage = analysisError.message || 'Meeting analysis processing failed.';
      await meeting.save();

      res.status(500).json({
        status: 'error',
        message: analysisError.message || 'Meeting analysis could not be completed. Please try again.',
        meeting
      });
    }

  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get aggregated workspace statistics from MongoDB
 * @route  GET /api/meetings/stats
 */
export const getMeetingStats = async (req, res, next) => {
  try {
    const stats = await Meeting.getStats();

    res.status(200).json({
      status: 'ok',
      message: 'Workspace statistics calculated successfully',
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get all meetings (sorted by newest first, optimized projection)
 * @route  GET /api/meetings
 */
export const getMeetings = async (req, res, next) => {
  try {
    // Project only fields needed for cards to optimize payload performance
    const meetings = await Meeting.find({}, {
      title: 1,
      originalFileName: 1,
      fileSize: 1,
      mimeType: 1,
      status: 1,
      summary: 1,
      decisions: 1,
      actionItems: 1,
      createdAt: 1,
      updatedAt: 1
    }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'ok',
      count: meetings.length,
      meetings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single meeting by ID (includes full transcript & details)
 * @route  GET /api/meetings/:id
 */
export const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    res.status(200).json({
      status: 'ok',
      meeting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete meeting and its corresponding audio file
 * @route  DELETE /api/meetings/:id
 */
export const deleteMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    if (meeting.filePath) {
      const fullPath = path.isAbsolute(meeting.filePath)
        ? meeting.filePath
        : path.join(UPLOADS_DIR, meeting.filePath);

      try {
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
      } catch (fileErr) {
        console.warn(`⚠️ Note: Could not delete audio file on disk (${meeting.filePath}):`, fileErr.message);
      }
    }

    await Meeting.findByIdAndDelete(id);

    res.status(200).json({
      status: 'ok',
      message: 'Meeting deleted successfully',
      id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Toggle or update action item completion status
 * @route  PATCH /api/meetings/:id/action-items/:itemIndex
 */
export const toggleActionItem = async (req, res, next) => {
  try {
    const { id, itemIndex } = req.params;
    const index = parseInt(itemIndex, 10);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action item index.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    if (!Array.isArray(meeting.actionItems) || index >= meeting.actionItems.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Action item not found at specified index.'
      });
    }

    const completed = typeof req.body.completed === 'boolean'
      ? req.body.completed
      : !meeting.actionItems[index].completed;

    meeting.actionItems[index].completed = completed;
    await meeting.save();

    res.status(200).json({
      status: 'ok',
      message: `Action item marked as ${completed ? 'completed' : 'pending'}`,
      actionItem: meeting.actionItems[index],
      meeting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Ask a question about the current meeting transcript (Ask MeetAura)
 * @route  POST /api/meetings/:id/ask
 */
export const askQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid meeting ID format.'
      });
    }

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid question about this meeting.'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        status: 'error',
        message: 'Meeting not found.'
      });
    }

    if (!meeting.transcript || meeting.transcript.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'This meeting does not have a transcript yet. Please generate a transcript first.'
      });
    }

    const result = await askMeetingQuestion(meeting.transcript, question, id);

    res.status(200).json({
      status: 'ok',
      question: question.trim(),
      answer: result.answer
    });
  } catch (error) {
    next(error);
  }
};


