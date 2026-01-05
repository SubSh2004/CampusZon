import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables Test ===');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'LOADED ✓' : 'NOT LOADED ✗');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'LOADED ✓' : 'NOT LOADED ✗');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'LOADED ✓' : 'NOT LOADED ✗');
console.log('=== End Test ===');
