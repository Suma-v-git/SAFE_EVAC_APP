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

// SOS Alert Route
router.post('/sos', async (req, res) => {
    console.log("SOS Alert Triggered");
    try {
        const { email, location } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const targetEmails = [];
        if (user.emergencyEmail1) targetEmails.push(user.emergencyEmail1);
        if (user.emergencyEmail2) targetEmails.push(user.emergencyEmail2);

        if (targetEmails.length === 0) {
            return res.status(400).json({ message: 'Emergency contact not set. Please update your profile.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Handle location string properly (extract link if possible)
        const mapLink = location.includes('http')
            ? location.split('Link: ')[1] || location
            : `https://www.google.com/maps?q=${location}`;

        const mailOptions = {
            from: `SafeEvac Alert <${process.env.EMAIL_USER}>`,
            to: targetEmails.join(', '),
            subject: '🚨 SOS ALERT! SafeEvac User Needs Help',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                    <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY SOS ALERT</h1>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            <strong>${user.name}</strong> has triggered an emergency SOS alert and needs immediate assistance.
                        </p>
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b; font-weight: bold;">⏰ Alert Time:</p>
                            <p style="margin: 5px 0 0 0; color: #333;">${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #1e40af; font-weight: bold;">📍 Current Location:</p>
                            <p style="margin: 5px 0 0 0; color: #333;">${location}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${mapLink}" 
                               style="display: inline-block; background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                📍 View Location on Google Maps
                            </a>
                        </div>
                        
                        <div style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #854d0e; font-weight: bold;">⚠️ What to do:</p>
                            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
                                <li>Try to contact ${user.name} immediately</li>
                                <li>Check their location using the map link above</li>
                                <li>If you cannot reach them, contact local emergency services</li>
                                <li>Share their location with authorities if needed</li>
                            </ul>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
                            This is an automated emergency alert from SafeEvac.<br>
                            You are receiving this because you are listed as an emergency contact.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: `SOS Alert sent to ${targetEmails.join(', ')}` });

    } catch (error) {
        console.error("SOS Error:", error);
        res.status(500).json({ message: 'Failed to send SOS', error: error.message });
    }
});

// Handle both standard Netlify Function paths and redirected paths
app.use('/.netlify/functions/api', router);
app.use('/api', router); // For cases where the prefix is retained
app.use('/', router);    // Catch-all for absolute relative paths

export const handler = serverless(app);
