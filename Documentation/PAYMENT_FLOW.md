# NeuraFund Payment Flow Documentation

## Overview

NeuraFund integrates with **IntaSend** (a Kenyan fintech platform) to facilitate M-Pesa payments. The system supports two primary payment flows:

1. **STK Push (Vendor Deposits):** Vendors add funds to their wallet via M-Pesa
2. **B2C Payout (Student Withdrawals):** Students withdraw earned money to their M-Pesa account

Additionally, **Task Payments** occur internally when vendors approve completed tasks, directly crediting student wallets.

---

## 1. IntaSend Integration Architecture

### SDK Configuration

**Location:** `Backend/utils/intasend.js`

```javascript
const IntaSend = require('intasend-node');

const isTest = process.env.INTASEND_IS_TEST === 'true';

const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY,    // Public key for identifying app
  process.env.INTASEND_SECRET_KEY,          // Secret key for API auth
  isTest                                    // Sandbox vs Live mode toggle
);
```

### Environment Variables

```dotenv
# .env.example (production-ready)
INTASEND_PUBLISHABLE_KEY=your_public_key_here
INTASEND_SECRET_KEY=your_secret_key_here
INTASEND_IS_TEST=false  # Set to 'true' for sandbox testing

# In development/CI:
INTASEND_IS_TEST=true
INTASEND_PUBLISHABLE_KEY=test_pub_key
INTASEND_SECRET_KEY=test_secret_key
```

**Key Point:** When `INTASEND_IS_TEST === 'true'`, the SDK routes all requests to Safaricom's sandbox environment. No real M-Pesa charges occur.

---

## 2. STK Push Flow (Vendor Deposits)

### User Interaction Sequence

```
Vendor Dashboard
    │
    ├─ Clicks "Deposit Funds"
    │
    ├─ Enters:
    │  • Amount (e.g., 500 KES)
    │  • Phone Number (e.g., 254712345678)
    │
    └─ Clicks "Deposit"
           │
           ▼
    POST /api/wallet/deposit
    Body: { amount: 500, phoneNumber: "254712345678" }
```

### Backend Processing Flow

```javascript
// Step 1: Validation
if (!amount || amount <= 0) 
  → Response 400: "Invalid amount"

if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber))
  → Response 400: "Phone number required for M-Pesa"

// Step 2: Call IntaSend SDK
const intaSendResponse = await triggerMpesaStkPush(
  phoneNumber,           // "254712345678"
  amount,                // 500
  vendorEmail,           // "vendor@business.com"
  vendorFirstName        // "John"
);

// Returns: { invoice: { invoice_id: "INV-123456" } }

// Step 3: Create Transaction Record (Optimistic)
// In demo mode, we assume the payment succeeds immediately
const transaction = new Transaction({
  userId: vendorId,
  type: 'deposit',
  amount: 500,
  description: 'M-Pesa Deposit via IntaSend',
  status: 'completed',  // Optimistic: assumes success
  paymentMethod: 'M-Pesa',
  externalTransactionId: intaSendResponse.invoice.invoice_id
});
await transaction.save();

// Step 4: Update Wallet Balance
const updatedUser = await User.findByIdAndUpdate(
  vendorId,
  { $inc: { walletBalance: 500 } },
  { new: true }
);

// Step 5: Return Success Response
Response 200: {
  success: true,
  data: {
    message: 'STK Push Sent! Check your phone to enter PIN.',
    transaction: {
      id: transaction._id,
      amount: 500,
      newBalance: vendor.walletBalance + 500,
      transactionId: intaSendResponse.invoice.invoice_id
    }
  }
}
```

### Client-Side Flow

```javascript
// Frontend: POST /api/wallet/deposit
try {
  const response = await api.post('/wallet/deposit', {
    amount: parseFloat(depositAmount),
    phoneNumber: phoneNumber
  });

  const newBalance = response.data.data.transaction.newBalance;
  
  // Update local auth context
  updateUserBalance(newBalance);
  
  // Show success toast
  showToast('STK Push Sent! Check your phone.', 'success');
  
  // Clear form
  setDepositAmount('');
  setPhoneNumber('');
  
  // Refresh wallet data
  fetchWalletData();
  
} catch (error) {
  showToast(
    error.response?.data?.message || 'Deposit failed',
    'error'
  );
}
```

