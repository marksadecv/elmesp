import express from 'express';
import Report from '../models/report.js';
import url from 'url';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', async (request, response) => {
    console.log('GET received');

    const queryObject = url.parse(request.url, true).query;
    const fields = queryObject.fields;
    delete queryObject.fields;

    console.log(queryObject);

    // Build fields query object
    const fieldsQueryObject = {};
    if (fields !== undefined){
        fields.split(',').forEach(field => {
            fieldsQueryObject[field] = 1;
        });

        console.log(fieldsQueryObject);
    }

    try {
        // Get all reports 
        // - Filter by query parameter if any
        // - Return only the requested fields
        const reports = await Report.find(queryObject, fieldsQueryObject);

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



// Get a given report stats 
router.get('/stats', async (request, response) => {
    const queryObject = url.parse(request.url, true).query;
    console.log(queryObject);

    try{
        // Get basic fields (timestamp, carId)
        const report = await Report.find(queryObject, {timestamp:1, carId: 1});


        // Obtain the events summary count
        const reportEvents = await Report
            .aggregate([
                {$match: {_id: mongoose.Types.ObjectId(queryObject._id)}},
                {$unwind: {path: '$events'}},
                {$group: {
                    _id: '$events.eventType',
                    count: { $count: { } }
                }}
            ]);
        

        // Get the max timestamp to get the duration of the report
        const maxTimestampReport = await Report
            .aggregate([
                {$match: {_id: mongoose.Types.ObjectId(queryObject._id)}},
                {$unwind: {path: '$events'}},
                {$group: {
                    _id: '*',
                    maxQuantity: {$max: "$events.timestamp"}
                }}
            ]);

        // Build the response with the gathered data
        response.json(Object.assign({}, {
            date: report[0].timestamp, 
            carId: report[0].carId
        }, {
            events: reportEvents
        }, {
            duration: maxTimestampReport[0].maxQuantity
        }));
    } catch(error) {
        response.status(500).json({message: error.message});
    }
});


export default router;