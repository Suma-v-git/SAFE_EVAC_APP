import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Shelter } from './models/Shelter.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/safe';
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const count = await Shelter.countDocuments();
        console.log(`Total Shelters: ${count}`);
        const all = await Shelter.find({});
        console.log(JSON.stringify(all, null, 2));
        mongoose.connection.close();
    })
    .catch(err => console.error(err));
