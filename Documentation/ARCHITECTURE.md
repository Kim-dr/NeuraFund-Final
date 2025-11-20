# NeuraFund Architecture Documentation

## System Overview

NeuraFund is a full-stack MERN (MongoDB, Express, React, Node.js) platform that facilitates task-based micro-transactions between university students and local vendors. The system is architected around three core subsystems: Authentication & User Management, Real-Time Communication (Socket.IO), and Payment Processing (IntaSend).

---

## 1. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Student      │  │ Vendor       │  │ Admin        │          │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                       │
│    ┌──────────────────────┼──────────────────────┐              │
│    │   Context API (Auth, Toast, Tracking)      │              │
│    └──────────────────────┼──────────────────────┘              │
└────────────────────────────┼──────────────────────────────────────┘
                             │ HTTPS/WebSocket
         ┌───────────────────┼────────────────────┐
         │                   │                    │
    ┌────▼─────┐      ┌─────▼────────┐    ┌────▼─────┐
    │REST API  │      │Socket.IO     │    │Webhooks  │
    │Endpoints │      │Real-Time     │    │(IntaSend)│
    └────┬─────┘      └─────┬────────┘    └────┬─────┘
         │                   │                  │
┌────────▼───────────────────▼──────────────────▼─────────────────┐
│                    APPLICATION LAYER (Node.js/Express)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Auth Routes   │  │Task Routes   │  │Wallet Routes │          │
│  │& Middleware  │  │& Validation  │  │& Payments    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Rating Routes │  │User Routes   │  │Socket Events │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         External Service Integrations                   │   │
│  │  ┌──────────────┐      ┌──────────────┐               │   │
│  │  │IntaSend SDK  │      │Geolocation   │               │   │
│  │  │(M-Pesa)      │      │(Nominatim)   │               │   │
│  │  └──────────────┘      └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬──────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼────┐         ┌────▼───┐         ┌─────▼─────┐
    │MongoDB  │         │Multer  │         │IntaSend   │
    │Database │         │Storage │         │Payment    │
    └────────┘         └────────┘         │API        │
                                          └───────────┘
```

---

## 2. Client-Server Communication Flow

### HTTP Request/Response Cycle

1. **Authentication Flow**
   - Client submits credentials via `POST /api/auth/login`
   - Server validates password, generates JWT token
   - Token stored in `localStorage` on client
   - Token included in `Authorization: Bearer <token>` header for all subsequent requests

2. **Task Creation Flow**
   - Vendor submits task form → `POST /api/tasks`
   - Server validates input, checks vendor wallet balance
   - Task record created in MongoDB
   - Response contains task ID and status
   - Client updates UI and redirects to dashboard

3. **Real-Time Updates**
   - Client establishes persistent WebSocket connection
   - Joins task-specific rooms via `socket.emit('JOIN_TASK', taskId)`
   - Receives updates via `socket.on('RECEIVE_MESSAGE', handler)`
   - Bi-directional communication for chat and location tracking

---

## 3. Socket.IO Event Flow (Detailed Sequence Diagram)

```
Student Client                    Server                    Vendor Client
     │                              │                             │
     ├──────── socket.connect ──────>│                             │
     │                              │                             │
     ├─ emit('JOIN_TASK', taskId)──>│                             │
     │                              ├─ socket.join(taskId) ──────>│
     │                              │                             │
     │                              │<── emit('JOIN_TASK') ───────┤
     │                              ├──── socket.join(taskId) ────>│
     │                              │                             │
     │    User types message        │                             │
     ├─ emit('SEND_MESSAGE', {  ──>│                             │
     │    taskId,                   │                             │
     │    sender: studentId,        │                             │
     │    message: '...',           │                             │
     │    name: '...',              ├── io.to(taskId).emit ──────>│
     │    profilePic: '...'         │   ('RECEIVE_MESSAGE')       │
     │  })                          │                             │
     │                              │                             │
     │                              │<── echo to student ────────┐
     │<─ emit('RECEIVE_MESSAGE') ───┤                            │
     │   (optimistic, so already    │                            │
     │    shown locally)             │                            │
     │                              │                             │
     │  Vendor starts tracking      │                             │
     ├─ emit('SEND_LOCATION', {  ──>│                             │
     │    taskId,                   │                             │
     │    userId,                   │                             │
     │    lat: xx.xxx,              │ 1. Emit to Nominatim ───────┐
     │    lng: xx.xxx               │    (reverse geocode)        │
     │  })                          │ 2. Merge address           │
     │                              ├─ io.to(taskId).emit ──────>│
     │                              │   ('RECEIVE_LOCATION',     │
     │                              │    {address, lat, lng})    │
     │                              │                             │
     │<─ emit('RECEIVE_LOCATION') ──┤ Vendor sees moving pin    │
     │   Vendor's map updates        │ on live map               │
     │                              │                             │
     │                              │ ~~~ (connection lost) ~~~   │
     ├──────── reconnect ──────────>│ (auto-reconnect logic)     │
     ├─ re-emit('JOIN_TASK') ──────>│                             │
     │                              │                             │
     └──────── disconnect ─────────>│                             │
                                    └─ cleanup room             │
