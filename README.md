# ⚡ CircleChat — Real-Time Conversation Platform

> A production-grade, full-stack team messaging and conversation platform engineered with **Node.js, Express, Socket.IO v4, MongoDB, React 19, Tailwind CSS, and Google Gemini AI**.

![CircleChat Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

---

## 🌟 Overview

**CircleChat** is a high-performance team conversation platform designed for modern engineering and product teams. It replaces generic chat clones with sub-millisecond WebSocket message propagation, WhatsApp-style delivery & read receipts, cryptographic session isolation, real-time live platform telemetry, and Google Gemini AI conversation synthesis ("Catch Me Up").

---

## ✨ Key Features

### ⚡ Real-Time Messaging Engine
- **Sub-Millisecond WebSockets:** Persistent bidirectional communication powered by Socket.io v4 with automatic reconnect and room multiplexing.
- **WhatsApp-Style Delivery Receipts:** Multi-state visual confirmations:
  - 🕒 `Pending`
  - ✓ `Sent` (server received)
  - ✓✓ (Gray) `Delivered` (delivered to recipient client)
  - ✓✓ (Cyan/Blue) `Read` (viewed by recipient in active viewport)
- **Active Typing Cues & Online Presence:** Real-time user typing indicators and instant online/offline presence tracking across 1-on-1 direct messages and group channels.

### 🤖 Google Gemini AI "Catch Me Up"
- **Automated Conversation Synthesis:** Summarizes missed messages into structured executive recaps, key decisions made, and pending action items.
- **Unread vs. All Mode:** Toggle between synthesizing only unread messages or the last 50 conversation messages.
- **Resilient Fallback Heuristics:** Offline keyword and task-detection heuristic engine ensures summaries are always delivered even during external API downtime.

### 🛡️ Enterprise-Grade Security & Privacy
- **Single-Device Session Guard:** Detects simultaneous logins across devices or IP addresses in real time and automatically terminates outdated sessions.
- **Signed Session Tokens:** Cryptographically signed JWTs stored in secure HTTP-only cookies and bearer headers.
- **Zero Third-Party Profiling:** Team conversations and assets are strictly private with zero advertising tracking.
- **Protected File Storage:** Strict MIME-type inspection and 25 MB quota enforcement per attachment.

### 📊 Real Live Platform Telemetry
- **Zero Mock Data:** Built-in telemetry querying live MongoDB collection counts (`User`, `Message`, `Conversation`).
- **Live Client-to-Server Ping:** Measures actual roundtrip network latency in milliseconds directly from the user's browser.
- **Public Stats Route:** Unauthenticated endpoint (`GET /api/stats`) powering live performance metrics on the landing page.

### 🎨 Adaptive Lumina Interface
- **Dual-Mode Dark & Light Themes:** Curated HSL color palette with smooth CSS variable transitions and glassmorphism.
- **3D Pop-Out Hero Mockup:** Interactive preview with vertical lift, ambient glow aura, and living chat dialog.
- **Seamless Responsive Navigation:** Drawer navigation on mobile devices with full desktop split-pane layout.

### 📎 Media Attachments & In-Chat Search
- **Rich File Previews:** In-app image lightbox viewing, PDF/document download badges, and inline monospace code snippet formatting.
- **In-Chat Message Search:** Instant live filtering of messages within the open conversation, complete with hit highlighting and match navigation.
- **Global Teammate Discovery:** Debounced user directory search with regex escaping to eliminate ReDoS vulnerabilities.
- **Audio Synthesizer:** Real-time Web Audio chimes for sent/received messages and AI synthesis with a global mute toggle.

---

## 🛠️ Architecture & Tech Stack

```
                   ┌────────────────────────────────────────────────────────┐
                   │               React 19 + Vite 8 Frontend               │
                   │        (Tailwind CSS, Lucide React, Web Audio)          │
                   └───────────────▲────────────────────────▲───────────────┘
                                   │ HTTP (Axios)           │ WebSocket (Socket.io)
                                   ▼                        ▼
                   ┌────────────────────────────────────────────────────────┐
                   │               Node.js + Express Backend                │
                   │    (JWT Auth, Rate Limiter, Helmet, Multer Storage)    │
                   └───────────────▲────────────────────────▲───────────────┘
                                   │                        │
                   ┌───────────────┴────┐          ┌────────┴───────────────┐
                   │   MongoDB Atlas    │          │    Google Gemini AI    │
                   │  (Mongoose Models) │          │  (Catch Me Up Pipeline)│
                   └────────────────────┘          └────────────────────────┘
```

| Component | Technologies & Libraries |
|---|---|
| **Frontend** | React 19, Vite 8, React Router v7, Tailwind CSS, Lucide React, Axios, Socket.io Client |
| **Backend** | Node.js (ESM), Express.js, Socket.io v4, Mongoose 8, JSON Web Tokens (JWT), BcryptJS, Multer |
| **AI Synthesis** | Google Generative AI (`gemini-1.5-flash`), Custom Heuristic Rule Fallback Processor |
| **Security** | Helmet HTTP headers, express-rate-limit, CORS origin protection, JWT session versions |
| **Database** | MongoDB Atlas (Users, Conversations, Messages, Session tracking) |

---

## 📁 Repository Structure

```
Messaging Platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, CORS, and constants configuration
│   │   ├── controllers/     # Route handlers (auth, chat, messages, AI, stats)
│   │   ├── middleware/      # Auth verification, upload handler, error handling
│   │   ├── models/          # Mongoose schemas (User, Conversation, Message)
│   │   ├── routes/          # Express API route definitions
│   │   ├── services/        # Gemini AI synthesis & heuristics engine
│   │   ├── socket/          # Socket.io connection handlers & presence logic
│   │   └── server.js        # Server bootstrap & HTTP/WebSocket setup
│   ├── uploads/             # Local attachment storage
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client & API endpoints
│   │   ├── assets/          # Static assets & brand styling
│   │   ├── components/      # Reusable UI components, modals, sidebar, chat views
│   │   ├── context/         # AuthContext, ChatContext, SocketContext, ThemeContext
│   │   ├── hooks/           # Custom React hooks (useSound, useChat)
│   │   ├── pages/           # LandingPage, ChatPage, LoginPage, RegisterPage
│   │   ├── App.jsx          # Main route definitions & ProtectedRoute
│   │   └── main.jsx         # Application entry point
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Google Gemini API Key**: Optional for AI features (get one free at [Google AI Studio](https://aistudio.google.com/))

---

### 2. Backend Installation & Run

```bash
cd backend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start development server with nodemon
npm run dev
```

The backend server will start on `http://localhost:5000`.

#### Backend Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/circlechat
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

---

### 3. Frontend Installation & Run

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will start on `http://localhost:5173`.

#### Frontend Environment Variables (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📡 API Reference

### System & Telemetry (Public)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service uptime and MongoDB connection health probe |
| `GET` | `/api/stats` | Live platform metrics (total users, messages, channels, max file size) |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and issue JWT token with session versioning |
| `POST` | `/api/auth/logout` | Invalidate active user session |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |

### Conversations & Direct Messages
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/conversations` | List user's active conversations |
| `POST` | `/api/conversations/direct` | Start or retrieve 1-on-1 direct conversation |
| `POST` | `/api/conversations/group` | Create a new group channel |
| `GET` | `/api/conversations/:id` | Get conversation details and participants |
| `PUT` | `/api/conversations/:id` | Update group name, description, or avatar |

### Messages & Attachments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/messages/:conversationId` | Fetch message history (paginated) |
| `POST` | `/api/messages/:conversationId` | Send a text message or file attachment |
| `PUT` | `/api/messages/:id/read` | Mark message as read by current user |

### AI Conversation Synthesis
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/catch-me-up` | Generate Gemini AI summary with decisions & action items |

---

## 🔌 Socket.io Real-Time Events

| Event Name | Direction | Payload Description |
|---|---|---|
| `setup` | Client → Server | Registers authenticated user socket and joins user room |
| `join_conversation` | Client → Server | Joins real-time conversation room for instant broadcasts |
| `leave_conversation` | Client → Server | Leaves conversation room |
| `typing` | Client → Server | Broadcasts typing state to conversation participants |
| `stop_typing` | Client → Server | Clears typing indicator |
| `new_message` | Server → Client | Dispatches incoming message to room participants |
| `message_read` | Server → Client | Broadcasts read receipt updates (`✓✓` blue checks) |
| `presence_change` | Server → Client | Broadcasts user online/offline status updates |
| `session_invalidated` | Server → Client | Forces sign-out when an account logs in from another device |

---

## 🌐 Production Deployment

### Backend (Render / Railway / Fly.io)
1. Point your service to the `backend/` directory.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add environment variables (`NODE_ENV=production`, `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).

### Frontend (Vercel / Netlify)
1. Point your project to the `frontend/` directory.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure environment variables (`VITE_API_URL`, `VITE_SOCKET_URL`).

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built with ❤️ for fast, secure, and intelligent team collaboration.
