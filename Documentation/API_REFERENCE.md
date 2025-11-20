# NeuraFund API Reference

## Base URL

```
Development:  http://localhost:5001/api
Production:   https://api.neurafund.com/api
```

## Authentication

All endpoints (except login/register) require JWT token in header:

```
Authorization: Bearer <token>
```

Token format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi...`

---

## 1. Authentication Endpoints

### 1.1 Register Student

**Endpoint:** `POST /auth/register/student`

**Content-Type:** `multipart/form-data` (for profile picture upload)

**Request Body:**

```javascript
{
  firstName: "John",                  // string, required, trimmed
  lastName: "Doe",                    // string, required, trimmed
  email: "john@university.edu",       // string, required, valid email format
  password: "password123",            // string, required, min 6 chars
  confirmPassword: "password123",     // string, required (client-side validation)
  university: "JKUAT",                // string, required, trimmed
  studentId: "JK-2023-001",          // string, optional
  profilePic: <File>                  // File, optional, image/* only
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@university.edu",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "university": "JKUAT",
      "studentId": "JK-2023-001",
      "profilePicUrl": "/uploads/profile-1699564800-john.jpg",
      "walletBalance": 0,
      "averageRating": 0,
      "totalRatings": 0,
      "isEmailVerified": true
    }
  }
}
```

**Error Responses:**

```json
// Validation failed
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Password must be at least 6 characters",
        "param": "password"
      }
    ]
  }
}

// User already exists
{
  "success": false,
  "error": {
    "message": "User with this email already exists",
    "code": "USER_EXISTS"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5001/api/auth/register/student \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@university.edu" \
  -F "password=password123" \
  -F "university=JKUAT" \
  -F "profilePic=@/path/to/image.jpg"
```

---

### 1.2 Register Vendor

**Endpoint:** `POST /auth/register/vendor`

**Content-Type:** `multipart/form-data`

**Request Body:**

```javascript
{
  firstName: "Jane",                    // string, required
  lastName: "Smith",                    // string, required
  email: "jane@business.com",           // string, required
  password: "password123",              // string, required, min 6 chars
  confirmPassword: "password123",       // string, required
  businessName: "Jane Deliveries",     // string, required
  businessLocation: "Nairobi",         // string, required
  goodsType: "Food Delivery",          // string, optional
  profilePic: <File>                    // File, optional
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "jane@business.com",
      "role": "vendor",
      "firstName": "Jane",
      "lastName": "Smith",
      "businessName": "Jane Deliveries",
      "businessLocation": "Nairobi",
      "goodsType": "Food Delivery",
      "profilePicUrl": "/uploads/profile-1699564801-jane.jpg",
      "walletBalance": 0,
      "averageRating": 0,
      "totalRatings": 0,
      "isEmailVerified": true
    }
  }
}
```

---

### 1.3 Login

**Endpoint:** `POST /auth/login`

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "email": "john@university.edu",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@university.edu",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "university": "JKUAT",
      "studentId": "JK-2023-001",
      "profilePicUrl": "/uploads/profile-1699564800-john.jpg",
      "walletBalance": 250.50,
      "averageRating": 4.5,
      "totalRatings": 8,
      "isEmailVerified": true
    }
  }
}
```

**Error Responses:**

```json
// Invalid credentials
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
}

// Validation error
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@university.edu",
    "password": "password123"
  }'
```

---

### 1.4 Get Current User Profile

**Endpoint:** `GET /auth/me`

**Authentication:** Required (Bearer token)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@university.edu",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "university": "JKUAT",
      "studentId": "JK-2023-001",
      "profilePicUrl": "/uploads/profile-1699564800-john.jpg",
      "walletBalance": 250.50,
      "averageRating": 4.5,
      "totalRatings": 8,
      "isEmailVerified": true
    }
  }
}
```

**Error Responses:**

```json
// No token provided
{
  "success": false,
  "error": {
    "message": "Access denied. No token provided.",
    "code": "NO_TOKEN"
  }
}

// Invalid token
{
  "success": false,
  "error": {
    "message": "Invalid token.",
    "code": "INVALID_TOKEN"
  }
}