```

**Key Behaviors:**
- **Throttling:** Location updates sent every 5 seconds (UPDATE_INTERVAL = 5000ms)
- **Rooms:** Each task gets a unique Socket.IO room named by `taskId`
- **Message Relay:** Server relays all fields (name, profilePic, timestamp) to ensure rich UI
- **Fallback:** If geolocation fails, "Address lookup unavailable" message shown
- **Timeout:** Nominatim reverse geocoding has 5-second timeout to prevent UI blocking

---

## 4. Database Schema & Entity Relationships

### User Model

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  email: String (unique, indexed),  // Unique identifier
  password: String (bcrypt hash),   // Hashed with bcrypt (12 salt rounds)
  role: String (enum: ['student', 'vendor']), // Determines feature access
  firstName: String,
  lastName: String,
  profilePicUrl: String,            // URL to uploaded profile picture
  
  // Student-specific
  university: String (conditional), // Required if role === 'student'
  studentId: String,
  
  // Vendor-specific
  businessName: String (conditional), // Required if role === 'vendor'
  businessLocation: String,
  goodsType: String,
  
  // Wallet & Reputation
  walletBalance: Number (default: 0, min: 0),
  averageRating: Number (0-5, default: 0),
  totalRatings: Number (default: 0),
  
  // Email Verification
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Indexes:
- { email: 1 } (unique)
- { role: 1 }
- { averageRating: -1 }
```

**Relationships:** One User has many Tasks (as creator), many Tasks (as assignee), many Ratings (as sender/receiver), many Transactions.

---

### Task Model

```javascript
{
  _id: ObjectId,
  
  // Task Details
  description: String (10-1000 chars),
  pickupLocation: String,
  dropoffLocation: String,
  estimatedTime: Number (minutes, 1-1440),
  rewardAmount: Number (currency in KES, >= 1),
  
  // Status Lifecycle
  status: String (enum: ['available', 'in-progress', 'pending-review', 'completed', 'cancelled']),
  
  // References (Foreign Keys)
  createdBy: ObjectId → User (vendor who posted task),
  assignedTo: ObjectId → User (student who claimed task, nullable until claimed),
  
  // Proof of Work
  proof: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number (bytes),
    uploadedAt: Date
  }],
  
  // Review Information
  reviewNotes: String (max 500 chars),
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Indexes:
- { status: 1 }
- { createdBy: 1 }
- { assignedTo: 1 }
- { rewardAmount: -1 }
- { createdAt: -1 }
- { status: 1, rewardAmount: -1 } (compound)
- { createdBy: 1, status: 1 } (compound)
```

**Status Transitions:**
- `available` → `in-progress` (when student claims)
- `in-progress` → `pending-review` (when student uploads proof)
- `pending-review` → `completed` (if vendor approves) OR `in-progress` (if rejected)
- Any status → `cancelled` (if task creator cancels)

---

### Rating Model

```javascript
{
  _id: ObjectId,
  
  // Rating Participants
  fromUser: ObjectId → User (rater),
  toUser: ObjectId → User (rated person),
  
  // Task Reference
  taskId: ObjectId → Task,
  
  // Rating Data
  score: Number (1-5, required),
  comment: String (max 500 chars, optional),
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Indexes:
- { toUser: 1 } (for retrieving ratings of a specific user)
- { fromUser: 1 }
- { taskId: 1 }
- { toUser: 1, score: -1 } (compound, for sorted ratings)
- { fromUser: 1, taskId: 1 } (unique, prevent duplicate ratings)
```

