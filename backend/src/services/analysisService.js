import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

function cleanGeminiErrorMessage(error) {
  const msg = error.message || '';
  if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID') || msg.includes('403')) {
    return 'Invalid Gemini API key. Please verify your GEMINI_API_KEY in backend/.env.';
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
    return 'Gemini API rate limit or quota reached. Please try again in a few moments.';
  }
  if (msg.includes('model not found') || msg.includes('404')) {
    return 'Gemini intelligence model unavailable. Please try again.';
  }
  return msg || 'Meeting analysis could not be completed with Gemini AI.';
}

export async function analyzeTranscript(transcriptText, meetingId = 'unknown') {
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
  }

  if (!transcriptText || typeof transcriptText !== 'string' || transcriptText.trim().length === 0) {
    throw new Error('Cannot analyze empty transcript. Please ensure the meeting has valid dialogue transcribed.');
  }

  console.log(`🧠 Starting meeting intelligence analysis for meeting: ${meetingId} (${transcriptText.length} characters)`);

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash with structured JSON response
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  });

  const prompt = `
You are an expert executive meeting intelligence assistant.
Analyze the following meeting transcript and produce a structured, high-value meeting brief.

Follow these strict extraction guidelines:
1. "summary": A concise executive summary (3-6 sentences) synthesizing the meeting's primary objectives, major topics discussed, and high-level outcomes. Do NOT use filler phrases like "This meeting was about". Write directly and professionally.
2. "keyPoints": An array of strings capturing the most significant discussion points, insights, or obstacles raised.
3. "decisions": An array of strings capturing concrete agreements, approvals, consensus reached, or strategic directions decided upon.
4. "actionItems": An array of concrete task objects extracted strictly from explicit commitments made during the meeting. Each item must have:
   - "task": string describing the specific deliverable or responsibility
   - "owner": string name of the assigned person, or null if no specific owner was designated
   - "deadline": string target date/timeline mentioned, or null if no deadline was stated

CRITICAL RULES:
- Ground all output strictly in the transcript text. Do NOT hallucinate or assume facts not mentioned.
- If no decisions or action items were explicitly made, return empty arrays [].
- Return pure JSON adhering to the specified schema without Markdown fences.

TRANSCRIPT:
"""
${transcriptText}
"""
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let parsed;
    try {
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON response:', responseText);
      throw new Error('Gemini response could not be parsed as valid meeting intelligence JSON.');
    }

    const sanitized = {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      keyPoints: Array.isArray(parsed.keyPoints) 
        ? parsed.keyPoints.filter(p => typeof p === 'string' && p.trim().length > 0).map(p => p.trim())
        : [],
      decisions: Array.isArray(parsed.decisions)
        ? parsed.decisions.filter(d => typeof d === 'string' && d.trim().length > 0).map(d => d.trim())
        : [],
      actionItems: Array.isArray(parsed.actionItems)
        ? parsed.actionItems
            .filter(item => item && typeof item.task === 'string' && item.task.trim().length > 0)
            .map(item => ({
              task: item.task.trim(),
              owner: item.owner && typeof item.owner === 'string' && item.owner.trim() ? item.owner.trim() : null,
              deadline: item.deadline && typeof item.deadline === 'string' && item.deadline.trim() ? item.deadline.trim() : null
            }))
        : []
    };

    console.log(`✅ Intelligence analysis completed for meeting: ${meetingId} (${sanitized.keyPoints.length} points, ${sanitized.decisions.length} decisions, ${sanitized.actionItems.length} action items)`);
    return sanitized;

  } catch (error) {
    const cleanMsg = cleanGeminiErrorMessage(error);
    console.error(`❌ Meeting analysis failed for meeting: ${meetingId} - ${cleanMsg}`);
    throw new Error(cleanMsg);
  }
}

export default {
  analyzeTranscript
};
