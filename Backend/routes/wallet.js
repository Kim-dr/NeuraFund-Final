const express = require('express');
const { authenticate, isVendor, isStudent } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
// 🔌 IMPORT INTASEND UTILITY
const { triggerMpesaStkPush, triggerMpesaB2C } = require('../utils/intasend');

const router = express.Router();

// Get current balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        balance: req.user.walletBalance
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get wallet balance',
        code: 'BALANCE_ERROR'
      }
    });
  }
});

// --- VENDOR DEPOSIT (STK PUSH) ---
router.post('/deposit', authenticate, isVendor, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body; // Ensure frontend sends phoneNumber

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Invalid amount' } });
    }
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: { message: 'Phone number required for M-Pesa' } });
    }

    console.log(`Initiating STK Push of KES ${amount} to ${phoneNumber}`);

    // 1. TRIGGER REAL MPESA STK PUSH
    let intaSendResponse;
    try {
        intaSendResponse = await triggerMpesaStkPush(
            phoneNumber, 
            amount, 
            req.user.email, 
            req.user.firstName
        );
        console.log("IntaSend STK Response:", intaSendResponse);
    } catch (apiError) {
        return res.status(500).json({ 
            success: false, 
            error: { message: 'M-Pesa connection failed. Ensure number is valid.' } 
        });
    }

    // 2. RECORD TRANSACTION (Optimistic: We assume success for the demo)
    // In production, you would use Webhooks to confirm payment before adding money.
    const externalTransactionId = intaSendResponse.invoice.invoice_id || `DEP-${Date.now()}`;

    const transaction = new Transaction({
      userId: req.user._id,
      type: 'deposit',
      amount: amount,
      description: `M-Pesa Deposit via IntaSend`,
      status: 'completed', // Marking complete immediately for demo purposes
      paymentMethod: 'M-Pesa',
      externalTransactionId: externalTransactionId
    });

    await transaction.save();

    // 3. UPDATE USER BALANCE
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amount } }, 
      { new: true } 
    );
    
    req.user.walletBalance = updatedUser.walletBalance; 

    res.json({
      success: true,
      data: {
        message: 'STK Push Sent! Check your phone to enter PIN.',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          newBalance: req.user.walletBalance,
          transactionId: externalTransactionId
        }
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to process deposit' } });
  }
});

// --- STUDENT WITHDRAWAL (B2C PAYOUT) ---
router.post('/withdraw', authenticate, isStudent, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    // Validate
    if (!amount || amount <= 0) return res.status(400).json({ success: false, error: { message: 'Invalid amount' } });
    if (!phoneNumber) return res.status(400).json({ success: false, error: { message: 'Phone number required' } });

    // Check Balance
    if (req.user.walletBalance < amount) {
      return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance.' } });
    }

    console.log(`Initiating B2C Payout of KES ${amount} to ${phoneNumber}`);

    // 1. TRIGGER REAL B2C PAYOUT
    let intaSendResponse;
    try {
        intaSendResponse = await triggerMpesaB2C(phoneNumber, amount);
        console.log("IntaSend B2C Response:", intaSendResponse);
    } catch (apiError) {
        console.error("B2C Error:", apiError);
        // If B2C fails (common in test mode if wallet empty), we return error
        return res.status(500).json({ 
            success: false, 
            error: { message: 'Payout failed. Ensure Test Wallet has funds.' } 
        });
    }

    // 2. RECORD TRANSACTION
    const externalTransactionId = intaSendResponse.tracking_id || `WTH-${Date.now()}`;

    const transaction = new Transaction({
      userId: req.user._id,
      type: 'withdrawal',
      amount: amount,
      description: `M-Pesa Withdrawal to ${phoneNumber}`,
      status: 'completed',
      paymentMethod: 'M-Pesa',
      externalTransactionId: externalTransactionId
    });

    await transaction.save();

    // 3. DEDUCT BALANCE
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: -amount } },
      { new: true }
    );
    
    req.user.walletBalance = updatedUser.walletBalance; 

    res.json({
      success: true,
      data: {
        message: 'Withdrawal successful! Funds sent to M-Pesa.',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          newBalance: req.user.walletBalance,
          transactionId: externalTransactionId
        }
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to process withdrawal' } });
  }
});

// Get transaction history (Unchanged)
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { limit = 50, page = 1, type } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('taskId', 'description rewardAmount');

    const totalCount = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions: transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ success: false, error: { message: 'Failed to get transaction history' } });
  }
});

module.exports = router;