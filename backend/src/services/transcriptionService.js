import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { config } from '../config/env.js';
import { UPLOADS_DIR } from '../middleware/uploadMiddleware.js';

// MIME type normalization helper
function getMimeType(filePath, fallbackMime) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mp3';
    case '.wav':
      return 'audio/wav';
    case '.m4a':
      return 'audio/m4a';
    case '.aac':
      return 'audio/aac';
    case '.ogg':
      return 'audio/ogg';
    case '.webm':
      return 'audio/webm';
    case '.flac':
      return 'audio/flac';
    case '.mp4':
      return 'video/mp4';
    default:
      return fallbackMime || 'audio/mp3';
  }
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.6-flash'
];

/**
 * Transcribe meeting audio file using Gemini API with model fallback cascade
 * @param {string} relativeOrFullPath - Path to the audio file
 * @param {string} fallbackMime - Fallback MIME type if extension check fails
 * @param {string} meetingId - Meeting document ID for secure logging
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudioFile(relativeOrFullPath, fallbackMime, meetingId = 'unknown') {
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === '') {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
  }

  // Resolve absolute file path
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

  // Prepare audio payload once
  let inlineAudioPayload = null;
  if (fileSize < 15 * 1024 * 1024) {
    const audioBuffer = fs.readFileSync(fullPath);
    inlineAudioPayload = {
      mimeType,
      data: audioBuffer.toString('base64'),
    };
  }

  let lastError = null;

  // Try candidate models in order until one succeeds
  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`📡 Attempting transcription with model: ${modelName} for meeting: ${meetingId}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      let transcriptResult = '';

      if (inlineAudioPayload) {
        // Fast path: base64 inline audio (<15MB)
        const result = await model.generateContent([
          { inlineData: inlineAudioPayload },
          { text: transcriptionPrompt }
        ]);

        const response = await result.response;
        transcriptResult = response.text();
      } else {
        // Large file path: GoogleAIFileManager
        if (!fileManager) {
          fileManager = new GoogleAIFileManager(apiKey);
        }
        if (!uploadResult) {
          uploadResult = await fileManager.uploadFile(fullPath, {
            mimeType,
            displayName: `meeting-${meetingId}`,
          });

          // Wait for file state to become ACTIVE if in PROCESSING state
          let fileInfo = await fileManager.getFile(uploadResult.file.name);
          let attempts = 0;
          while (fileInfo.state === 'PROCESSING' && attempts < 20) {
            attempts++;
            console.log(`⏳ Waiting for Google AI file processing (attempt ${attempts}/20)...`);
            await new Promise(r => setTimeout(r, 2000));
            fileInfo = await fileManager.getFile(uploadResult.file.name);
          }
          if (fileInfo.state === 'FAILED') {
            throw new Error('Google AI File Processing failed for this video file.');
          }
        }

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

      if (transcriptResult && transcriptResult.trim() !== '') {
        console.log(`✅ Transcription completed with model: ${modelName} for meeting: ${meetingId}`);
        
        // Clean up provider upload
        if (fileManager && uploadResult && uploadResult.file && uploadResult.file.name) {
          try {
            await fileManager.deleteFile(uploadResult.file.name);
          } catch (cleanupErr) {
            // Non-fatal cleanup log
          }
        }

        return transcriptResult.trim();
      }

    } catch (modelError) {
      console.warn(`⚠️ Model ${modelName} transcription attempt failed: ${modelError.message}`);
      lastError = modelError;
      // If error is invalid API key or auth, stop immediately
      if (modelError.message && (modelError.message.includes('API_KEY_INVALID') || modelError.message.includes('403') || modelError.message.includes('unauthorized'))) {
        break;
      }
      // If rate limited or high demand, brief pause before cascade fallback
      if (modelError.message && (modelError.message.includes('429') || modelError.message.includes('503'))) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }

  // Provider cleanup on failure
  if (fileManager && uploadResult && uploadResult.file && uploadResult.file.name) {
    try {
      await fileManager.deleteFile(uploadResult.file.name);
    } catch (cleanupErr) {
      // Non-fatal
    }
  }

  throw lastError || new Error('Transcription could not be completed with available Gemini models.');
}

export default {
  transcribeAudioFile
};