**Constraints:**
- Ratings only possible for `completed` tasks
- Each user can rate another user only once per task (enforced by unique index)
- Self-ratings prevented at application level (fromUser !== toUser)

---

### Transaction Model

```javascript
{
  _id: ObjectId,
  
  // Transaction Metadata
  userId: ObjectId → User,
  type: String (enum: ['deposit', 'withdrawal', 'task-payment', 'task-refund']),
  amount: Number (KES, >= 0.01),
  description: String,
  
  // Task Reference (optional)
  taskId: ObjectId → Task (nullable),
  
  // Payment Status
  status: String (enum: ['pending', 'completed', 'failed']),
  
  // External Integration
  paymentMethod: String (e.g., 'M-Pesa', 'Card'),
  externalTransactionId: String (from IntaSend or payment provider),
  
  // Timestamps
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Indexes:
- { userId: 1 }
- { type: 1 }
- { status: 1 }
- { taskId: 1 }
- { createdAt: -1 }
- { userId: 1, createdAt: -1 } (compound)
- { userId: 1, type: 1 } (compound)
```

**Transaction Flow:**
1. **Deposit (Vendor):** Triggered by `POST /wallet/deposit` → status='completed' (optimistic) → wallet incremented
2. **Withdrawal (Student):** Triggered by `POST /wallet/withdraw` → status='completed' → wallet decremented
3. **Task-Payment (Approval):** Triggered by `PUT /tasks/:id/review` (approved=true) → creates two records (vendor -rewardAmount, student +rewardAmount)

---

## 5. Authentication & Authorization

### JWT Token Structure

```javascript
// Payload (decoded)
{
  userId: "507f1f77bcf86cd799439011",    // User's MongoDB _id
  iat: 1699564800,                       // Issued at (Unix timestamp)
  exp: 1699651200                        // Expiration (24 hours later)
}

// Token stored in: localStorage['token']
// Sent with: Authorization: Bearer <token>
// Verified with: jwt.verify(token, process.env.JWT_SECRET)
```

### Request Authentication Middleware Flow

```
Incoming Request
      │
      ├─ Extract token from Authorization header
      │
      ├─ If no token → 401 "NO_TOKEN"
      │
      ├─ jwt.verify(token, JWT_SECRET)
      │
      ├─ If invalid → 401 "INVALID_TOKEN"
      │
      ├─ If expired → 401 "TOKEN_EXPIRED"
      │
      ├─ Decode userId from payload
      │
      ├─ Query User collection by _id
      │
      ├─ If user not found → 401 "INVALID_TOKEN"
      │
      ├─ [OPTIONAL] Check isEmailVerified flag
      │
      └─ Attach req.user = userData, call next()
```

### Role-Based Access Control (RBAC)

```javascript
// Middleware: authorize(...roles)
// Usage: router.put('/:id/assign', authenticate, isStudent, handleAssign)

// isStudent = authorize('student')
// isVendor = authorize('vendor')

// Flow:
// 1. authenticate middleware runs (extracts user)
// 2. authorize middleware checks req.user.role
// 3. If role not in allowed array → 403 "INSUFFICIENT_PERMISSIONS"
// 4. If role matches → call next()
```

---

## 6. Data Flow for Key User Journeys

### Journey 1: Student Claims Task

```
Student clicks "Claim Task"
    ↓
Frontend: PUT /api/tasks/{taskId}/assign
    ↓
Server auth middleware: Verify JWT, extract studentId
    ↓
isStudent middleware: Check role === 'student'
    ↓
Handler: 
  1. Fetch task from DB
  2. Check status === 'available'
  3. Check createdBy !== studentId (can't claim own task)
  4. Update task.assignedTo = studentId
  5. Update task.status = 'in-progress'
  6. Save to DB
    ↓
Response: { task, success: true }
    ↓
Frontend: 
  1. Update local state with new task
  2. Show toast "Task claimed successfully"
  3. Call startTracking(taskId, studentId)
  4. Emit socket.emit('JOIN_TASK', taskId)
    ↓
Backend Socket listener:
  1. Receive JOIN_TASK event
  2. socket.join(taskId) — add socket to room
  3. Vendor already in room receives location updates
```

