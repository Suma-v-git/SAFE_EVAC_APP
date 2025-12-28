import mongoose from 'mongoose';

const ShelterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    capacity: { type: String }, // e.g. "85% full" or number
    status: { type: String, enum: ['Open', 'Full', 'Closed'], default: 'Open' },
    notes: { type: String },
    distance: { type: String }, // Optional, mostly calculated dynamically but good to store if static
});

export const Shelter = mongoose.models.Shelter || mongoose.model('Shelter', ShelterSchema);
