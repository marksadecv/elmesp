import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    timestamp: {
        type: Number,
        required: true
    },
    eventType: {
        type: Number,
        required: true
    },
    fuelLevel: {
        type: Number,
        required: false
    },
    initialSpeed: {
        type: Number,
        required: false
    },
    finalSpeed: {
        type: Number,
        required: false
    },
    topSpeed: {
        type: Number,
        required: false
    },
    topRPM: {
        type: Number,
        required: false
    }
});

const ReportSchema = new mongoose.Schema({
    carId: {
        type: String,
        required: true
    },
    events: {
        type: [EventSchema],
        required: false
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    }
});

export default mongoose.model('Report', ReportSchema);