### Journey 2: Student Submits Proof, Vendor Reviews & Pays

```
Student selects files
    ↓
Frontend: FormData created with files
    ↓
Frontend: PUT /api/tasks/{taskId}/submit-proof (multipart)
    ↓
Server:
  1. Verify auth, check isStudent
  2. Multer processes files → saves to uploads/task-proofs/
  3. Extract filename, mimetype, size for each file
  4. Update task.proof = [{ filename, originalName, ... }]
  5. Update task.status = 'pending-review'
  6. Save task
    ↓
Response: { task, success: true }
    ↓
Frontend: Show in "My Tasks" under "Pending Review"
    ↓
Vendor sees task in "Pending Review" section
    ↓
Vendor clicks "Review Proof"
    ↓
Frontend: GET /api/tasks/{taskId}/proof/{filename} (for preview)
    ↓
Frontend: Render images/PDFs via ProofReview component
    ↓
Vendor clicks "Approve & Pay"
    ↓
Frontend: PUT /api/tasks/{taskId}/review
  Body: { approved: true, reviewNotes: "" }
    ↓
Server:
  1. Verify auth, check isVendor, check createdBy === vendorId
  2. Check task.status === 'pending-review'
  3. Fetch vendor and student users
  4. Check vendor.walletBalance >= task.rewardAmount
  5. Deduct: vendor.walletBalance -= task.rewardAmount
  6. Credit: student.walletBalance += task.rewardAmount
  7. Save both users
  8. Create 2 Transaction records:
     - { userId: vendorId, type: 'task-payment', amount: -rewardAmount, status: 'completed' }
     - { userId: studentId, type: 'task-payment', amount: +rewardAmount, status: 'completed' }
  9. Update task.status = 'completed'
  10. Save task
    ↓
Response: { task, paymentProcessed: true, success: true }
    ↓
Frontend: 
  1. Show toast "Payment processed"
  2. Redirect task to "Completed" section
  3. Show "Rate Student" button
    ↓
Both users now can rate each other via RatingForm
```

---

## 7. Real-Time Geolocation Tracking

### Location Sharing Pipeline

```
Frontend (Student):
  1. User claims task
  2. startTracking(taskId, userId) called
  3. navigator.geolocation.watchPosition() starts
  4. Every 5 seconds (if location changes):
     - Emit socket.emit('SEND_LOCATION', { taskId, lat, lng, userId })

Backend Socket:
  1. Receive 'SEND_LOCATION' event
  2. Extract { lat, lng, taskId }
  3. Call Nominatim API:
     - URL: https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json
     - Timeout: 5 seconds (AbortController)
  4. Parse response for display_name (address)
  5. Emit to room:
     - io.to(taskId).emit('RECEIVE_LOCATION', {
         userId, lat, lng, address, timestamp
       })

Frontend (Vendor):
  1. Receive 'RECEIVE_LOCATION' event
  2. Update state with new coordinates
  3. React-Leaflet MapContainer re-renders
  4. Marker position updates (smooth animation)
  5. Display: address text + map pin
```

### Error Handling

- **No permission:** User denies geolocation → alert shown
- **GPS timeout:** watchPosition timeout > 10s → silently ignored
- **Nominatim timeout:** Fallback to "Address lookup unavailable"
- **Network error:** Silently continue sending coordinates (server may still have last known position)

---

## 8. File Upload & Storage Architecture

### Multipart Form Data Upload (Multer Configuration)

```javascript
// Destination: uploads/task-proofs/
// Filename pattern: proof-{timestamp}-{randomNumber}.{ext}
// Max file size: 10 MB per file
// Allowed types: image/*, application/pdf

// Upload request flow:
// 1. Frontend creates FormData, appends files
// 2. Server receives: multipart/form-data
// 3. Multer middleware:
//    a. Parse form fields
//    b. Write file to disk at uploads/task-proofs/{filename}
//    c. Attach req.files array to request
//    d. Each file object: { filename, originalname, mimetype, size }
// 4. Handler iterates req.files, extracts metadata
// 5. Stores array in task.proof
// 6. Sends back proof file URLs for client to fetch
```

### File Retrieval with Access Control

