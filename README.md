# ⚡ AI App Builder

A production-level AI-powered web app that turns a natural language description into a live React application — with a Monaco code editor, live iframe preview, version history, and one-click export.

```
User types: "Build a fitness tracker dashboard"
     ↓
GPT-4o generates a complete React + Tailwind component
     ↓
Live preview renders instantly in the browser
     ↓
Edit the code in Monaco — preview hot-refreshes
     ↓
Export the whole project as a ZIP
```

---

## 🧩 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 · Vite · Tailwind CSS          |
| Animation | Framer Motion                           |
| Editor    | Monaco Editor (`@monaco-editor/react`)  |
| Icons     | Lucide React                            |
| Toast     | react-hot-toast                         |
| Export    | JSZip                                   |
| Backend   | FastAPI (Python 3.11+)                  |
| AI        | OpenAI GPT-4o (`gpt-4o`)               |

---

## 📁 Folder Structure

```
ai-app-builder/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── routes/
│   │   └── generate.py          # POST /api/generate
│   ├── services/
│   │   └── ai_service.py        # OpenAI integration
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx              # Root layout & state
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Header.jsx
│       │   ├── PromptPanel.jsx  # Left sidebar — prompt input
│       │   ├── CodeEditor.jsx   # Monaco editor
│       │   ├── PreviewPanel.jsx # iframe live preview
│       │   ├── ComponentTree.jsx
│       │   ├── VersionHistory.jsx
│       │   └── StatusBar.jsx
│       ├── hooks/
│       │   └── useGenerate.js   # Axios API call
│       └── utils/
│           ├── previewTemplate.js  # iframe HTML generator
│           └── exportCode.js       # JSZip export
│
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- An **OpenAI API key** (get one at https://platform.openai.com)

---

### 1 · Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# edit .env and add:  OPENAI_API_KEY=sk-...

# Start the server (port 8000)
python main.py
```

The API will be live at `http://localhost:8000`.  
Health check: `http://localhost:8000/health`

> **Demo mode** — If you don't have an API key, set `DEMO_MODE=true` in `.env` to see a pre-built demo response.

---

### 2 · Frontend

```bash
cd frontend

npm install

# Start the dev server (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔌 API Reference

### `POST /api/generate`

**Request body**
```json
{ "prompt": "Build a fitness tracker dashboard" }
```

**Response**
```json
{
  "code":        "function App() { ... }",
  "description": "A fitness tracker with workout logs...",
  "components":  ["App", "StatCard", "WorkoutList"],
  "version_id":  "uuid-v4"
}
```

| Field        | Type             | Description                             |
|--------------|------------------|-----------------------------------------|
| `code`       | `string`         | Raw JSX/JS (no imports) ready for iframe|
| `description`| `string`         | Human-readable summary                  |
| `components` | `string[]`       | List of component names used            |
| `version_id` | `string` (UUID)  | Unique ID for this generation           |

---

## 🎯 Features

| Feature             | Details                                                     |
|---------------------|-------------------------------------------------------------|
| Prompt input        | Textarea + example quick-fills + ⌘+Enter shortcut          |
| AI code generation  | GPT-4o with a strict JSON response format                   |
| Live preview        | Sandboxed `<iframe>` with React 18 + Tailwind via CDN      |
| Error overlay       | Runtime errors shown inside the preview frame               |
| Monaco editor       | Syntax highlighting, custom dark theme, JSX support         |
| Split / Preview / Code tabs | Switch between layouts                            |
| Component tree      | Visual tree of generated sub-components                     |
| Version history     | Last 30 versions persisted in `localStorage`                |
| Export as ZIP       | Standalone HTML + full Vite project                         |
| Open in new tab     | Preview the app full-screen                                 |

---

## 🔐 Security Notes

- The iframe uses `sandbox="allow-scripts allow-same-origin"` — no form submissions, popups, or top-level navigation from generated code.
- `OPENAI_API_KEY` is kept server-side only; the frontend never sees it.
- Prompt length is validated (≤ 2000 chars) on the backend.
- No `eval()` is used in the main window — all execution is inside the sandboxed iframe.

---

## 🛠 Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Cannot reach the API server" | Make sure `python main.py` is running on port 8000 |
| Blank preview with no error | Check browser console; the code may be missing an `App` function |
| "OpenAI API key not found" | Add `OPENAI_API_KEY=sk-...` to `backend/.env` |
| Monaco editor doesn't load | Run `npm install` again; check for network errors loading the CDN workers |

---

## 📄 License

MIT — free to use, modify, and distribute.