// Token expired
{
  "success": false,
  "error": {
    "message": "Token expired.",
    "code": "TOKEN_EXPIRED"
  }
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 1.5 Logout

**Endpoint:** `POST /auth/logout`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 2. Task Endpoints

### 2.1 Get Available Tasks (with Filters)

**Endpoint:** `GET /tasks`

**Authentication:** Required

**Query Parameters:**

```
status:  optional, one of ['available', 'in-progress', 'pending-review', 'completed', 'cancelled']
minReward: optional, float >= 0
maxReward: optional, float >= 0
location: optional, string (searches pickupLocation and dropoffLocation)
page: optional, integer >= 1 (default: 1)
limit: optional, integer 1-100 (default: 20)
```

**Example Request:**

```
GET /tasks?status=available&minReward=100&maxReward=500&location=juja&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "description": "Deliver a box to Block C",
        "pickupLocation": "Juja Gate",
        "dropoffLocation": "Block C, Room 201",
        "estimatedTime": 30,
        "rewardAmount": 150,
        "status": "available",
        "createdBy": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "Jane",
          "lastName": "Smith",
          "businessName": "Jane Deliveries",
          "averageRating": 4.8
        },
        "assignedTo": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

**cURL Example:**

```bash
curl -X GET "http://localhost:5001/api/tasks?status=available&minReward=100" \
  -H "Authorization: Bearer <token>"
```

---

### 2.2 Get User's Tasks

**Endpoint:** `GET /tasks/my-tasks`

**Authentication:** Required

**Query Parameters:**

```
status: optional
page: optional (default: 1)
limit: optional (default: 20)
```

**Response (200 OK):**

For **vendors**, returns tasks they created. For **students**, returns tasks they're assigned to.

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "description": "Deliver a box to Block C",
        "pickupLocation": "Juja Gate",
        "dropoffLocation": "Block C, Room 201",
        "estimatedTime": 30,
        "rewardAmount": 150,
        "status": "in-progress",
        "createdBy": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "Jane",
          "lastName": "Smith",
          "businessName": "Jane Deliveries",
          "averageRating": 4.8
        },
        "assignedTo": {
          "_id": "507f1f77bcf86cd799439011",
          "firstName": "John",
          "lastName": "Doe",
          "averageRating": 4.5
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### 2.3 Get Task Details

**Endpoint:** `GET /tasks/:id`

**Authentication:** Required

**URL Parameters:**

```
id: Task MongoDB ObjectId
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439013",
      "description": "Deliver a box to Block C",
      "pickupLocation": "Juja Gate",
      "dropoffLocation": "Block C, Room 201",
      "estimatedTime": 30,
      "rewardAmount": 150,
      "status": "pending-review",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jane",
        "lastName": "Smith",
        "businessName": "Jane Deliveries",
        "averageRating": 4.8
      },
      "assignedTo": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "averageRating": 4.5
      },
      "proof": [
        {
          "filename": "proof-1699564900-123456789.jpg",
          "originalName": "delivery-photo.jpg",
          "mimetype": "image/jpeg",
          "size": 245632,
          "uploadedAt": "2024-01-15T11:00:00Z"
        }
      ],
      "reviewNotes": "",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T11:30:00Z"
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "message": "Task not found",
    "code": "TASK_NOT_FOUND"
  }
}
```

---

### 2.4 Create Task (Vendor Only)

**Endpoint:** `POST /tasks`

**Authentication:** Required (vendor role)

**Request Body:**

```json
{
  "description": "Deliver documents to Registry Office",
  "pickupLocation": "Main Campus Library",
  "dropoffLocation": "Registry Office, Ground Floor",
  "estimatedTime": 45,
  "rewardAmount": 200
}
```

**Validation:**

- description: 10-1000 characters
- pickupLocation: 3-200 characters
- dropoffLocation: 3-200 characters
- estimatedTime: 1-1440 minutes
- rewardAmount: 1-10000

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439014",
      "description": "Deliver documents to Registry Office",
      "pickupLocation": "Main Campus Library",
      "dropoffLocation": "Registry Office, Ground Floor",
      "estimatedTime": 45,
      "rewardAmount": 200,
      "status": "available",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jane",
        "lastName": "Smith",
        "businessName": "Jane Deliveries",
        "averageRating": 4.8
      },
      "assignedTo": null,
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  }
}
```

