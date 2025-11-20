const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Task = require('../models/Task');

describe('Task Routes', () => {
  let vendorToken, studentToken, vendorId, studentId;

  // We use beforeEach to seed fresh data for every test
  beforeEach(async () => {
    // 1. Create Vendor with MONEY (1000)
    const vendor = new User({
      firstName: 'Test', lastName: 'Vendor',
      email: 'vendor@tasks.com', password: 'password123',
      role: 'vendor', businessName: 'Task Biz', 
      walletBalance: 1000, // <--- Enough money
      isEmailVerified: true
    });
    await vendor.save();
    vendorId = vendor._id;

    // 2. Create Student
    const student = new User({
      firstName: 'Test', lastName: 'Student',
      email: 'student@tasks.com', password: 'password123',
      role: 'student', university: 'Test Uni', walletBalance: 0, isEmailVerified: true
    });
    await student.save();
    studentId = student._id;

    // 3. Get Tokens
    const vRes = await request(app).post('/api/auth/login').send({ email: 'vendor@tasks.com', password: 'password123' });
    vendorToken = vRes.body.data.token;

    const sRes = await request(app).post('/api/auth/login').send({ email: 'student@tasks.com', password: 'password123' });
    studentToken = sRes.body.data.token;
  });

  it('should create a new task as vendor', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send({
        description: 'Pickup Box for Delivery', // > 10 chars
        pickupLocation: 'Juja Main Gate',       // > 3 chars (FIXED)
        dropoffLocation: 'Hostel Block A',      // > 3 chars (FIXED)
        estimatedTime: 30,
        rewardAmount: 500
      });

    // Debug logging if it fails
    if (res.statusCode !== 201) {
        console.log("Task Error:", JSON.stringify(res.body, null, 2));
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
  });

  it('should allow student to claim a task', async () => {
    // Create task first
    const task = new Task({
        description: 'Test Task Description Here', 
        pickupLocation: 'Location A', 
        dropoffLocation: 'Location B',
        estimatedTime: 30, 
        rewardAmount: 500, 
        createdBy: vendorId, 
        status: 'available'
    });
    await task.save();

    const res = await request(app)
      .put(`/api/tasks/${task._id}/assign`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.task.status).toEqual('in-progress');
  });
});