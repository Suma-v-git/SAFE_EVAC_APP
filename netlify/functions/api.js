import serverless from 'serverless-http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';
import { Shelter } from '../../models/Shelter.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Re-use the database connection logic from server.js
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectToDatabase() {
    if (isConnected && mongoose.connection.readyState === 1) return;

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is missing in Netlify Environment Variables');
    }

    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 15000, // Shorter timeout for serverless
        });
        isConnected = true;
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
}

// Middleware to ensure DB connection
const dbMiddleware = async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(500).json({
            message: `Database Connection Error: ${err.message}. Please ensure MONGODB_URI is set in Netlify settings.`
        });
    }
};

app.use(dbMiddleware);

const router = express.Router();

router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SafeEvac API is live',
        environment: process.env.NODE_ENV || 'production',
        time: new Date().toISOString()
    });
});

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ name, email, password });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: `Signup Error: ${error.message}` });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: `Login Error: ${error.message}` });
    }
});

router.get('/profile/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

router.put('/profile/:email', async (req, res) => {
    try {
        const updatedUser = await User.findOneAndUpdate(
            { email: req.params.email },
            req.body,
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

router.get('/shelters', async (req, res) => {
    try {
        const shelters = await Shelter.find();
        res.json(shelters);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shelters' });
    }
});

router.post('/sos', async (req, res) => {
    const { email, location, locationName } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !user.emergencyEmail) return res.status(404).json({ message: 'Emergency contact not set' });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mapLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.emergencyEmail,
            subject: `🚨 SOS ALERT: ${user.name} needs help!`,
            text: `EMERGENCY ALERT\n\n${user.name} has triggered an SOS.\nLast known location: ${locationName || 'Unknown'}\nMap Link: ${mapLink}`
        });

        res.json({ message: 'SOS alert sent to your emergency contact!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send SOS' });
    }
});

// Handle both standard Netlify Function paths and redirected paths
app.use('/.netlify/functions/api', router);
app.use('/api', router); // For cases where the prefix is retained
app.use('/', router);    // Catch-all for absolute relative paths

export const handler = serverless(app);