### Actual M-Pesa User Experience

```
[Server sends STK Push to Safaricom]
    │
    ├─ M-Pesa notification appears on vendor's phone
    │
    ├─ Vendor sees:
    │  "NeuraFund is requesting to withdraw KES 500"
    │  "To confirm, enter your M-Pesa PIN"
    │
    ├─ Vendor enters PIN
    │
    ├─ Safaricom processes transaction
    │
    └─ Vendor receives SMS:
       "Your M-Pesa account has been debited KES 500.00
        to NeuraFund. New balance: KES XXXX.XX"
```

### Key Implementation Details

- **Transaction Status:** Marked as 'completed' immediately (optimistic update)
  - Production systems should use webhooks to confirm payment
  - For demo purposes, this is acceptable
  
- **Error Handling:**
  ```javascript
  try {
    intaSendResponse = await triggerMpesaStkPush(...)
  } catch (apiError) {
    console.error('IntaSend STK Error:', apiError);
    Response 500: "M-Pesa connection failed. Ensure number is valid."
  }
  ```

- **Phone Number Format:** Must be exactly `254XXXXXXXXX` (Kenya country code + 9 digits)

---

## 3. B2C Payout Flow (Student Withdrawals)

### User Interaction Sequence

```
Student Dashboard
    │
    ├─ Clicks "Withdraw to M-Pesa"
    │
    ├─ Enters:
    │  • Amount (e.g., 200 KES)
    │  • Phone Number (e.g., 254712345678)
    │
    └─ Clicks "Withdraw"
           │
           ▼
    POST /api/wallet/withdraw
    Body: { amount: 200, phoneNumber: "254712345678" }
```

### Backend Processing Flow

```javascript
// Step 1: Validation
if (!amount || amount <= 0)
  → Response 400: "Invalid amount"

if (!phoneNumber || !/^254\d{9}$/.test(phoneNumber))
  → Response 400: "Phone number required"

// Step 2: Check Balance
if (student.walletBalance < amount)
  → Response 400: "Insufficient wallet balance"

// Step 3: Call IntaSend B2C API
let intaSendResponse;
try {
  intaSendResponse = await triggerMpesaB2C(
    phoneNumber,  // "254712345678"
    amount        // 200
  );
  // Returns: { tracking_id: "TRK-654321" }
} catch (apiError) {
  console.error('B2C Error:', apiError);
  Response 500: "Payout failed. Ensure Test Wallet has funds."
}

// Step 4: Create Transaction Record
const transaction = new Transaction({
  userId: studentId,
  type: 'withdrawal',
  amount: 200,
  description: `M-Pesa Withdrawal to ${phoneNumber}`,
  status: 'completed',
  paymentMethod: 'M-Pesa',
  externalTransactionId: intaSendResponse.tracking_id
});
await transaction.save();

// Step 5: Deduct from Wallet
const updatedUser = await User.findByIdAndUpdate(
  studentId,
  { $inc: { walletBalance: -200 } },
  { new: true }
);

// Step 6: Return Success Response
Response 200: {
  success: true,
  data: {
    message: 'Withdrawal successful! Funds sent to M-Pesa.',
    transaction: {
      id: transaction._id,
      amount: 200,
      newBalance: student.walletBalance - 200,
      transactionId: intaSendResponse.tracking_id
    }
  }
}
```

### Key Differences from STK Push

| Aspect | STK Push | B2C |
|--------|----------|-----|
| **Initiated By** | User (vendor) | App (backend) |
| **M-Pesa Flow** | Vendor enters PIN on phone | Automatic payout |
| **Confirmation** | Immediate (user sees prompt) | Async (may take 5-30s) |
| **Requirements** | Vendor's M-Pesa account | IntaSend wallet funded |
| **Error Rate** | Low (user controls) | Higher (depends on Safaricom) |

