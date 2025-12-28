import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/safe', {
    directConnection: true,
    serverSelectionTimeoutMS: 5000
}).then(async () => {
    console.log('Connected to DB');
    try {
        const users = await mongoose.connection.db.collection('users').find().toArray();
        console.log('Users found:', users.length);
        console.log(users);
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error('Connection error:', err);
});
