# MeetAura

## AI-Powered Meeting Intelligence

MeetAura is a full-stack AI-powered meeting intelligence application that converts recorded meetings into structured and actionable information.

Users can upload a meeting recording and get an AI-generated:

- Meeting Summary
- Key Discussion Points
- Decisions
- Action Items
- Task Owners & Deadlines
- Full Transcript

The goal is simple: **turn meeting conversations into clear next steps.**

---

## Features

- Upload meeting audio/video recordings
- Drag-and-drop file upload
- AI-powered transcription
- AI-generated meeting summaries
- Key discussion point extraction
- Decision extraction
- Action item extraction
- Owner and deadline identification
- Full meeting transcript
- Meeting history and details
- Responsive and animated UI
- Error and loading states

---

## How It Works

```text
Meeting Recording
       ↓
     Upload
       ↓
   Transcription
       ↓
  Gemini AI Analysis
       ↓
+----------------------+
| Meeting Summary      |
| Key Points           |
| Decisions            |
| Action Items         |
| Transcript           |
+----------------------+
```

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express.js
- Multer
- Mongoose
- CORS
- dotenv

### AI

- Google Gemini API

Gemini is used for meeting transcription and extracting structured meeting intelligence from the transcript.

---

## Project Structure

```text
MeetAura/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── middleware/
│   ├── uploads/
│   └── package.json
│
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AkshitaSood915/MeetAura.git
cd MeetAura
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd MeetAura/frontend
npm install
npm run dev
```

Open the URL provided by Vite in your browser.

---

## Environment Variables

The backend uses environment variables for configuration.

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

Never commit your `.env` file or expose API keys in frontend code.

MongoDB is supported for persistent meeting data, while the project also includes a local JSON fallback for development/demo usage.

---

## AI Processing

MeetAura uses Gemini to process the meeting in two main stages:

### Transcription

The uploaded recording is processed to generate a conversation transcript.

### Meeting Analysis

The transcript is analyzed to extract:

```text
Summary
Key Points
Decisions
Action Items
Owners
Deadlines
```

The AI is instructed to keep the generated information grounded in the actual transcript and avoid inventing decisions or tasks.

---

## Current Scope

MeetAura focuses on the core meeting intelligence workflow:

```text
Upload → Transcribe → Analyze → Understand → Act
```

The project is currently a **working demonstration** of AI-powered meeting processing and does not include additional enterprise features such as authentication, team collaboration, Slack integration, or calendar integration.

---

## Future Improvements

Potential future improvements include:

- Authentication
- Cloud file storage
- Advanced meeting search
- Meeting sharing
- Productivity tool integrations
- Advanced meeting analytics

---

## Author

**Akshita Sood**

GitHub:  
https://github.com/AkshitaSood915

Project:  
https://github.com/AkshitaSood915/MeetAura
