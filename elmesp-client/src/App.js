import './App.css';
import React, {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';
import './styles.css';

import { drawChart } from './charts/basic';


const EVENT_TYPES = [
  {name: 'No-Op', value: 0},
  {name: 'TIME INITIALIZATION', value: 1},
  {name: 'TIME REGISTER', value: 2},
  {name: 'FUEL LEVEL', value: 3},
  {name: 'SUDDEN ACCELERATION', value: 4},
  {name: 'SUDDEN BRAKE', value: 5},
  {name: 'TOP SPEED', value: 6}
];

function App() {
  const [data, setData] = useState(loadCars);
  const [reports_data, setReports] = useState([]);
  const [events_data, setEvents] = useState([]);
  const [stats_data, setStats] = useState(loadReportStats);
  
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


        // Populate summary events table
        setEvents(body[0].events)

        // Plot the events history
        drawChart('#events-history-chart', '', eventsHistoryData);
      });
  }

  function loadReportStats(reportId) {
    const reportsEndpoint = '/api/reports/stats?_id=' + reportId;

    fetch(reportsEndpoint)
      .then(result => result.json())
      .then(body => {
        if (body.events){
          // Accumulate the events count
          let allEventsCount = 0;
          body.events.forEach(eventStats => {
            allEventsCount += eventStats.count;
          });

          const mappedBody = {
            date: body.date,
            carId: body.carId,
            duration: body.duration,
            eventsNumber: allEventsCount
          };

          setStats(mappedBody);
        }
      });
  }

  function parameter1Mapper(eventObject){
    switch(eventObject.eventType){
      case 3:
        return eventObject.fuelLevel;
      case 4:
      case 5:
        return eventObject.initialSpeed;
      case 6:
        return eventObject.topSpeed;
      default:
        return '-';
    }
  }

  function parameter2Mapper(eventObject){
    switch(eventObject.eventType){
      case 4:
      case 5:
        return eventObject.finalSpeed;
      default:
        return '-';
    }
  }
  

  const columns = [
    {name: 'Plates', selector: row => row.plates, sortable: true}
  ];

  const report_columns = [
    {name: 'Plates', selector: row => row.carId, sortable: true},
    {name: 'Date', selector: row => row.timestamp, sortable: true}
  ];

  const event_columns = [
    {name: 'Timestamp', selector: row => row.timestamp, sortable: true},
    {name: 'Event type', selector: row => EVENT_TYPES[row.eventType].name, sortable: true},
    {name: 'P1', selector: row => parameter1Mapper(row), sortable: true},
    {name: 'P2', selector: row => parameter2Mapper(row), sortable: true}
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
                loadReportEvents(row._id);
                loadReportStats(row._id);
              }}
            />
          </div>

          <div className='col-sm-6 border flex-column'>
            <div className="border">
              <div className="d-flex justify-content-center"><h3>Summary</h3> </div>

              <div className='container'>
                <form className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="summary-carId-input" className="form-label">Car ID</label>
                    <input type="text" 
                      className="form-control" 
                      id="summary-carId-input" 
                      readOnly={true} 
                      value={stats_data && stats_data.carId}>
                    </input>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="summary-date-input" className="form-label">Date</label>
                    <input type="text" 
                      className="form-control" 
                      id="summary-date-input"
                      readOnly={true} 
                      value={stats_data && stats_data.date}>
                    </input>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="summary-date-input" className="form-label">Duration</label>
                    <input type="text" 
                      className="form-control" 
                      id="summary-duration-input"
                      readOnly={true}
                      value={stats_data && stats_data.duration}>
                    </input>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="summary-date-input" className="form-label">Number of events</label>
                    <input type="text" 
                      className="form-control" 
                      id="summary-eventsNumber-input"
                      readOnly={true} 
                      value={stats_data && stats_data.eventsNumber}>
                    </input>
                  </div>

                  <div className="col-sm-12" style={{height: 300, overflowY: 'scroll', overflowX: 'hidden'}}>
                    <DataTable
                      columns={event_columns}
                      data={events_data}
                      onRowClicked={(row, _) => {
                        //loadReportsByCarId(row.plates);
                        console.log(row._id);
                      }}
                    />
                  </div>

                  <svg id="events-history-chart" width="800" height="300"></svg>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

export default App;
