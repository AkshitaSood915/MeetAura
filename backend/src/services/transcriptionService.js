import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { config } from '../config/env.js';
import { UPLOADS_DIR } from '../middleware/uploadMiddleware.js';

function getMimeType(filePath, fallbackMime) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mp3';
    case '.wav':
      return 'audio/wav';
    case '.m4a':
      return 'audio/m4a';
    case '.mp4':
      return 'video/mp4';
    default:
      return fallbackMime || 'audio/mp3';
  }
}

function cleanGeminiErrorMessage(error) {
  const msg = error.message || '';
  if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID') || msg.includes('403')) {
    return 'Invalid Gemini API key. Please verify your GEMINI_API_KEY in backend/.env.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
    return 'Gemini API rate limit or quota reached. Please try again in a few moments.';
  }
  if (msg.includes('model not found') || msg.includes('404')) {
    return 'Gemini transcription model unavailable. Please try again.';
  }
  return msg || 'Transcription could not be completed with Gemini AI.';
}

export async function transcribeAudioFile(relativeOrFullPath, fallbackMime, meetingId = 'unknown') {
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
  }

  const fullPath = path.isAbsolute(relativeOrFullPath)
    ? relativeOrFullPath
    : path.join(UPLOADS_DIR, relativeOrFullPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Audio file not found on disk: ${path.basename(fullPath)}`);
  }

  const mimeType = getMimeType(fullPath, fallbackMime);
  const fileSize = fs.statSync(fullPath).size;

  console.log(`🎙️ Starting transcription for meeting: ${meetingId} (${path.basename(fullPath)}, ${Math.round(fileSize / 1024)} KB)`);

  const genAI = new GoogleGenerativeAI(apiKey);
  // Try gemini-1.5-flash which has broad stable availability across all Google AI API keys
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const transcriptionPrompt = `
You are an expert audio transcription assistant.
Your task is to provide an accurate, high-fidelity transcript of the provided audio recording.

Follow these strict rules:
1. Transcribe the complete recording chronologically from start to finish.
2. Do NOT summarize or shorten the conversation.
3. Do NOT invent words, facts, or assumptions that are not present in the audio.
4. Preserve speaker names and technical terminology accurately where audible.
5. If multiple speakers are distinguishable, label them chronologically as "Speaker 1:", "Speaker 2:", etc., or with their stated names if explicitly introduced.
6. If a word or phrase is genuinely unclear or distorted, transcribe it as [inaudible].
7. Do NOT include any introductory greetings, commentary, markdown code blocks, or conversational meta-text.
8. Return ONLY the raw transcribed text with clear speaker labels and paragraph breaks.
`.trim();

  let fileManager = null;
  let uploadResult = null;

  try {
    let transcriptResult = '';

    if (fileSize < 15 * 1024 * 1024) {
      const audioBuffer = fs.readFileSync(fullPath);
      const base64Audio = audioBuffer.toString('base64');

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        { text: transcriptionPrompt }
      ]);

      const response = await result.response;
      transcriptResult = response.text();
    } else {
      fileManager = new GoogleAIFileManager(apiKey);
      uploadResult = await fileManager.uploadFile(fullPath, {
        mimeType,
        displayName: `meeting-${meetingId}`,
      });

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri
          }
        },
        { text: transcriptionPrompt }
      ]);

      const response = await result.response;
      transcriptResult = response.text();
    }

    if (!transcriptResult || transcriptResult.trim() === '') {
      throw new Error('Gemini returned an empty or invalid transcription.');
    }

    console.log(`✅ Transcription completed for meeting: ${meetingId}`);
    return transcriptResult.trim();

  } 
  catch (error) {
  console.error('❌ ORIGINAL GEMINI TRANSCRIPTION ERROR:');
  console.error(error);
  console.error('Message:', error?.message);
  console.error('Status:', error?.status);
  console.error('Details:', error?.errorDetails);

  const cleanMsg = cleanGeminiErrorMessage(error);
  console.error(`❌ Transcription failed for meeting: ${meetingId} - ${cleanMsg}`);

  throw new Error(cleanMsg);
  }
   finally {
    if (fileManager && uploadResult && uploadResult.file && uploadResult.file.name) {
      try {
        await fileManager.deleteFile(uploadResult.file.name);
      } catch (cleanupErr) {
        // Non-fatal
      }
    }
  }
}

export default {
  transcribeAudioFile
};
