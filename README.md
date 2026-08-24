# MeetAura

### Turn conversations into clarity.

MeetAura is an AI-powered meeting intelligence application that transforms recorded meetings into concise, structured, and actionable insights.

Instead of replaying an entire meeting to find what actually matters, MeetAura processes the conversation and brings the important information together in one place.

---

## What does MeetAura do?

Upload a meeting recording and MeetAura generates:

- **AI-powered Transcript** — Follow the complete conversation
- **Meeting Summary** — Understand the meeting at a glance
- **Key Points** — See the most important discussions
- **Decisions** — Know what was actually decided
- **Action Items** — Find out what needs to happen next
- **Owners & Deadlines** — See who is responsible and when

> **From a long conversation to a clear list of what happened and what's next.**

---

## How It Works

```text
        Meeting Recording
               ↓
            Upload
               ↓
         AI Transcription
               ↓
          Gemini Analysis
               ↓
      ┌────────┼────────┐
      ↓        ↓        ↓
   Summary  Decisions  Actions
      ↓        ↓        ↓
          Meeting Brief
               ↓
        Clear Next Steps
```

---

## Key Features

### Smart Meeting Upload
Upload your meeting audio/video through a simple drag-and-drop interface with file validation.

### AI Transcription
Convert the recorded conversation into a readable transcript using Google Gemini.

### Meeting Intelligence
Automatically extract the information that matters most:

- Summary
- Key discussion points
- Decisions
- Action items
- Owners
- Deadlines

### Grounded AI Results
MeetAura is designed to keep generated insights connected to the actual conversation and avoid inventing decisions or tasks that were never discussed.

### Clean Meeting Workspace
Review your meeting intelligence and transcript through a focused, responsive interface.

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
- CORS
- dotenv

### AI

- Google Gemini API

Gemini powers both the meeting transcription and the analysis of the generated transcript.

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
│   │   └── middleware/
│   ├── uploads/
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 18+
- npm
- A Google Gemini API key

### Clone the Repository

```bash
git clone https://github.com/AkshitaSood915/MeetAura.git
cd MeetAura
```

### Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
npm run dev
```

### Frontend

Open another terminal:

```bash
cd MeetAura/frontend
npm install
npm run dev
```

Open the local URL provided by Vite.

---

## Environment Variables

The backend requires:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Keep your API key private and never commit the `.env` file to GitHub.

---

## The AI Pipeline

MeetAura processes every meeting through a simple pipeline:

**Record → Transcribe → Understand → Extract → Act**

### 1. Transcribe

The uploaded recording is processed to generate the conversation transcript.

### 2. Understand

The transcript is passed to Gemini with instructions to understand the context of the meeting.

### 3. Extract

The AI identifies:

- Important discussion points
- Decisions
- Explicit action items
- Responsible people
- Mentioned deadlines

### 4. Act

The final information is presented as a structured meeting brief so users can quickly understand what happened and what needs to happen next.

---

## Why MeetAura?

Meeting recordings are useful, but finding the important information inside them isn't always easy.

MeetAura focuses on the part that comes **after the meeting**:

```text
What happened?
     ↓
What was decided?
     ↓
What needs to happen next?
```

The goal isn't just to create another transcript.

**The goal is to turn conversations into actionable information.**

---

## Current Scope

MeetAura currently focuses on the core meeting intelligence workflow:

```text
Upload
  ↓
Transcribe
  ↓
Analyze
  ↓
Summarize
  ↓
Take Action
```

The project is currently a working demonstration of AI-powered meeting processing.

---

## Future Improvements

Possible future improvements include:

- User authentication
- Cloud-based recording storage
- Advanced meeting search
- Meeting sharing
- Productivity tool integrations
- Cross-meeting insights and analytics

---

## Author

**Akshita Sood**

GitHub:  
https://github.com/AkshitaSood915

Project:  
https://github.com/AkshitaSood915/MeetAura
