import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();
const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri ? uri.split('@').pop() : 'NOT SET');
if (!uri) {
    console.error('CRITICAL: MONGODB_URI is not defined in .env');
    process.exit(1);
}
mongoose.connect(uri)
    .then(() => {
        console.log('✅ Successfully connected to MongoDB Atlas');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