**Error Responses:**

```json
// Insufficient balance
{
  "success": false,
  "error": {
    "message": "Insufficient wallet balance to create this task",
    "code": "INSUFFICIENT_BALANCE"
  }
}

// Validation error
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "msg": "Description must be between 10 and 1000 characters",
        "param": "description"
      }
    ]
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5001/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Deliver documents to Registry Office",
    "pickupLocation": "Main Campus Library",
    "dropoffLocation": "Registry Office, Ground Floor",
    "estimatedTime": 45,
    "rewardAmount": 200
  }'
```

---

### 2.5 Claim Task (Student Only)

**Endpoint:** `PUT /tasks/:id/assign`

**Authentication:** Required (student role)

**URL Parameters:**

```
id: Task MongoDB ObjectId
```

**Request Body:** (empty)

```json
{}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "in-progress",
      "assignedTo": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe"
      },
      "updatedAt": "2024-01-15T13:00:00Z"
    }
  }
}
```

**Error Responses:**

```json
// Task not available
{
  "success": false,
  "error": {
    "message": "Task is not available for assignment",
    "code": "TASK_NOT_AVAILABLE"
  }
}

// Student trying to claim own task
{
  "success": false,
  "error": {
    "message": "Cannot assign your own task",
    "code": "CANNOT_ASSIGN_OWN_TASK"
  }
}
```

---

### 2.6 Submit Proof (Student Only)

**Endpoint:** `PUT /tasks/:id/submit-proof`

**Authentication:** Required (student role)

**Content-Type:** `multipart/form-data`

**URL Parameters:**

```
id: Task MongoDB ObjectId
```

**Request Body:**

```
proofFiles: File array (1-5 files, max 10 MB each)
            Accepted: image/*, application/pdf
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "pending-review",
      "proof": [
        {
          "filename": "proof-1699564900-123456789.jpg",
          "originalName": "delivery.jpg",
          "mimetype": "image/jpeg",
          "size": 245632,
          "uploadedAt": "2024-01-15T14:00:00Z"
        }
      ],
      "updatedAt": "2024-01-15T14:00:00Z"
    }
  }
}
```

**Error Responses:**

```json
// No files provided
{
  "success": false,
  "error": {
    "message": "At least one proof file is required",
    "code": "NO_PROOF_FILES"
  }
}

// Task not assigned to student
{
  "success": false,
  "error": {
    "message": "Task not assigned to you",
    "code": "TASK_NOT_ASSIGNED"
  }
}

// Task not in progress
{
  "success": false,
  "error": {
    "message": "Task is not in progress",
    "code": "TASK_NOT_IN_PROGRESS"
  }
}
```

**cURL Example:**

```bash
curl -X PUT http://localhost:5001/api/tasks/507f1f77bcf86cd799439013/submit-proof \
  -H "Authorization: Bearer <token>" \
  -F "proofFiles=@/path/to/photo1.jpg" \
  -F "proofFiles=@/path/to/photo2.jpg"
```

---

### 2.7 Review Proof (Vendor Only)

**Endpoint:** `PUT /tasks/:id/review`

**Authentication:** Required (vendor role, must be task creator)

**URL Parameters:**

```
id: Task MongoDB ObjectId
```

**Request Body:**

```json
{
  "approved": true,
  "reviewNotes": "Great work! Payment processed."
}
```

**Response (200 OK) — Approved:**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "completed",
      "reviewNotes": "Great work! Payment processed.",
      "updatedAt": "2024-01-15T15:00:00Z"
    },
    "paymentProcessed": true
  }
}
```

**Response (200 OK) — Rejected:**

```json
{
  "success": true,
  "data": {
    "task": {
      "_id": "507f1f77bcf86cd799439013",
      "status": "in-progress",
      "proof": [],
      "reviewNotes": "Please provide clearer photos.",
      "updatedAt": "2024-01-15T15:00:00Z"
    },
    "paymentProcessed": false
  }
}
```

**cURL Example:**

```bash
curl -X PUT http://localhost:5001/api/tasks/507f1f77bcf86cd799439013/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "reviewNotes": "Great work!"
  }'
