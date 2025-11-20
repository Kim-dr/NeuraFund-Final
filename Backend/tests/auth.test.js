const request = require('supertest');
const app = require('../server'); // Import your Express App
const User = require('../models/User');

describe('Authentication Routes', () => {
  
  // --- REGISTRATION TEST ---
  it('should register a new student', async () => {
    const res = await request(app)
      .post('/api/auth/register/student')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@test.com',
        password: 'password123',
        university: 'JKUAT',
        studentId: 'S123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toEqual('student@test.com');
  });

  // --- LOGIN TEST ---
  it('should login an existing user', async () => {
    // 1. Create User directly in DB
    const user = new User({
      firstName: 'Jane',
      lastName: 'Vendor',
      email: 'vendor@test.com',
      password: 'password123', // Model will hash this
      role: 'vendor',
      businessName: 'Jane Shop',
      isEmailVerified: true
    });
    await user.save();

    // 2. Try to Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'vendor@test.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('token');
  });

  // --- ERROR HANDLING TEST ---
  it('should reject wrong password', async () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      password: 'password123',
      role: 'student',
      university: 'Test',
      isEmailVerified: true
    });
    await user.save();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'WRONGPASSWORD'
      });

    expect(res.statusCode).toEqual(401);
  });
});