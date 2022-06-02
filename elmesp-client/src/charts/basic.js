import * as d3 from 'd3';

export function drawChart(title, data){
    // const dataset1 = [
    //     [1,1], [20,20], [24,36],
    //     [32, 50], [40, 70], [50, 100],
    //     [55, 106], [65, 123], [73, 130],
    //     [78, 134], [83, 136], [89, 138],
    //     [100, 140]
    // ];

    // Draw a chart
    const svg2 = d3.select("#svg1"),
        margin = 50,
        width = svg2.attr("width") - margin,
        height = svg2.attr("height") - margin;

    const xScale = d3.scaleLinear().domain([0, 1000]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 7]).range([height, 0]);

    const g = svg2.append("g")
        .attr("transform", "translate(" + 60 + "," + 20 + ")");

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

    // Y label
    svg2.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(20,' + height/2 + ')rotate(-90)')
        .style('font-family', 'Helvetica')
        .style('font-size', 12)
        .text('Event type');

    // Step 6
    g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));
    
    g.append("g")
        .call(d3.axisLeft(yScale));

    // Step 7
    svg2.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return xScale(d[0]); } )
        .attr("cy", function (d) { return yScale(d[1]); } )
        .attr("r", 3)
        .attr("transform", "translate(" + margin + "," + margin + ")")
        .style("fill", "#CC0000");
}