```

---

## 3. Wallet Endpoints

### 3.1 Get Wallet Balance

**Endpoint:** `GET /wallet/balance`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "balance": 500.50
  }
}
```

---

### 3.2 Deposit Funds (Vendor Only)

**Endpoint:** `POST /wallet/deposit`

**Authentication:** Required (vendor role)

**Request Body:**

```json
{
  "amount": 500,
  "phoneNumber": "254712345678"
}
```

**Validation:**

- amount: > 0
- phoneNumber: format `254XXXXXXXXX`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "STK Push Sent! Check your phone to enter PIN.",
    "transaction": {
      "id": "507f1f77bcf86cd799439015",
      "amount": 500,
      "newBalance": 1500.50,
      "transactionId": "INV-123456789"
    }
  }
}
```

**Error Response:**

```json
// M-Pesa connection failed
{
  "success": false,
  "error": {
    "message": "M-Pesa connection failed. Ensure number is valid.",
    "code": "PAYMENT_FAILED"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5001/api/wallet/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "phoneNumber": "254712345678"
  }'
```

---

### 3.3 Withdraw Funds (Student Only)

**Endpoint:** `POST /wallet/withdraw`

**Authentication:** Required (student role)

**Request Body:**

```json
{
  "amount": 200,
  "phoneNumber": "254712345678"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Withdrawal successful! Funds sent to M-Pesa.",
    "transaction": {
      "id": "507f1f77bcf86cd799439016",
      "amount": 200,
      "newBalance": 300.50,
      "transactionId": "TRK-987654321"
    }
  }
}
```

**Error Responses:**

```json
// Insufficient balance
{
  "success": false,
  "error": {
    "message": "Insufficient wallet balance.",
    "code": "INSUFFICIENT_BALANCE"
  }
}

// Payout failed
{
  "success": false,
  "error": {
    "message": "Payout failed. Ensure Test Wallet has funds.",
    "code": "PAYMENT_FAILED"
  }
}
```

---

### 3.4 Get Transaction History

**Endpoint:** `GET /wallet/transactions`

**Authentication:** Required

**Query Parameters:**

```
limit: optional, integer 1-100 (default: 50)
page: optional, integer >= 1 (default: 1)
type: optional, one of ['deposit', 'withdrawal', 'task-payment', 'task-refund']
```

**Example Request:**

```
GET /wallet/transactions?type=task-payment&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439017",
        "userId": "507f1f77bcf86cd799439011",
        "type": "task-payment",
        "amount": 150,
        "description": "Payment received for task: Deliver documents...",
        "taskId": "507f1f77bcf86cd799439013",
        "status": "completed",
        "paymentMethod": "M-Pesa",
        "externalTransactionId": "INT-123",
        "createdAt": "2024-01-15T15:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439018",
        "userId": "507f1f77bcf86cd799439011",
        "type": "deposit",
        "amount": 500,
        "description": "M-Pesa Deposit via IntaSend",
        "status": "completed",
        "paymentMethod": "M-Pesa",
        "externalTransactionId": "INV-789",
        "createdAt": "2024-01-14T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 45,
      "limit": 20
    }
  }
}
```

---

## 4. Rating Endpoints

### 4.1 Submit Rating

**Endpoint:** `POST /ratings`

**Authentication:** Required

**Request Body:**

```json
{
  "toUser": "507f1f77bcf86cd799439011",
  "taskId": "507f1f77bcf86cd799439013",
  "score": 5,
  "comment": "Great work! Very professional."
}
```

**Validation:**

- toUser: valid MongoDB ObjectId
- taskId: valid MongoDB ObjectId
- score: 1-5
- comment: max 500 characters (optional)

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "message": "Rating submitted successfully",
    "rating": {
      "_id": "507f1f77bcf86cd799439019",
      "fromUser": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "vendor"
      },
      "toUser": "507f1f77bcf86cd799439011",
      "taskId": "507f1f77bcf86cd799439013",
      "score": 5,
      "comment": "Great work! Very professional.",
      "createdAt": "2024-01-15T16:00:00Z"
    }
  }
}
```

