const API_BASE = '/api';

/**
 * Health check endpoint service
 */
export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new Error(`API health check failed with status: ${res.status}`);
    }
    return await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
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
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload audio');
    }
    return data;
  },

  /**
   * Request Gemini AI Audio Transcription (Stage 3)
   */
  transcribeMeeting: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/meetings/${id}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to generate transcription');
    }
    return data;
  },

  /**
   * Request Gemini AI Meeting Analysis: Summary, Key Points, Decisions, Action Items (Stage 4)
   */
  analyzeMeeting: async (id, force = false) => {
    const res = await fetch(`${API_BASE}/meetings/${id}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ force }),
    });
    const data = await res.json();
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
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete meeting');
    }
    return data;
  }
};
