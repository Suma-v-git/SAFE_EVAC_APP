import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    emergencyEmail1: { type: String, required: false },
    emergencyEmail2: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