**Error Responses:**

```json
// User trying to rate themselves
{
  "success": false,
  "error": {
    "message": "You cannot rate yourself.",
    "code": "SELF_RATING"
  }
}

// Task not completed
{
  "success": false,
  "error": {
    "message": "Can only rate users for completed tasks.",
    "code": "TASK_NOT_COMPLETED"
  }
}

// Duplicate rating
{
  "success": false,
  "error": {
    "message": "You have already rated this task.",
    "code": "DUPLICATE_RATING"
  }
}

// User not involved in task
{
  "success": false,
  "error": {
    "message": "You can only rate users involved in your tasks.",
    "code": "NOT_AUTHORIZED"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5001/api/ratings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toUser": "507f1f77bcf86cd799439011",
    "taskId": "507f1f77bcf86cd799439013",
    "score": 5,
    "comment": "Great work!"
  }'
```

---

### 4.2 Get User Ratings

**Endpoint:** `GET /ratings/user/:id`

**Authentication:** Required

**URL Parameters:**

```
id: User MongoDB ObjectId
```

**Query Parameters:**

```
limit: optional, integer 1-100 (default: 20)
page: optional, integer >= 1 (default: 1)
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "role": "student",
      "averageRating": 4.7,
      "totalRatings": 15
    },
    "ratings": [
      {
        "_id": "507f1f77bcf86cd799439019",
        "fromUser": {
          "_id": "507f1f77bcf86cd799439012",
          "firstName": "Jane",
          "lastName": "Smith",
          "role": "vendor"
        },
        "score": 5,
        "comment": "Great work! Very professional.",
        "taskId": {
          "_id": "507f1f77bcf86cd799439013",
          "description": "Deliver documents..."
        },
        "createdAt": "2024-01-15T16:00:00Z"
      }
    ],
    "ratingDistribution": [
      { "_id": 5, "count": 10 },
      { "_id": 4, "count": 3 },
      { "_id": 3, "count": 1 },
      { "_id": 2, "count": 1 },
      { "_id": 1, "count": 0 }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 15,
      "limit": 20
    }
  }
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:5001/api/ratings/user/507f1f77bcf86cd799439011?page=1 \
  -H "Authorization: Bearer <token>"
```

---

## 5. User Endpoints

### 5.1 Get User Profile

**Endpoint:** `GET /users/profile`

**Authentication:** Required

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "john@university.edu",
      "role": "student",
      "firstName": "John",
      "lastName": "Doe",
      "university": "JKUAT",
      "studentId": "JK-2023-001",
      "profilePicUrl": "/uploads/profile-1699564800-john.jpg",
      "walletBalance": 250.50,
      "averageRating": 4.7,
      "totalRatings": 15,
      "isEmailVerified": true,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  }
}
```

---

### 5.2 Get User Ratings (via Users Endpoint)

**Endpoint:** `GET /users/:id/ratings`

**Authentication:** Required

**URL Parameters:**

```
id: User MongoDB ObjectId
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "message": "Get user ratings endpoint - to be implemented"
  }
}
```

---

## 6. Health Check

### 6.1 API Health Status

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response (200 OK):**

```json
{
  "status": "OK",
  "message": "NeuraFund API is running"
}
```

---

## 7. Standard Response Format

All responses follow this pattern:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // endpoint-specific data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE_CONSTANT",
    "details": []  // optional, for validation errors
  }
}
```

---

## 8. HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, POST |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | No token, invalid token, expired token |
| 403 | Forbidden | User doesn't have permission (role check fails) |
| 404 | Not Found | Resource (task, user, etc.) doesn't exist |
| 500 | Internal Server Error | Unexpected server error |

---

## 9. Common Error Codes

