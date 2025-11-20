const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

// 🛠️ MOCK INTASEND: Fake the external API call
jest.mock('../utils/intasend', () => ({
  triggerMpesaStkPush: jest.fn(() => Promise.resolve({ 
      invoice: { invoice_id: 'TEST_INVOICE_123' } 
  })),
  triggerMpesaB2C: jest.fn(() => Promise.resolve({ 
      tracking_id: 'TEST_TRACKING_456' 
  }))
}));

describe('Wallet Routes', () => {
  let token;
  let userId;

  // Setup: Create a user and get token before running tests
  beforeEach(async () => {
    const user = new User({
      firstName: 'Wallet',
      lastName: 'Tester',
      email: 'wallet@test.com',
      password: 'password123',
      role: 'vendor',
      businessName: 'Test Biz',
      isEmailVerified: true,
      walletBalance: 0
    });
    await user.save();
    userId = user._id;

    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wallet@test.com', password: 'password123' });
    
    token = res.body.data.token;
  });

  it('should deposit funds successfully', async () => {
    const res = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`) // Send Token
      .send({
        amount: 100,
        phoneNumber: '254712345678'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    
    // Verify Balance Updated in DB
    const updatedUser = await User.findById(userId);
    expect(updatedUser.walletBalance).toEqual(100);
  });

  it('should retrieve transaction history', async () => {
    // 1. Do a deposit first
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50, phoneNumber: '254700000000' });

    // 2. Get transactions
    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.transactions.length).toBeGreaterThan(0);
    expect(res.body.data.transactions[0].amount).toEqual(50);
  });
});