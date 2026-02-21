const { connectDB } = require('./config/db');
console.log('Starting DB connection test...');
connectDB().then(() => {
    console.log('DB Connection Test Passed!');
    process.exit(0);
}).catch(err => {
    console.error('DB Connection Test Failed:', err);
    process.exit(1);
});