---

## 4. Task Payment Flow (Internal Wallet Transfer)

When a vendor approves completed task proof, an internal payment occurs **without involving M-Pesa**:

```
Vendor clicks "Approve & Pay"
    │
    ├─ PUT /api/tasks/:id/review
    │  Body: { approved: true, reviewNotes: "" }
    │
    └─ Backend Handler:
        │
        ├─ 1. Verify vendor owns task
        ├─ 2. Check task.status === 'pending-review'
        ├─ 3. Load vendor and student from DB
        ├─ 4. Check vendor.walletBalance >= task.rewardAmount
        │
        ├─ 5. Update wallets:
        │    vendor.walletBalance -= task.rewardAmount
        │    student.walletBalance += task.rewardAmount
        │
        ├─ 6. Save both users
        │
        ├─ 7. Create TWO transaction records:
        │    a) Vendor: {
        │         userId: vendorId,
        │         type: 'task-payment',
        │         amount: rewardAmount,
        │         description: 'Payment for task: ...',
        │         taskId: taskId,
        │         status: 'completed'
        │       }
        │    b) Student: {
        │         userId: studentId,
        │         type: 'task-payment',
        │         amount: rewardAmount,
        │         description: 'Payment received for task: ...',
        │         taskId: taskId,
        │         status: 'completed'
        │       }
        │
        ├─ 8. Update task.status = 'completed'
        │
        └─ 9. Send response: { success: true, paymentProcessed: true }
               │
               └─ Frontend updates UI, shows "Rate Student" button
```

**No external API call** — this is a direct database transaction within the NeuraFund system.

---

## 5. Detailed Sequence Diagram: Complete Payment Lifecycle

```
Student Completes Task                Vendor Approves & Pays
      │                                        │
      ├──── Uploads Proof ──────────────>     │
      │                                        │
      │    Status: pending-review              │
      │                                        │
      │<────── Task appears in review ────────┤
      │                                        │
      │                                   Clicks "Approve"
      │                                        │
      │                                   PUT /review (approved=true)
      │                                        │
      │                                   Server:
      │                                   1. Validate vendor
      │                                   2. Check balance
      │                                   3. wallet_vendor -= reward
      │                                   4. wallet_student += reward
      │                                   5. Save both users
      │                                   6. Create transactions
      │                                   7. task.status='completed'
      │                                        │
      │<────── Task moves to Completed ───────┤
      │
      ├──── Can see "Rate Vendor" button
      │
      └──── Wallet balance increased ✓
```

---

## 6. Wallet Balance State Management

### Client-Side (React Context)

```javascript
// Frontend: authContext stores wallet balance
const AuthContext = {
  user: {
    walletBalance: 1000,  // KES
    // ... other fields
  }
};

// When transaction completes:
updateUserBalance(newBalance);

// For real-time sync:
refreshUser();  // Fetches GET /api/auth/me from server
```

### Server-Side (MongoDB)

```javascript
// User document:
{
  _id: "507f1f77bcf86cd799439011",
  walletBalance: 1000,  // Always non-negative
  // ... other fields
}

// Transactions record history:
{
  _id: "507f1f77bcf86cd799439012",
  userId: "507f1f77bcf86cd799439011",
  type: 'task-payment',
  amount: 100,
  status: 'completed',
  createdAt: 2024-01-15T10:30:00Z
}
```

### Balance Calculation Pattern

```javascript
// Current balance: stored in User.walletBalance
// Transaction history: stored in Transaction collection

// To recalculate balance (auditing):
const transactions = await Transaction.find({ userId });
const balance = transactions.reduce((sum, t) => {
  if (t.type === 'deposit' || t.type === 'task-payment' && t.userId === receiverId) {
    return sum + t.amount;
  }
  if (t.type === 'withdrawal' || t.type === 'task-payment' && t.userId === sender) {
    return sum - t.amount;
  }
  return sum;
}, 0);
```

---

## 7. Socket.IO Stability During Payments

### autoConnect: true Configuration

