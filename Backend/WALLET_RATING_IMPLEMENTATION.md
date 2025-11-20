# Wallet System and Rating Functionality Implementation

## Overview

This document describes the complete implementation of the wallet system and rating functionality for the NeuraFund platform (Task 3).

## Implemented Features

### 1. Wallet Management API

#### Balance Tracking

- **GET /api/wallet/balance** - Returns current user wallet balance
- Accessible to all authenticated users
- Returns real-time balance from user document

#### Mock Payment Integration

**Deposit (Vendors Only)**

- **POST /api/wallet/deposit**
- Request body: `{ amount: number, paymentMethod: string }`
- Validates amount > 0
- Generates mock external transaction ID
- Creates transaction record with status 'completed'
- Updates vendor wallet balance
- Returns transaction details and new balance

**Withdrawal (Students Only)**

- **POST /api/wallet/withdraw**
- Request body: `{ amount: number, phoneNumber: string }`
- Validates amount > 0 and sufficient balance
- Generates mock M-Pesa transaction ID
- Creates transaction record with status 'completed'
- Deducts amount from student wallet
- Returns transaction details and new balance

#### Transaction History

- **GET /api/wallet/transactions**
- Query params: `limit`, `page`, `type` (optional filter)
- Returns paginated transaction history
- Includes task references for task-related transactions
- Sorted by creation date (newest first)

### 2. Rating System

#### Rating Submission

- **POST /api/ratings/**
- Request body: `{ toUserId, taskId, score, comment }`
- Validates:
  - Score between 1-5
  - Task exists and is completed
  - User is involved in the task (vendor or student)
  - No duplicate ratings (enforced by unique index)
  - Cannot rate yourself
- Creates rating record
- Automatically updates rated user's average rating and total ratings count
- Returns created rating with populated user and task details

#### Rating Retrieval

- **GET /api/ratings/user/:id**
- Query params: `limit`, `page`
- Returns:
  - User profile with average rating and total ratings
  - Paginated list of ratings with reviewer details
  - Rating distribution (count per score 1-5)
  - Pagination metadata

#### Rating Calculation

- Automatic calculation when new rating is submitted
- Updates User model fields:
  - `averageRating`: Rounded to 1 decimal place
  - `totalRatings`: Total count of ratings received
- Used for user reputation system

### 3. Payment Processing Logic

#### Automatic Payment on Task Completion

Integrated into existing task review endpoint:

- **PUT /api/tasks/:id/review**
- When vendor approves task proof:
  1. Validates vendor has sufficient balance
  2. Deducts reward amount from vendor wallet
  3. Adds reward amount to student wallet
  4. Creates two transaction records:
     - Vendor: negative amount (payment sent)
     - Student: positive amount (payment received)
  5. Updates task status to 'completed'
  6. Both transactions reference the task ID

#### Balance Validation

- Task creation validates vendor has sufficient balance
- Payment processing validates vendor balance before transfer
- Withdrawal validates student has sufficient balance
- All operations prevent negative balances

### 4. Rating-Based Task Prioritization

#### Student Task View Optimization

Modified **GET /api/tasks/** endpoint:

- For students viewing available tasks:
  1. Primary sort: Vendor average rating (descending)
  2. Secondary sort: Reward amount (descending)
  3. Tertiary sort: Creation date (newest first)
- For other views: Default sort by creation date
- Helps students find tasks from highly-rated, trustworthy vendors

#### User Reputation System

- Average rating displayed in user profiles
- Total ratings count shows experience level
- Rating distribution provides detailed feedback view
- Ratings tied to completed tasks for authenticity

## Database Models

### Transaction Model

```javascript
{
  userId: ObjectId (ref: User),
  type: 'deposit' | 'withdrawal' | 'task-payment' | 'task-refund',
  amount: Number,
  description: String,
  taskId: ObjectId (ref: Task, optional),
  status: 'pending' | 'completed' | 'failed',
  paymentMethod: String,
  externalTransactionId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Rating Model

```javascript
{
  fromUser: ObjectId (ref: User),
  toUser: ObjectId (ref: User),
  taskId: ObjectId (ref: Task),
  score: Number (1-5),
  comment: String (optional, max 500 chars),
  createdAt: Date
}
```

### User Model Updates

- `walletBalance`: Number (default: 0, min: 0)
- `averageRating`: Number (0-5, rounded to 1 decimal)
- `totalRatings`: Number (count of ratings received)

## API Error Handling

All endpoints include comprehensive error handling:

- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Resource not found errors (404)
- Server errors (500)

Error response format:

```javascript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    details: {} // Optional additional context
  }
}
```

## Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based access control
   - Deposits: Vendors only
   - Withdrawals: Students only
   - Ratings: Both roles, with task participation validation
3. **Balance Protection**: Prevents negative balances
4. **Duplicate Prevention**: Unique index prevents duplicate ratings
5. **Task Validation**: Ensures ratings only for completed tasks

## Requirements Coverage

This implementation satisfies all requirements from the specification:

- **9.1**: Display current wallet balance ✓
- **9.2**: Vendor wallet deposits via mock payment ✓
- **9.3**: Student M-Pesa withdrawals via mock interface ✓
- **9.4**: Transaction history maintenance ✓
- **9.5**: Negative balance prevention ✓
- **10.1**: Vendor rating of students (1-5 scale) ✓
- **10.2**: Student rating of vendors (optional) ✓
- **10.3**: Average rating calculation and display ✓
- **10.4**: Rating comments storage ✓
- **10.5**: Rating-based task prioritization ✓

## Testing Recommendations

To test the implementation:

1. **Wallet Deposit**: POST to /api/wallet/deposit as vendor
2. **Task Creation**: Create task with sufficient balance
3. **Task Assignment**: Student assigns task to themselves
4. **Proof Submission**: Student uploads completion proof
5. **Task Approval**: Vendor approves proof (triggers payment)
6. **Rating Submission**: Both parties rate each other
7. **Wallet Withdrawal**: Student withdraws earnings
8. **Transaction History**: View complete transaction log
9. **Rating View**: Check updated user ratings and reputation

## Files Modified

1. `backend/routes/wallet.js` - Complete wallet API implementation
2. `backend/routes/ratings.js` - Complete rating system implementation
3. `backend/routes/tasks.js` - Added rating-based task prioritization
4. `backend/models/Transaction.js` - Already existed, used as-is
5. `backend/models/Rating.js` - Already existed, used as-is
6. `backend/models/User.js` - Already had wallet and rating fields

## Next Steps

The wallet and rating functionality is now complete. The next task in the implementation plan is:

- **Task 4**: Create complete React frontend with authentication and dashboards