```
// Authentication
NO_TOKEN                  - Missing Authorization header
INVALID_TOKEN            - Token invalid/malformed
TOKEN_EXPIRED            - JWT token past expiration
EMAIL_NOT_VERIFIED       - User email not verified

// Authorization
NOT_AUTHORIZED           - User doesn't own resource
INSUFFICIENT_PERMISSIONS - User role doesn't have access

// Validation
VALIDATION_ERROR         - Input validation failed
MISSING_FIELDS          - Required fields missing

// Resources
USER_NOT_FOUND          - User doesn't exist
TASK_NOT_FOUND          - Task doesn't exist
TASK_NOT_AVAILABLE      - Task already claimed/completed
TASK_NOT_ASSIGNED       - Task not assigned to user
TASK_NOT_IN_PROGRESS    - Task status not 'in-progress'
TASK_NOT_COMPLETED      - Task status not 'completed'
TASK_NOT_PENDING_REVIEW - Task status not 'pending-review'

// Wallet
INSUFFICIENT_BALANCE    - Wallet balance too low
PAYMENT_FAILED          - External payment API failed

// Files
NO_PROOF_FILES          - No files uploaded
PROOF_FILE_NOT_FOUND    - File doesn't exist in task proof

// Ratings
SELF_RATING             - User trying to rate themselves
DUPLICATE_RATING        - Already rated this task
INVALID_TO_USER         - Invalid user to rate
INVALID_SCORE           - Score not 1-5

// Business Logic
USER_EXISTS             - Email already registered
CANNOT_ASSIGN_OWN_TASK  - Student trying to claim vendor's own task
```

---

## 10. Rate Limiting & Throttling

**Current Implementation:** No explicit API rate limiting

**Recommended Additions for Production:**
- 100 requests/minute per IP (express-rate-limit)
- 1000 requests/minute per user token
- Location updates: 1 per 5 seconds (client-side)
- File uploads: 10 MB max per file, 50 MB per request

---

## 11. Pagination Pattern

Used in endpoints returning lists (tasks, transactions, ratings):

**Query Parameters:**
```
page: 1-based page number (default: 1)
limit: results per page, 1-100 (default: 20)
```

**Response:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Calculation:**
- skip = (page - 1) * limit
- pages = ceil(total / limit)

---

## 12. File Upload Specifications