**Location:** `Frontend/src/utils/socket.js`

```javascript
const socket = io(SOCKET_SERVER_URL, {
  autoConnect: true,         // ← CRITICAL: Auto-reconnect on disconnect
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

**Why This Matters:**

When a vendor deposits funds during an active task:

```
Timeline:
T0:      Vendor is in chat room (socket connected)
T1:      Vendor opens WalletManagement component
T2:      Vendor submits deposit form
T3-T5:   IntaSend API call (potential network hiccup)
T6:      Socket connection might drop momentarily
T7:      autoConnect: true automatically reconnects
T8:      Vendor doesn't notice — chat still works smoothly
```

### Without autoConnect: true

```
T6:      Socket drops
T7:      No auto-reconnect
T8:      Chat messages don't appear
T9:      Vendor has to manually refresh page
T10:     User frustration increases
```

### Reconnection Behavior

```javascript
// Server side: handles re-entry to rooms
socket.on('connect', () => {
  // Client is back online
  // Re-emit JOIN_TASK to restore room membership
  socket.emit('JOIN_TASK', currentTaskId);
});

// Frontend side: automatic via autoConnect flag
// No manual reconnection code needed
```

---

## 8. Error Scenarios & Fallbacks

### Scenario 1: Vendor Insufficient Balance

```
Request: PUT /api/tasks/:id/review
         { approved: true }

Vendor balance: 500 KES
Task reward: 1000 KES

Handler:
  if (vendor.walletBalance < task.rewardAmount) {
    Response 400: {
      success: false,
      error: {
        message: 'Insufficient balance to complete payment',
        code: 'INSUFFICIENT_BALANCE'
      }
    }
  }

UI: Shows error toast, task stays in "Pending Review"
Next step: Vendor must deposit more funds
```

### Scenario 2: IntaSend API Timeout (STK Push)

```
Request: POST /api/wallet/deposit
         { amount: 500, phoneNumber: "254712345678" }

Backend:
  try {
    intaSendResponse = await triggerMpesaStkPush(...);
  } catch (apiError) {
    console.error('IntaSend STK Error:', apiError);
    
    Response 500: {
      success: false,
      error: {
        message: 'M-Pesa connection failed. Ensure number is valid.',
        code: 'PAYMENT_FAILED'
      }
    }
  }

UI: Shows error, vendor can retry
Database: No transaction created (safe state)
```

### Scenario 3: B2C Payout (Insufficient IntaSend Wallet)

```
Request: POST /api/wallet/withdraw
         { amount: 200, phoneNumber: "254712345678" }

IntaSend balance: 50 KES (not enough)

Backend:
  try {
    intaSendResponse = await triggerMpesaB2C(...);
  } catch (apiError) {
    Response 500: {
      message: 'Payout failed. Ensure Test Wallet has funds.'
    }
  }

UI: Shows error, student's wallet is NOT debited (safe)
Database: No transaction created
Solution: Admin deposits funds to IntaSend wallet
```

### Scenario 4: Network Interrupted During Proof Upload

```
Request: PUT /api/tasks/:id/submit-proof
         FormData with files

Network drops mid-upload

Frontend catch block:
  showToast(
    error.response?.data?.message || 'Failed to upload proof',
    'error'
  )

Database: No proof files recorded
UI: Form still populated, student can retry
Files: Partially uploaded files cleaned up by multer
```

---

## 9. Testing Payment Flows

### Jest Test: Mock IntaSend

**Location:** `Backend/tests/wallet.test.js`

```javascript
jest.mock('../utils/intasend', () => ({
  triggerMpesaStkPush: jest.fn(() => Promise.resolve({ 
    invoice: { invoice_id: 'TEST_INVOICE_123' } 
  })),
  triggerMpesaB2C: jest.fn(() => Promise.resolve({ 
    tracking_id: 'TEST_TRACKING_456' 
  }))
}));

