import './App.css';
import React, { useEffect, useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';
import './styles.css';

import { drawChart } from './charts/basic';

function App() {
  const [data, setData] = useState(loadCars);
  const [reports_data, setReports] = useState([])
  
  function loadCars() {
    fetch('/api/reports/distinct?field=carId')
      .then(result => result.json())
      .then(body => {setData(
        body.map(item => {
          return {plates: item}
        })
      )});
  }

  function loadReportsByCarId(carId) {
    const reportsEndpoint = '/api/reports?carId=' + carId + '&fields=carId,timestamp';

    fetch(reportsEndpoint)
      .then(result => result.json())
      .then(body => {setReports(body)});
  }

  function loadReportEvents(reportId) {
    const reportsEndpoint = '/api/reports?_id=' + reportId + '&fields=events,timestamp';

    fetch(reportsEndpoint)
      .then(result => result.json())
      .then(body => {
        const eventsList = body[0].events;

        const eventsHistoryData = eventsList.map(event => {
          return [event.timestamp, event.eventType];
        });

        drawChart('History - ' + body[0].timestamp, eventsHistoryData);
      });
  }
  


  const dataset = [
    [10, 30, 40, 20],
    [10, 40, 30, 20, 50, 10],
    [60, 30, 40, 20, 30]
  ];

  let i = 0;

  const changeChart = () => {
    drawChart(400, 600, dataset[i++]);

    if (i === dataset.length){
      i = 0;
    }
  }

  const columns = [
    {name: 'Plates', selector: row => row.plates, sortable: true}
  ];

  const report_columns = [
    {name: 'Plates', selector: row => row.carId, sortable: true},
    {name: 'Date', selector: row => row.timestamp, sortable: true}
  ];

  // Page render ---------------------
  return (
      <div className="elmesp-container">

        <div className='row'>
          <div className='col-sm-3 border'>
            <DataTable
              columns={columns}
              data={data}
              title='Select a car'
              onRowClicked={(row, _) => {
                loadReportsByCarId(row.plates);
              }}
            />
          </div>

          <div className='col-sm-3 border'>
            <DataTable
              columns={report_columns}
              data={reports_data}
              title='Select a report'
              onRowClicked={(row, _) => {
                //changeChart();
                loadReportEvents(row._id);
              }}
            />
          </div>

          <div className='col-sm-6 border flex-column'>
            <div className="chart-container border">
              <svg id="svg1" width="800" height="300"></svg>
            </div>

            <div className="chart-container border"></div>
          </div>
        </div>
      </div>
  );
}

export default App;
