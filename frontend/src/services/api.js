const API_BASE = '/api';

/**
 * Safe JSON parser for HTTP responses
 */
async function parseResponse(res, fallbackMessage = 'An unexpected error occurred') {
  try {
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      status: 'error',
      message: res.statusText || fallbackMessage
    };
  }
}

/**
 * Health check endpoint service
 */
export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`API health check failed with status: ${res.status}`);
    }
    return await parseResponse(res, 'Health check failed');
  } catch (error) {
    console.error('Failed to contact MeetAura backend:', error);
    return { status: 'offline', error: error.message };
  }
}

/**
 * Real Meeting API Endpoints (Stage 2, 3, 4 & 5 Workspace Integration)
 */
export const meetingApi = {
  /**
   * Fetch aggregated workspace statistics from MongoDB
   */
  getMeetingStats: async () => {
    const res = await fetch(`${API_BASE}/meetings/stats`);
    const data = await parseResponse(res, 'Failed to fetch workspace statistics');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch workspace statistics');
    }
    return data.stats || {
      totalMeetings: 0,
      transcribedMeetings: 0,
      completedMeetings: 0,
      totalActionItems: 0
    };
  },

  /**
   * Fetch all meetings from MongoDB
   */
  getMeetings: async () => {
    const res = await fetch(`${API_BASE}/meetings`);
    const data = await parseResponse(res, 'Failed to fetch meetings');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch meetings');
    }
    return data.meetings || [];
  },

  /**
   * Fetch single meeting by ID
   */
  getMeetingById: async (id) => {
    const res = await fetch(`${API_BASE}/meetings/${id}`);
    const data = await parseResponse(res, 'Failed to fetch meeting details');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch meeting details');
    }
    return data.meeting;
  },

  /**
   * Upload meeting audio file (multipart/form-data)
   */
  uploadMeetingAudio: async (formData) => {
    const res = await fetch(`${API_BASE}/meetings/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await parseResponse(res, 'Failed to upload audio');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload audio');
    }
    return data;
  },

  /**
   * Request Gemini AI Audio Transcription
   */
  transcribeMeeting: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/meetings/${id}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    });
    const data = await parseResponse(res, 'Failed to generate transcription');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to generate transcription');
    }
    return data;
  },

  /**
   * Request Gemini AI Meeting Analysis: Summary, Key Points, Decisions, Action Items
   */
  analyzeMeeting: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/meetings/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    });
    const data = await parseResponse(res, 'Failed to analyze meeting');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to analyze meeting');
    }
    return data;
  },

  /**
   * Delete meeting by ID
   */
  deleteMeeting: async (id) => {
    const res = await fetch(`${API_BASE}/meetings/${id}`, {
      method: 'DELETE',
    });
    const data = await parseResponse(res, 'Failed to delete meeting');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete meeting');
    }
    return data;
  },

  /**
   * Toggle action item completed status
   */
  toggleActionItem: async (id, itemIndex, completed) => {
    const res = await fetch(`${API_BASE}/meetings/${id}/action-items/${itemIndex}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typeof completed === 'boolean' ? { completed } : {}),
    });
    const data = await parseResponse(res, 'Failed to update action item');
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update action item');
    }
    return data;
  }
};


