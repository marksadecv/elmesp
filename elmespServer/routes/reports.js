import express from 'express';
import Report from '../models/report.js';

const router = express.Router();

router.get('/', async (_, response) => {
    console.log('GET received');

    //response.send('Hello there!');

    try {
        //const reports = await Report.find();
        const reports = await Report
            .aggregate([
                {$match: {carId: "JPV8523"}},
                {$unwind: {path: '$events'}},
                //{$match: {'events.eventType': {$gt: 3} }}
                {$group: {
                    _id: '$events.eventType',
                    events: { $push: "$events" },
                    count: { $count: { } }
                    }}
            ]);

        response.json(reports);
    } catch(error) {
        response.status(500).json({message: error.message})
    }
});

router.post('/', async (request, response) => {
    console.log('POST received');
    console.log(request.body);

    const report = new Report({
        carId: request.body.carId,
        events: request.body.events
    });

    try {
        const newReport = await report.save();
        response.status(201).json(newReport);
    } catch(error) {
        response.status(400).json({message: error.message});
    }
});


export default router;