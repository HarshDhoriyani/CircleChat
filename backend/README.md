# CircleChat Backend — Real-Time MERN Chat & AI Platform

Production-ready backend for **CircleChat** built using **Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT Authentication, Multer/Cloudinary, and Google Gemini AI**.

---

## 🏗️ Architecture & Folder Structure

```
backend/
├── .env.example                     # Environment variables template
├── .env                             # Active environment configuration
├── package.json                     # Dependencies & scripts
├── README.md                        # Documentation
├── uploads/                         # Local fallback file storage directory
└── src/
    ├── server.js                    # HTTP & Socket.io server bootstrap
    ├── app.js                       # Express app configuration & middleware
    ├── config/
    │   ├── db.js                    # MongoDB connection & reconnect handler
    │   ├── cloudinary.js            # Cloudinary SDK setup
    │   └── constants.js             # Sockets, limits, roles, status constants
    ├── models/
    │   ├── User.js                  # User schema & password comparison
    │   ├── Conversation.js          # Direct & Group conversation schema
    │   └── Message.js               # Message schema with attachments & readBy
    ├── controllers/
    │   ├── authController.js        # Auth actions (register, login, logout, getMe)
    │   ├── userController.js        # User directory & search
    │   ├── conversationController.js# Group & direct chat operations
    │   ├── messageController.js     # Paginated messages, send & read receipts
    │   ├── uploadController.js      # Media uploads
    │   └── aiController.js          # Catch Me Up conversation summarizer
    ├── routes/
    │   ├── index.js                 # Master API router (/api)
    │   ├── authRoutes.js            # /api/auth
    │   ├── userRoutes.js            # /api/users
    │   ├── conversationRoutes.js    # /api/conversations
    │   ├── uploadRoutes.js          # /api/upload
    │   └── aiRoutes.js              # /api/ai
    ├── middleware/
    │   ├── authMiddleware.js        # JWT verify (Bearer & cookie)
    │   ├── errorMiddleware.js       # Centralized error handler & 404
    │   ├── uploadMiddleware.js      # Multer file size & type validation
    │   └── rateLimitMiddleware.js   # Rate limiters for auth & AI
    ├── services/
    │   ├── authService.js           # Password hashing & JWT generation
    │   ├── chatService.js           # Conversation operations & message persistence
    │   ├── uploadService.js         # Cloudinary / local file processor
    │   └── aiService.js             # Google Gemini AI conversation synthesis
    ├── sockets/
    │   ├── socketManager.js         # Socket.io lifecycle & CORS configuration
    │   ├── socketAuthMiddleware.js  # Socket handshake JWT verification
    │   ├── chatHandlers.js          # Live messaging, typing events, read receipts
    │   └── presenceHandlers.js      # Online/offline presence tracking
    └── utils/
        ├── apiResponse.js           # Standardized { success, message, data } helper
        ├── apiError.js              # Custom ApiError class
        ├── asyncHandler.js          # Async wrapper
        └── logger.js                # Timestamped color logger
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection (MongoDB URI)
MONGODB_URI=mongodb://127.0.0.1:27017/aetherchat

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_aether_chat_2026
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7

# Cloudinary Storage (Optional - falls back to local uploads if omitted)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Provider (Google Gemini API for Catch Me Up summaries)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start MongoDB
Ensure MongoDB is running locally (or provide a MongoDB Atlas URI in `.env`):
```bash
# Windows / Mac / Linux local MongoDB service
mongod
```

### 3. Run the Backend Server
```bash
# Development mode with hot-reloading (nodemon)
npm run dev

# Production mode
npm start
```
The server will start at **http://localhost:5000** with Socket.io enabled.

---

## 📡 REST API Reference

All responses follow the standardized format:
```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token & cookie | No |
| `POST` | `/api/auth/logout` | Clear cookie and set user offline | Yes |
| `GET` | `/api/auth/me` | Get currently authenticated user profile | Yes |
| `PATCH`| `/api/auth/profile` | Update display name, avatar, custom status | Yes |

### Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/search?q=alex` | Search users by name, username, or email | Yes |
| `GET` | `/api/users` | Get user directory (up to 100) | Yes |
| `GET` | `/api/users/:id` | Get user profile by ID | Yes |

### Conversations & Messages (`/api/conversations`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/conversations` | Get all conversations for current user | Yes |
| `GET` | `/api/conversations/:id` | Get single conversation details | Yes |
| `POST` | `/api/conversations/direct` | Start or get 1-to-1 conversation with `recipientId` | Yes |
| `POST` | `/api/conversations/group` | Create group (`name`, `description`, `avatar`, `memberIds`) | Yes |
| `PATCH`| `/api/conversations/group/:id` | Update group name, description, avatar (Admin only) | Yes |
| `POST` | `/api/conversations/group/:id/members` | Add members to group | Yes |
| `DELETE`| `/api/conversations/group/:id/members/:memberId` | Remove member (Admin only) | Yes |
| `POST` | `/api/conversations/group/:id/leave` | Leave group conversation | Yes |
| `GET` | `/api/conversations/:id/messages` | Get paginated message history (`?page=1&limit=50`) | Yes |
| `POST` | `/api/conversations/:id/messages` | Send message (`text`, `attachments`) | Yes |
| `POST` | `/api/conversations/:id/read` | Mark all messages in conversation as read | Yes |
| `POST` | `/api/conversations/:id/summary` | Generate Catch Me Up AI summary | Yes |

### Media Upload (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload` | Upload single image or document (multipart form field `file`) | Yes |

### AI Feature (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/ai/catch-me-up` | Synthesize conversation summary, decisions, actions, and deadlines | Yes |

---

## ⚡ Socket.io Real-Time Events

### Connection Handshake
Clients connect to `http://localhost:5000` with authentication token:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: `Bearer ${jwtToken}`,
  },
});
```

### Client Emitters (Sent from Frontend)
- `join_conversation`: `{ conversationId }` — Joins the conversation room.
- `leave_conversation`: `{ conversationId }` — Leaves the conversation room.
- `send_message`: `{ conversationId, message }` — Broadcasts message to room.
- `typing_start`: `{ conversationId }` — Broadcasts typing start state to room.
- `typing_stop`: `{ conversationId }` — Broadcasts typing stop state to room.
- `mark_as_read`: `{ conversationId, messageId }` — Broadcasts read receipt.

### Server Emitters (Received by Frontend)
- `online_users_list`: `[userId1, userId2, ...]` — Emitted to client on connect.
- `user_status_change`: `{ userId, status: 'online' | 'offline' }` — Broadcasted when user presence changes.
- `receive_message`: `{ conversationId, message }` — Delivered to active room members.
- `user_typing`: `{ conversationId, user: { _id, name, username } }` — Delivered when someone types.
- `user_stop_typing`: `{ conversationId, user }` — Delivered when typing stops.
- `message_read`: `{ conversationId, messageId, userId }` — Delivered when message is read.
