const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('User Routes', () => {
    let token;

    beforeEach(async () => {
        const user = new User({ 
            firstName: 'Profile', lastName: 'Test', email: 'p@test.com', 
            password: 'password123', // FIXED
            role: 'student', university: 'Uni', isEmailVerified: true 
        });
        await user.save();
        const res = await request(app).post('/api/auth/login').send({ email: 'p@test.com', password: 'password123' });
        token = res.body.data.token;
    });

    it('should fetch current user profile', async () => {
        const res = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`);
            
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.user.email).toEqual('p@test.com');
    });
});