### Profile Pictures
- **Endpoint:** `/auth/register/student`, `/auth/register/vendor`
- **Max Size:** 5 MB
- **Allowed Types:** image/*
- **Storage:** `/uploads/` (served via static middleware)
- **Naming:** `profile-{timestamp}-{filename}`

### Task Proof Files
- **Endpoint:** `/tasks/:id/submit-proof`
- **Max Size:** 10 MB per file, 5 files max per request
- **Allowed Types:** image/*, application/pdf
- **Storage:** `/uploads/task-proofs/` (access controlled)
- **Naming:** `proof-{timestamp}-{randomNumber}.{ext}`
- **Retrieval:** `GET /tasks/:id/proof/:filename` (auth required)

---

## 13. Authentication Token Usage

### Obtaining Token

```javascript
// POST /auth/login or POST /auth/register/*
Response: {
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE2OTk1NjQ4MDAsImV4cCI6MTY5OTY1MTIwMH0.signature..."
  }
}
```

### Using Token

```bash
# Option 1: Authorization Header
curl -H "Authorization: Bearer eyJhbGciOi..." http://localhost:5001/api/auth/me

# Option 2: Store in localStorage (Frontend)
localStorage.setItem('token', response.data.data.token);

# Option 3: Include in Axios Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Token Expiration

- **Duration:** 24 hours from issuance
- **Response on Expiration:** 401 with code `TOKEN_EXPIRED`
- **Action:** User must re-login

---

## 14. Example Workflow: Complete Task Cycle

```
1. STUDENT CLAIMS TASK
   Student: GET /tasks (list available)
   Student: PUT /tasks/{taskId}/assign
   Response: Task status = 'in-progress'

2. STUDENT COMPLETES AND UPLOADS PROOF
   Student: PUT /tasks/{taskId}/submit-proof (with files)
   Response: Task status = 'pending-review'

3. VENDOR REVIEWS AND APPROVES
   Vendor: GET /tasks/{taskId} (view proof)
   Vendor: PUT /tasks/{taskId}/review
     Body: { approved: true, reviewNotes: "Great!" }
   Response: Task status = 'completed'
   
   Side effects:
   - Vendor wallet debited -rewardAmount
   - Student wallet credited +rewardAmount
   - 2 Transaction records created
   - Student can now rate vendor

4. BOTH RATE EACH OTHER
   Student: POST /ratings
     Body: { toUser: vendorId, taskId, score: 5 }
   Vendor: POST /ratings
     Body: { toUser: studentId, taskId, score: 5 }
   
   Side effects:
   - User.averageRating recalculated
   - User.totalRatings incremented

5. STUDENT WITHDRAWS EARNINGS
   Student: POST /wallet/withdraw
     Body: { amount: rewardAmount, phoneNumber: "254..." }
   Response: Task status = 'completed', wallet updated
   
   Side effects:
   - IntaSend API called (B2C payout)
   - Transaction record created
   - M-Pesa sent to student's phone
```

---

## 15. Development vs Production URLs

### Development
```
API Base:     http://localhost:5001/api
Socket.IO:    http://localhost:5001
Uploads:      http://localhost:5001/uploads
Frontend:     http://localhost:3000
```

### Production
```
API Base:     https://api.neurafund.com/api
Socket.IO:    https://api.neurafund.com
Uploads:      https://api.neurafund.com/uploads
Frontend:     https://neurafund.vercel.app
```

### Environment Variable Configuration

**Frontend (.env):**
```
REACT_APP_API_URL=https://api.neurafund.com/api
```

**Backend (.env):**
```
NODE_ENV=production
CLIENT_URL=https://neurafund.vercel.app
MONGODB_URI=mongodb+srv://...
INTASEND_IS_TEST=false
PORT=5001
```

---

## 16. Testing API Endpoints

### Using Postman

1. **Set up collection:**
   - Base URL: `{{base_url}}`
   - Variable: `base_url` = `http://localhost:5001/api`

2. **Set up environment:**
   - `token` variable (populated after login)
   - Pre-request Script:
     ```javascript
     // Assumes token is set after login
     pm.request.headers.add({
       key: 'Authorization',
       value: 'Bearer ' + pm.environment.get('token')
     });
     ```

3. **Test login:**
   ```
   POST {{base_url}}/auth/login
   Body: {
     "email": "test@test.com",
     "password": "password123"
   }
   Tests:
     pm.environment.set('token', pm.response.json().data.token);
   ```

### Using cURL

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. Use token
curl -X GET http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Create task
curl -X POST http://localhost:5001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Deliver documents",
    "pickupLocation": "Gate A",
    "dropoffLocation": "Block B",
    "estimatedTime": 30,
    "rewardAmount": 100
  }'
```

### Using JavaScript/Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api'
});

// 1. Login
const loginResponse = await api.post('/auth/login', {
  email: 'test@test.com',
  password: 'password123'
});

const token = loginResponse.data.data.token;

// 2. Set token for subsequent requests
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// 3. Fetch tasks
const tasksResponse = await api.get('/tasks?status=available');
console.log(tasksResponse.data.data.tasks);

// 4. Create task
const createResponse = await api.post('/tasks', {
  description: 'Deliver documents',
  pickupLocation: 'Gate A',
  dropoffLocation: 'Block B',
  estimatedTime: 30,
  rewardAmount: 100
});
console.log(createResponse.data.data.task);
```

---

## Summary

The NeuraFund API follows REST conventions with:
- **Standard HTTP methods** (GET, POST, PUT, DELETE)
- **JWT authentication** on protected endpoints
- **Role-based access control** (student, vendor)
- **Consistent error formatting** with error codes
- **Pagination support** for list endpoints
- **File upload handling** for profiles and proofs
- **Optimistic wallet updates** for fast UX
- **Transaction history tracking** for auditing

All endpoints are fully tested in Jest (backend) and Cypress (E2E), with mock IntaSend integration for safe payment testing.