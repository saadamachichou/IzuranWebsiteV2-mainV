import 'dotenv/config';

console.log('Environment variables:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET); 