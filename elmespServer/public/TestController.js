(function(){
    'use strict';
    
    const app = angular.module('elmesp-angular-app',[]);

    app.controller('TestController', ['$scope', (scope) => {
        // Demo basic bindings
        scope.theValue = 20;
        scope.chips = [
            {name: 'Ruffles', price: 12},
            {name: 'Doritos', price: 10},
            {name: 'Rancheritos', price: 1.50}
        ];

        scope.carIdList = [];

        // Site management
        const width = 800;
        const height = 400;
        const margin = {top: 50, bottom: 50, left: 50, right: 50};

        // Events count chart
        axios.get('/api/reports/events').then((response) => {
            const data = response.data;
            console.log(data);

            // Draw a chart
            const x = d3.scaleBand()
                .domain(d3.range(data.length))
                .range([margin.left, width - margin.right])
                .padding(0.4);

            const y = d3.scaleLinear()
                .domain([0, 150])
                .range([height - margin.bottom, margin.top]);

            function xAxis(g){
                g.attr('transform', `translate(0, ${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickFormat(i => EVENT_TYPE_NAMES[(data[i]._id - 1)]));
            }

            function yAxis(g){
                g.attr('transform', `translate(${margin.left}, 0)`)
                .call(d3.axisLeft(y).ticks(null, data.format));
            }

            d3.select('#svg1')
                .append('g')
                .attr('fill', 'royalBlue')
                .selectAll('rect')
                .data(data.sort((a, b) => a._id - b._id))
                .enter()
                .append('rect')
                    .attr('x', (_data, index) => x(index))
                    .attr('y', (data) => y(data.count))
                    .attr('height', data => y(0) - y(data.count))
                    .attr('width', x.bandwidth());

            d3.select('#svg1').append('g').call(yAxis)
            d3.select('#svg1').append('g').call(xAxis);
        });

        axios.get('/api/reports/distinct?field=carId').then((response) => {
            scope.carIdList = response.data;
        });
    }]);
})();