describe('Wallet Routes', () => {
  it('should deposit funds successfully', async () => {
    const res = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100,
        phoneNumber: '254712345678'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    
    // Verify wallet updated
    const updatedUser = await User.findById(userId);
    expect(updatedUser.walletBalance).toEqual(100);
  });
});
```

### Cypress E2E Test: Full Deposit Flow

```javascript
it('should allow vendor to deposit funds', () => {
  // Login as vendor
  cy.visit('http://localhost:3000/login');
  cy.get('input[name="email"]').type('vendor@test.com');
  cy.get('input[name="password"]').type('password123');
  cy.get('button[type="submit"]').click();
  
  // Navigate to wallet
  cy.visit('http://localhost:3000/dashboard/vendor');
  cy.contains('Wallet').click();
  
  // Fill deposit form
  cy.get('input[placeholder*="Amount"]').type('500');
  cy.get('input[placeholder*="254"]').type('254712345678');
  cy.get('button').contains('Deposit').click();
  
  // Verify success
  cy.contains('STK Push Sent').should('be.visible');
});
```

---

## 10. Production Deployment Checklist

### IntaSend Live Credentials

- [ ] Obtain live **Publishable Key** from IntaSend dashboard
- [ ] Obtain live **Secret Key** from IntaSend dashboard
- [ ] Set `INTASEND_IS_TEST=false` in production `.env`
- [ ] Test with real M-Pesa transaction (small amount)
- [ ] Verify transaction appears in IntaSend dashboard
- [ ] Confirm M-Pesa statement on phone

### Database Integrity

- [ ] Ensure MongoDB backups enabled on Atlas
- [ ] Create indexes: `{ userId: 1, type: 1 }` on Transactions
- [ ] Implement transaction audit log (optional but recommended)
- [ ] Set up alerts for unusual wallet balance changes

### Security

- [ ] Never commit `.env` files with keys to Git
- [ ] Rotate IntaSend keys every 90 days
- [ ] Use HTTPS (enforced by Render)
- [ ] Enable CORS only to whitelisted domains
- [ ] Implement rate limiting on `/wallet/*` endpoints

### Monitoring

- [ ] Log all IntaSend API responses
- [ ] Alert on payment failures
- [ ] Dashboard: View daily deposit/withdrawal volumes
- [ ] Reconciliation: Compare wallet balances with transaction sums

---

## 11. Troubleshooting Guide

### Issue: "M-Pesa connection failed"

**Causes:**
1. Phone number format invalid (not `254XXXXXXXXX`)
2. IntaSend API keys incorrect
3. Network timeout to IntaSend servers

**Solutions:**
1. Validate phone format in frontend (regex: `/^254\d{9}$/`)
2. Check `.env` variables match IntaSend dashboard
3. Check internet connectivity, retry after 30 seconds

### Issue: "Insufficient Test Wallet has funds"

**Cause:** B2C payout failed because IntaSend sandbox wallet is empty

**Solution:** 
1. Go to IntaSend test dashboard
2. "Top up" the test wallet with virtual funds
3. Retry withdrawal

### Issue: Vendor wallet balance didn't update

**Cause:**
1. Transaction failed silently
2. Database write error
3. Frontend cache stale

**Solutions:**
1. Check MongoDB for Transaction record
2. Manually run: `db.users.findById({id}).walletBalance`
3. Call `POST /api/auth/me` to refresh from server

### Issue: Payment approved but student wallet unchanged

**Cause:** Task payment flow didn't trigger `$inc` operation

**Solution:**
1. Check that `task.status === 'pending-review'` before approval
2. Check both `vendor` and `student` objects were found
3. Verify `User.findByIdAndUpdate` returned `{ new: true }`

---

## Summary

NeuraFund's payment system consists of:

1. **STK Push (Deposits):** Vendor initiates → IntaSend → Safaricom → Wallet +
2. **B2C (Withdrawals):** App initiates → IntaSend → Safaricom → M-Pesa +
3. **Task Payments:** Internal → User.walletBalance ± → Transaction record

All flows are optimistically updated, with error handling and fallbacks. Socket.IO's `autoConnect: true` ensures real-time features remain stable during payment processing. Testing uses Jest mocks; production uses live IntaSend credentials with full transaction logging.