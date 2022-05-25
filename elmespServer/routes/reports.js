import express from 'express';
import Report from '../models/report.js';
import * as d3 from 'd3';
import jsdom from 'jsdom';
const {JSDOM} = jsdom;

const router = express.Router();

const EVENT_TYPE_NAMES = [
    'TIME_INITIALIZATION',
    'TIME_REGISTER',
    'FUEL_LEVEL',
    'SUDDEN_ACCELERATION',
    'SUDDEN_BRAKE',
    'TOP_SPEED'
    ];

router.get('/', async (request, response) => {
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

router.get('/viewer', async (request, response) => {
    console.log('Preparing VIEWER');

    const data = await Report
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

    const width = 800;
    const height = 400;
    const margin = {top: 50, bottom: 50, left: 50, right: 50};

    const htmlD3Container = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    const body = d3.select(htmlD3Container.window.document).select('body');

    // Make an SVG Container
    let svgContainer = body.append('div').attr('class', 'container')
      .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Draw a chart
    const x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([margin.left, width - margin.right])
        .padding(0.4);

    const y = d3.scaleLinear()
            .domain([0, 150])
            .range([height - margin.bottom, margin.top]);

    svgContainer.append('g')
        .attr('fill', 'royalBlue')
        .selectAll('rect')
        .data(data.sort((a, b) => a._id - b._id))
        .join('rect')
            .attr('x', (_data, index) => x(index))
            .attr('y', (data) => y(data.count))
            .attr('height', data => y(0) - y(data.count))
            .attr('width', x.bandwidth())

    svgContainer.append('g').call(yAxis);
    svgContainer.append('g').call(xAxis);

    // Output the result to console
    console.log(body.html());

    response.render('index', {message: 'Hi!', htmlD3Container: body.html()});

    function xAxis(g){
        g.attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(i => EVENT_TYPE_NAMES[(data[i]._id - 1)]));
    }

    function yAxis(g){
        g.attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y).ticks(null, data.format));
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