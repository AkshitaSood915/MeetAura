import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

/**
 * Validate and sanitize structured analysis response from Gemini
 * @param {any} raw - Parsed JSON object
 * @returns {object} - Clean, validated analysis object
 */
function validateAndSanitizeAnalysis(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      summary: 'Transcript analysis generated.',
      keyPoints: [],
      decisions: [],
      actionItems: []
    };
  }

  // 1. Validate summary
  let summary = '';
  if (typeof raw.summary === 'string') {
    summary = raw.summary.trim();
  } else if (Array.isArray(raw.summary)) {
    summary = raw.summary.join(' ').trim();
  }

  // 2. Validate keyPoints
  let keyPoints = [];
  if (Array.isArray(raw.keyPoints)) {
    keyPoints = raw.keyPoints
      .filter(p => p && typeof p === 'string' && p.trim().length > 0)
      .map(p => p.trim());
  }

  // 3. Validate decisions
  let decisions = [];
  if (Array.isArray(raw.decisions)) {
    decisions = raw.decisions
      .map(d => {
        if (typeof d === 'string') return d.trim();
        if (d && typeof d === 'object' && typeof d.decision === 'string') return d.decision.trim();
        if (d && typeof d === 'object' && typeof d.text === 'string') return d.text.trim();
        return null;
      })
      .filter(d => d && d.length > 0);
  }

  // 4. Validate actionItems
  let actionItems = [];
  if (Array.isArray(raw.actionItems)) {
    actionItems = raw.actionItems
      .filter(item => item && typeof item === 'object' && typeof item.task === 'string' && item.task.trim().length > 0)
      .map(item => {
        let owner = item.owner;
        if (typeof owner === 'string') {
          owner = owner.trim();
          if (['null', 'none', 'n/a', 'unassigned', 'unknown', 'not specified', 'unspecified', ''].includes(owner.toLowerCase())) {
            owner = null;
          }
        } else {
          owner = null;
        }

        let deadline = item.deadline;
        if (typeof deadline === 'string') {
          deadline = deadline.trim();
          if (['null', 'none', 'n/a', 'not specified', 'unspecified', 'tbd', 'none specified', ''].includes(deadline.toLowerCase())) {
            deadline = null;
          }
        } else {
          deadline = null;
        }

        const completed = item.completed === true;

        return {
          task: item.task.trim(),
          owner,
          deadline,
          completed
        };
      });
  }

  return {
    summary: summary || 'Meeting completed with discussion.',
    keyPoints,
    decisions,
    actionItems
  };
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
 * Strip potential markdown json formatting fences from LLM response
 * @param {string} text
 * @returns {string}
 */
function cleanJsonText(text) {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return cleaned;
}

/**
 * Analyze meeting transcript using Gemini AI with model fallback cascade
 * @param {string} transcript - Completed transcript text
 * @param {string} meetingId - Meeting ID for logging
 * @returns {Promise<{ summary: string, keyPoints: string[], decisions: string[], actionItems: Array<{ task: string, owner: string|null, deadline: string|null, completed: boolean }> }>}
 */