```
Request: GET /api/tasks/{taskId}/proof/{filename}
    ↓
Handler:
  1. Verify JWT (authenticate middleware)
  2. Fetch task from DB
  3. Check user is either:
     - Task creator (vendor reviewing)
     - Task assignee (student reviewing)
  4. If not authorized → 403 "ACCESS_DENIED"
  5. Check if filename exists in task.proof array
  6. If not → 404 "PROOF_FILE_NOT_FOUND"
  7. res.sendFile(filePath) — stream file to client
```

---

## 9. Deployment Architecture & Environments

### Development Environment

```
Frontend (React)      Backend (Node.js)      Database (MongoDB)
  :3000    ←──────────→  :5001      ←────────→  localhost:27017
  
Environment Variables:
- REACT_APP_API_URL=http://localhost:5001/api
- REACT_APP_SOCKET_URL=http://localhost:5001
```

### Production Environment (Render + Vercel)

```
Frontend (Vercel)           Backend (Render)         Database (MongoDB Atlas)
  neurafund.vercel.app ←───→ api.neurafund.com ←───→ mongodb+srv://...
  
Environment Variables (Render):
- MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/neurafund
- JWT_SECRET=<strong-random-key>
- INTASEND_SECRET_KEY=<live-key>
- NODE_ENV=production
- PORT=5001 (auto-assigned by Render)

Environment Variables (Vercel):
- REACT_APP_API_URL=https://api.neurafund.com/api
- REACT_APP_SOCKET_URL=https://api.neurafund.com
```

---

## 10. Performance Considerations

### Indexing Strategy

All critical queries are optimized with MongoDB indexes:

- **User lookups:** `{ email: 1 }` for login
- **Task filtering:** `{ status: 1, rewardAmount: -1 }` for browsing
- **Rating aggregation:** `{ toUser: 1, score: -1 }` for user ratings
- **Transaction history:** `{ userId: 1, createdAt: -1 }` for pagination

### Pagination Implementation

```javascript
// Query with limit and skip:
const limit = parseInt(req.query.limit) || 20;
const page = parseInt(req.query.page) || 1;
const skip = (page - 1) * limit;

const tasks = await Task.find(filter).skip(skip).limit(limit);
const total = await Task.countDocuments(filter);

Response: {
  tasks,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
}
```

### Throttling & Rate Limiting

- **Location updates:** 5-second minimum interval (client-side)
- **Socket connections:** Server accepts one connection per socket ID
- **API endpoints:** No explicit rate limiting (can be added via express-rate-limit)

---

## 11. Error Handling Strategy

### Standard Error Response Format

```javascript
{
  success: false,
  error: {
    message: "User-friendly description",
    code: "ERROR_CODE_CONSTANT"
  }
}

// Codes used across platform:
- NO_TOKEN
- INVALID_TOKEN
- TOKEN_EXPIRED
- EMAIL_NOT_VERIFIED
- USER_NOT_FOUND
- TASK_NOT_FOUND
- INSUFFICIENT_BALANCE
- TASK_NOT_AVAILABLE
- NOT_AUTHORIZED
- VALIDATION_ERROR
- etc.
```

### Global Error Handler

```javascript
// At end of server.js:
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});
```

---

## 12. Security Measures

### Password Security

- **Hashing:** bcryptjs with 12 salt rounds
- **Pre-save hook:** Password hashed before user.save()
- **Comparison:** bcrypt.compare() for login verification
- **Never exposed:** Password field excluded from responses with `.select('-password')`

### JWT Security

- **Secret:** Stored in `.env` file (never committed)
- **Expiration:** 24 hours
- **Transport:** HTTPS only in production
- **Storage:** localStorage (client-side, vulnerable to XSS but standard practice)

### CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};
app.use(cors(corsOptions));
```

### Socket.IO CORS

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
```

---

## Summary

NeuraFund's architecture separates concerns into three layers:

1. **Client Layer (React):** Manages UI, handles real-time updates via Socket.IO, stores tokens locally
2. **Application Layer (Node.js/Express):** Validates requests, enforces auth/authorization, orchestrates business logic
3. **Data Layer (MongoDB):** Persists user, task, rating, and transaction data with proper indexing

The system uses **JWT for stateless auth**, **Socket.IO for real-time features**, **Multer for file uploads**, and **IntaSend for payment processing**. All external API calls have timeouts and fallbacks to ensure graceful degradation.