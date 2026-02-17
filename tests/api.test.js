const request = require('supertest');
const app = require('../server');

describe('Backend API Quality Tests', () => {

    // 1. Test Health Endpoint
    test('GET /api/health should return 200 and success status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Server is running');
    });

    // 2. Test Ads Endpoint (Connectivity)
    test('GET /api/ads should return a list (empty or populated)', async () => {
        const res = await request(app).get('/api/ads');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    // 3. Test Error Handling (Invalid Route)
    test('GET /invalid-route should return 404', async () => {
        const res = await request(app).get('/invalid-route');
        expect(res.statusCode).toEqual(404);
    });

    // 4. Test Data Validation for Ads
    test('POST /api/ads should fail if title is missing', async () => {
        const res = await request(app)
            .post('/api/ads')
            .send({
                price: 100,
                description: 'Testing without title'
            });

        // Should return 400 Bad Request because of validation
        expect(res.statusCode).toEqual(400);
    });
});