export async function analyzeMeetingTranscript(transcript, meetingId = 'unknown') {
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === '') {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
  }

  if (!transcript || transcript.trim() === '') {
    throw new Error('Cannot analyze empty meeting transcript.');
  }

  console.log(`🧠 Starting meeting analysis for meeting: ${meetingId} (${transcript.length} characters)`);

  const genAI = new GoogleGenerativeAI(apiKey);

  const analysisPrompt = `
You are MeetAura's expert meeting intelligence AI.
Your task is to extract structured, factual, and strictly grounded meeting insights from the transcript provided below.

Strict Factual Grounding & Extraction Rules:
1. Grounding: Rely EXCLUSIVELY on facts explicitly stated in the transcript. Do NOT hallucinate or assume details not present.
2. Executive Summary:
   - Provide a concise summary (2 to 4 sentences).
   - Describe the main objective, core conversation, and key outcomes.
   - Do NOT repeat key points word-for-word.
3. Key Discussion Points ("keyPoints"):
   - Extract major discussion topics, requirements, timelines, technical considerations, or blockers.
   - Omit trivial greetings, chatter, filler, or repetitions.
4. Confirmed Decisions ("decisions"):
   - ONLY include points where participants explicitly reached consensus, approved a plan, made a definitive choice, or finalized a resolution (e.g., "We will deploy on Friday", "We agreed to use React").
   - Do NOT classify exploratory discussion, opinions, or suggestions as decisions.
   - If no explicit decision was confirmed in the transcript, return an empty array: []
5. Action Items ("actionItems"):
   - Extract only concrete, actionable deliverables or assigned tasks.
   - "task": The specific task description.
   - "owner": The name of the person explicitly assigned to the task. If unassigned or unclear, return null. Do NOT invent owners.
   - "deadline": The target due date or timeframe explicitly stated (e.g., "Friday", "End of Sprint"). If not mentioned, return null. Do NOT invent deadlines.
   - "completed": false (always false for new tasks).
   - If no actionable tasks exist in the transcript, return an empty array: []

Required JSON Output Schema:
{
  "summary": "Concise factual summary of the meeting.",
  "keyPoints": [
    "Important discussion point 1",
    "Important discussion point 2"
  ],
  "decisions": [
    "Confirmed decision 1"
  ],
  "actionItems": [
    {
      "task": "Specific deliverable",
      "owner": "Person name or null",
      "deadline": "Deadline string or null",
      "completed": false
    }
  ]
}

TRANSCRIPT TO ANALYZE:
"""
${transcript}
"""
`.trim();

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`📡 Attempting meeting analysis with model: ${modelName} for meeting: ${meetingId}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2, // Lower temperature for factual accuracy
        }
      });

      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim() === '') {
        throw new Error('Gemini returned an empty analysis response.');
      }

      const cleanedText = cleanJsonText(text);
      let parsed;
      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error(`Failed to parse Gemini JSON output from model ${modelName}:`, text);
        throw new Error('Malformed JSON received from Gemini AI.');
      }

      const validated = validateAndSanitizeAnalysis(parsed);
      console.log(`✅ Meeting analysis completed with model: ${modelName} for meeting: ${meetingId} (${validated.decisions.length} decisions, ${validated.actionItems.length} tasks)`);
      return validated;

    } catch (modelError) {
      console.warn(`⚠️ Model ${modelName} analysis attempt failed: ${modelError.message}`);
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

  throw lastError || new Error('Meeting analysis could not be completed with available Gemini models.');
}

/**
 * Ask a question about the meeting transcript (Ask MeetAura)
 * @param {string} transcript - Full transcript text
 * @param {string} question - User question
 * @param {string} meetingId - Meeting ID for logging
 * @returns {Promise<{ answer: string }>}
 */
export async function askMeetingQuestion(transcript, question, meetingId = 'unknown') {
  const apiKey = (config.geminiApiKey || process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === '') {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.');
  }

  if (!transcript || transcript.trim() === '') {
    throw new Error('Cannot answer questions for a meeting without a transcript.');
  }

  if (!question || typeof question !== 'string' || question.trim() === '') {
    throw new Error('Please provide a valid question.');
  }

  const cleanQuestion = question.trim().slice(0, 500);

  console.log(`💬 Answering question for meeting: ${meetingId} -> "${cleanQuestion}"`);

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
You are MeetAura, an intelligent and precise AI meeting assistant.
Answer the user's question about the meeting recording based EXCLUSIVELY on the transcript provided below.

Strict Rules:
1. Answer ONLY using facts directly stated or clearly supported in the transcript.
2. If the answer or topic was not discussed or mentioned in the transcript, state clearly: "This topic was not mentioned in the meeting recording."
3. Never invent facts, people, decisions, deadlines, or external context.
4. Keep your answer concise, direct, and factual (1 to 4 sentences max).
5. Do NOT include conversational filler like "According to the transcript..." or meta-commentary.
6. Format your answer with clean readability.

TRANSCRIPT:
"""
${transcript}
"""

USER QUESTION:
${cleanQuestion}
`.trim();

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1, // Highly factual
          maxOutputTokens: 500
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim() !== '') {
        console.log(`✅ Question answered with model: ${modelName} for meeting: ${meetingId}`);
        return {
          answer: text.trim()
        };
      }
    } catch (modelError) {
      console.warn(`⚠️ Model ${modelName} Q&A attempt failed: ${modelError.message}`);
      lastError = modelError;
      if (modelError.message && (modelError.message.includes('API_KEY_INVALID') || modelError.message.includes('403') || modelError.message.includes('unauthorized'))) {
        break;
      }
    }
  }

  throw lastError || new Error('Could not answer question with available Gemini models.');
}

export default {
  analyzeMeetingTranscript,
  askMeetingQuestion
};


