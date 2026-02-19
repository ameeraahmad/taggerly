const request = require('supertest');
const app = require('../server');
const { getSyncPromise } = require('../config/db');

describe('Backend API Tests - Dubizzle Clone', () => {

    beforeAll(async () => {
        // Wait for database sync to complete before running tests
        await getSyncPromise();
    });

    // 1. Health Check
    test('GET /api/health - should return 200 and server status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Server is running');
    });

    // 2. Ads - Get All
    test('GET /api/ads - should return list of ads', async () => {
        const res = await request(app).get('/api/ads');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    // 3. Ads - Validation (missing required fields)
    test('POST /api/ads - should fail without auth token', async () => {
        const res = await request(app)
            .post('/api/ads')
            .send({ title: 'Test Ad', price: 100 });
        expect(res.statusCode).toEqual(401);
    });

    // 4. Auth - Register with missing fields
    test('POST /api/auth/register - should fail with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com' });
        expect(res.statusCode).toEqual(400);
    });

    // 5. Auth - Login with wrong credentials
    test('POST /api/auth/login - should fail with wrong credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'wrong@email.com', password: 'wrongpassword' });
        expect(res.statusCode).toEqual(401);
    });

    // 6. Invalid Route
    test('GET /invalid-route - should return 404', async () => {
        const res = await request(app).get('/invalid-route');
        expect(res.statusCode).toEqual(404);
    });

    // 7. Single Ad - Not Found
    test('GET /api/ads/:id - should return 404 for invalid id', async () => {
        const res = await request(app).get('/api/ads/999999');
        expect(res.statusCode).toEqual(404);
    });

    // 8. Test Pagination
    test('GET /api/ads - should support pagination', async () => {
        const res = await request(app).get('/api/ads?limit=2&page=1');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('totalPages');
    });

});

