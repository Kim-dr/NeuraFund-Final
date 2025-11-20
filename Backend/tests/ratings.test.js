const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Task = require('../models/Task');

describe('Ratings Routes', () => {
    let vendorToken, studentId, vendorId, taskId;

    beforeEach(async () => {
        // 1. Setup Users with VALID passwords (min 6 chars)
        const vendor = new User({ 
            firstName: 'V', lastName: 'V', email: 'v@rate.com', 
            password: 'password123', // FIXED
            role: 'vendor', businessName: 'Biz', isEmailVerified: true 
        });
        const student = new User({ 
            firstName: 'S', lastName: 'S', email: 's@rate.com', 
            password: 'password123', // FIXED
            role: 'student', university: 'Uni', isEmailVerified: true 
        });
        
        await vendor.save();
        await student.save();
        
        vendorId = vendor._id;
        studentId = student._id;

        // 2. Login Vendor
        const login = await request(app).post('/api/auth/login').send({ email: 'v@rate.com', password: 'password123' });
        vendorToken = login.body.data.token;

        // 3. Create a COMPLETED Task
        const task = new Task({
            description: 'Done Task', pickupLocation: 'A', dropoffLocation: 'B',
            estimatedTime: 10, rewardAmount: 100,
            createdBy: vendorId, assignedTo: studentId, status: 'completed'
        });
        await task.save();
        taskId = task._id;
    });

    it('should allow vendor to rate student', async () => {
        const res = await request(app)
            .post('/api/ratings')
            .set('Authorization', `Bearer ${vendorToken}`)
            .send({
                toUser: studentId,
                taskId: taskId,
                score: 5,
                comment: 'Great job!'
            });

        expect(res.statusCode).toEqual(201);
        
        const updatedStudent = await User.findById(studentId);
        expect(updatedStudent.totalRatings).toBe(1);
        expect(updatedStudent.averageRating).toBe(5);
    });

    it('should prevent duplicate ratings', async () => {
        await request(app).post('/api/ratings').set('Authorization', `Bearer ${vendorToken}`).send({ toUser: studentId, taskId, score: 5 });
        
        const res = await request(app)
            .post('/api/ratings')
            .set('Authorization', `Bearer ${vendorToken}`)
            .send({ toUser: studentId, taskId, score: 1 });

        expect(res.statusCode).toEqual(400);
    });
});