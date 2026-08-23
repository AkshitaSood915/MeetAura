import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'meetings.json');

// Ensure data directory exists for resilient local file persistence
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readLocalData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        ...item,
        actionItems: Array.isArray(item.actionItems)
          ? item.actionItems.map(ai => ({
              task: ai.task || '',
              owner: ai.owner || null,
              deadline: ai.deadline || null,
              completed: Boolean(ai.completed)
            }))
          : []
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local meetings data:', err);
  }
}

// 1. Mongoose Schema Definition
const actionItemSchema = new mongoose.Schema({
  task: { type: String, required: true },
  owner: { type: String, default: null },
  deadline: { type: String, default: null },
  completed: { type: Boolean, default: false }
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    index: true,
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
  },
  filePath: {
    type: String,
    required: [true, 'Stored file path is required'],
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  mimeType: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['uploaded', 'transcribing', 'transcribed', 'analyzing', 'completed', 'failed'],
    default: 'uploaded',
    index: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  transcript: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  keyPoints: {
    type: [String],
    default: [],
  },
  decisions: {
    type: [String],
    default: [],
  },
  actionItems: {
    type: [actionItemSchema],
    default: [],
  },
  errorMessage: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

export const MongooseMeetingModel = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

// 2. Hybrid Persistence Repository (Uses MongoDB when connected, fallback local store when offline)
export const Meeting = {
  create: async (meetingData) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeetingModel.create(meetingData);
    }
    
    const id = new mongoose.Types.ObjectId().toString();
    const now = new Date().toISOString();
    const newRecord = {
      _id: id,
      id: id,
      title: meetingData.title,
      originalFileName: meetingData.originalFileName,
      filePath: meetingData.filePath,
      fileSize: meetingData.fileSize || 0,
      mimeType: meetingData.mimeType || '',
      status: meetingData.status || 'uploaded',
      duration: meetingData.duration || 0,
      transcript: meetingData.transcript || '',
      summary: meetingData.summary || '',
      keyPoints: meetingData.keyPoints || [],
      decisions: meetingData.decisions || [],
      actionItems: meetingData.actionItems || [],
      errorMessage: meetingData.errorMessage || '',
      createdAt: now,
      updatedAt: now
    };

    const list = readLocalData();
    list.unshift(newRecord);
    writeLocalData(list);
    return newRecord;
  },

  find: (filter = {}, projection = null) => {
    if (mongoose.connection.readyState === 1) {
      return MongooseMeetingModel.find(filter, projection);
    }

    const executeFind = (sortCriteria) => {
      let list = readLocalData();
      if (filter && Object.keys(filter).length > 0) {
        list = list.filter(item => {
          return Object.entries(filter).every(([k, v]) => item[k] === v);
        });
      }

      if (sortCriteria && typeof sortCriteria === 'object') {
        const [sortKey, sortDir] = Object.entries(sortCriteria)[0] || ['createdAt', -1];
        list.sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];
          if (sortDir === -1) {
            return new Date(valB) - new Date(valA);
          }
          return new Date(valA) - new Date(valB);
        });
      } else {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      // If projection specifies excluding transcript
      if (projection && projection.transcript === 0) {
        return list.map(m => {
          const { transcript, ...rest } = m;
          return rest;
        });
      }
      return list;
    };

    const queryPromise = Promise.resolve(executeFind());
    queryPromise.sort = (sortCriteria) => {
      return Promise.resolve(executeFind(sortCriteria));
    };
    return queryPromise;
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeetingModel.findById(id);
    }

    const list = readLocalData();
    const doc = list.find(m => String(m._id) === String(id) || String(m.id) === String(id));
    if (!doc) return null;

    return {
      ...doc,
      save: async function() {
        const currentList = readLocalData();
        const idx = currentList.findIndex(m => String(m._id) === String(id) || String(m.id) === String(id));
        this.updatedAt = new Date().toISOString();
        if (idx !== -1) {
          currentList[idx] = { ...this };
          writeLocalData(currentList);
        }
        return this;
      }
    };
  },

  findByIdAndUpdate: async (id, updateData, options = {}) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeetingModel.findByIdAndUpdate(id, updateData, { new: true, ...options });
    }

    const list = readLocalData();
    const idx = list.findIndex(m => String(m._id) === String(id) || String(m.id) === String(id));
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeLocalData(list);
      return list[idx];
    }
    return null;
  },

  findByIdAndDelete: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeetingModel.findByIdAndDelete(id);
    }

    const list = readLocalData();
    const index = list.findIndex(m => String(m._id) === String(id) || String(m.id) === String(id));
    if (index !== -1) {
      const removed = list.splice(index, 1)[0];
      writeLocalData(list);
      return removed;
    }
    return null;
  },

  getStats: async () => {
    if (mongoose.connection.readyState === 1) {
      const allMeetings = await MongooseMeetingModel.find({}, { status: 1, actionItems: 1 });
      const totalMeetings = allMeetings.length;
      const transcribedMeetings = allMeetings.filter(m => ['transcribed', 'analyzing', 'completed'].includes(m.status)).length;
      const completedMeetings = allMeetings.filter(m => m.status === 'completed').length;
      const totalActionItems = allMeetings.reduce((acc, m) => acc + (m.actionItems ? m.actionItems.length : 0), 0);

      return {
        totalMeetings,
        transcribedMeetings,
        completedMeetings,
        totalActionItems
      };
    }

    const list = readLocalData();
    const totalMeetings = list.length;
    const transcribedMeetings = list.filter(m => ['transcribed', 'analyzing', 'completed'].includes(m.status)).length;
    const completedMeetings = list.filter(m => m.status === 'completed').length;
    const totalActionItems = list.reduce((acc, m) => acc + (m.actionItems ? m.actionItems.length : 0), 0);

    return {
      totalMeetings,
      transcribedMeetings,
      completedMeetings,
      totalActionItems
    };
  }
};

export default Meeting;
