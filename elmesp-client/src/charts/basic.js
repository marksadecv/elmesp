import * as d3 from 'd3';

const EVENT_TYPES_MAP = {
    "1": {
        label: 'TIME_INITIALIZATION',
        value: '1',
        color: '#cc0000'
    },
    "2": {
        label: 'TIME_REGISTER',
        value: '2',
        color: '#0000cc'
    },
    "3": {
        label: 'FUEL_LEVEL',
        value: '3',
        color: '#8fce00'
    },
    "4": {
        label: 'SUDDEN_ACCELERATION',
        value: '4',
        color: '#f1c232'
    },
    "5": {
        label: 'SUDDEN_BRAKE',
        value: '5',
        color: '#733f83'
    },
    "6": {
        label: 'TOP_SPEED',
        value: '6',
        color: '#2986cc'
    },
    "7": {
        label: 'TOP_RPM',
        value: '7',
        color: '#0cc000'
    }
};

// Mapping example {timestamp: 30, label: 'TOP_SPEED', color: '#CC0000'}
function eventMapper([timestamp, eventType]){
    //return [timestamp, EVENT_TYPES_MAP[eventType].label, EVENT_TYPES_MAP[eventType].color];
    return {
        timestamp: timestamp,
        label: EVENT_TYPES_MAP[eventType].label,
        color: EVENT_TYPES_MAP[eventType].color
    };
}

export function drawTopSpeedChart(selector, title, data){
    const chartSvg = d3.select(selector),
        margin = 50,
        width = chartSvg.attr("width") - margin,
        height = chartSvg.attr("height") - margin;

    const xScale = d3.scaleLinear().domain([0, 1000]).range([0, width]);
    const yScale = d3.scaleLinear().domain([160, 0]).range([0, height]);

    const g = chartSvg.append("g")
        .attr("transform", "translate(" + 60 + "," + 20 + ")");

    // Title
    chartSvg.append('text')
        .attr('x', width/2 + 100)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 20)
        .text(title);

    // X label
    chartSvg.append('text')
        .attr('x', width/2 + 100)
        .attr('y', height + margin)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Timestamp');

    // Step 6
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));


    // Step 7
    chartSvg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => { return xScale(d.timestamp); } )
        .attr("cy", (d) => { return yScale(d.topSpeed); } )
        .attr("r", 3)
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .style("fill", "#CC0000")
}

export function drawChart(selector, title, data){
    const mappedData = data.map(eventMapper);
    const eventTypeNames = Object.values(EVENT_TYPES_MAP).map(eventDefinition => eventDefinition.label);

    // Draw a chart
    const svg2 = d3.select(selector),
        margin = 60,
        width = svg2.attr("width") - margin,
        height = svg2.attr("height") - margin;

    const xScale = d3.scaleLinear().domain([0, 900]).range([0, width]);
    const yScale = d3.scaleBand()
        .domain(eventTypeNames)
        .range([height, 0]);

    const g = svg2.append("g")
        .attr("transform", "translate(" + 80 + "," + 40 + ")");

    // Title
    svg2.append('text')
        .attr('x', width/2 + 100)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 20)
        .text(title);

    // X label
    svg2.append('text')
        .attr('x', width/2 + 100)
        .attr('y', height + margin)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Timestamp');

    // Step 6
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));

    // Step 7
    svg2.append('g')
        .selectAll("dot")
        .data(mappedData)
        .enter()
        .append("circle")
        .attr("cx", (d) => { return xScale(d.timestamp); } )
        .attr("cy", (d) => { return yScale(d.label); } )
        .attr("r", 3)
        .attr("transform", "translate(" + 80 + "," + margin + ")")
        .style("fill", (d) => d.color)
}

export function drawGenericChart(selector, title, data, domainX, domainY) {
    const chartSvg = d3.select(selector),
        margin = 50,
        width = chartSvg.attr("width") - margin,
        height = chartSvg.attr("height") - margin;

    const xScale = d3.scaleLinear().domain(domainX).range([0, width]);
    const yScale = d3.scaleLinear().domain(domainY).range([0, height]);

    const g = chartSvg.append("g")
        .attr("transform", "translate(" + 60 + "," + 20 + ")");

    // Title
    chartSvg.append('text')
        .attr('x', width/2 + 100)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 20)
        .text(title);

    // X label
    chartSvg.append('text')
        .attr('x', width/2 + 100)
        .attr('y', height + margin)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Timestamp');

    // Step 6
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));


    // Step 7
    chartSvg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (d) => { return xScale(d.xValue); } )
        .attr("cy", (d) => { return yScale(d.yValue); } )
        .attr("r", 3)
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .style("fill", (d) => d.color);
}