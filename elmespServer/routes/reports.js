import express from 'express';
import Report from '../models/report.js';
import url from 'url';

const router = express.Router();

router.get('/', async (request, response) => {
    console.log('GET received');

    const queryObject = url.parse(request.url, true).query;
    console.log(queryObject);

    try {
        // Get all reports (Filter by query parameter if any)
        const reports = await Report.find(queryObject);

        response.json(reports);
    } catch(error) {
        response.status(500).json({message: error.message});
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


// UTILITY ENDPOINTS ------------------------------------------------------

// Distinct operation by query parameter 'field'
router.get('/distinct', async (request, response) => {
    const queryObject = url.parse(request.url, true).query;
    console.log(queryObject);

    try{
        const reports = await Report.distinct(queryObject.field);
        response.json(reports);
    } catch(error) {
        response.status(500).json({message: error.message});
    }
});

// Get a given report events 
router.get('/events', async (request, response) => {
    const queryObject = url.parse(request.url, true).query;
    console.log(queryObject);

    try{
        const reports = await Report
            .aggregate([
                {$match: queryObject},
                {$unwind: {path: '$events'}},
                {$group: {
                    _id: '$events.eventType',
                    events: { $push: "$events" },
                    count: { $count: { } }
                }}
            ]);
        
        response.json(reports);
    } catch(error) {
        response.status(500).json({message: error.message});
    }
});


export default router;