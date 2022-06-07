import './App.css';
import React, {useState} from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import DataTable from 'react-data-table-component';
import './styles.css';

import {drawChart, drawGenericChart} from './charts/basic';


const EVENT_TYPES = [
  {name: 'No-Op', value: 0},
  {name: 'TIME INITIALIZATION', value: 1},
  {name: 'TIME REGISTER', value: 2},
  {name: 'FUEL LEVEL', value: 3},
  {name: 'SUDDEN ACCELERATION', value: 4},
  {name: 'SUDDEN BRAKE', value: 5},
  {name: 'TOP SPEED', value: 6},
  {name: 'TOP RPM', value: 7}
];

const EVENT_TYPE_KEYS = {
  TIME_INITIALIZATION: 1,
  TIME_REGISTER: 2,
  FUEL_LEVEL: 3,
  SUDDEN_ACCELERATION: 4,
  SUDDEN_BRAKE: 5,
  TOP_SPEED: 6,
  TOP_RPM: 7,
};

function App() {
  const [data, setData] = useState(loadCars);
  const [reports_data, setReports] = useState([]);
  const [events_data, setEvents] = useState([]);
  const [stats_data, setStats] = useState(loadReportStats);
  const [current_panel, setCurrentPanel] = useState('');
  
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

        // Populate summary events table
        setEvents(eventsList);

        // Plot the events history
        const eventsHistoryData = eventsList.map(event => {
          return [event.timestamp, event.eventType];
        });
        drawChart('#events-history-chart', '', eventsHistoryData);

        // Filter the all events list into separate events list and states...

        // TOP_SPEED chart ------------------------------------------------------------
        const topSpeedEvents = eventsList
          .filter(item => item.eventType === EVENT_TYPE_KEYS.TOP_SPEED)
          .map(topSpeedGenericMapper);

        drawGenericChart('#top-speed-events-chart', 'Top speed events', topSpeedEvents, [0, 1000], [160, 0], 'Km/h');

        // FUEL_LEVEL chart ------------------------------------------------------------
        const fuelLevelEvents = eventsList
          .filter(item => item.eventType === EVENT_TYPE_KEYS.FUEL_LEVEL)
          .map(fuelLevelGenericMapper);

        drawGenericChart('#fuel-level-events-chart', 'Fuel level events', fuelLevelEvents, [0, 1000], [100, 0], 'Percentage');

        // SPEED_DELTA chart ------------------------------------------------------------
        const speedChangeEvents = eventsList
          .filter(item => {
            return (item.eventType === EVENT_TYPE_KEYS.SUDDEN_ACCELERATION || item.eventType === EVENT_TYPE_KEYS.SUDDEN_BRAKE);
          }).map(speedDeltaGenericMapper);

        drawGenericChart('#speed-delta-events-chart', 'Speed delta events', speedChangeEvents, [0, 1000], [100, -100], 'Km/h');

        // TOP_RPM chart ------------------------------------------------------------
        const topRPMEvents = eventsList
          .filter(item => {
            return (item.eventType === EVENT_TYPE_KEYS.TOP_RPM);
          }).map(topRPMGenericMapper);

        drawGenericChart('#top-rpm-events-chart', 'Top RPM events', topRPMEvents, [0, 1000], [5000, 0], 'RPM');
      });
  }

  function topSpeedGenericMapper(eventObject){
    return {
        xValue: eventObject.timestamp,
        yValue: eventObject.topSpeed,
        color: '#2986cc'
    };
  }

  function fuelLevelGenericMapper(eventObject){
    return {
        xValue: eventObject.timestamp,
        yValue: eventObject.fuelLevel,
        color: '#cc0000'
    };
  }

  function speedDeltaGenericMapper(eventObject){
    const speedDelta = eventObject.finalSpeed - eventObject.initialSpeed;

    return {
        xValue: eventObject.timestamp,
        yValue: speedDelta,
        color: eventObject.eventType === EVENT_TYPE_KEYS.SUDDEN_ACCELERATION ? '#f1c232' : '#733f83'
    };
  }

  function topRPMGenericMapper(eventObject){
    return {
        xValue: eventObject.timestamp,
        yValue: eventObject.topRPM,
        color: '#0cc000'
    };
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
      case 7:
          return eventObject.topRPM;
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
      <div>

        <div className='row'>
          <div className='col-sm-12' style={{height: 50, backgroundColor: 'black'}}>
            <img src='/logo.png' alt='logo' width="45" height="45"></img>
            
              <span className='h3 elmesp-title-text elmesp-vertical-align-middle'>ElmESP</span>
          </div>
        </div>

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
                setCurrentPanel('SUMMARY');
                loadReportStats(row._id);
                loadReportEvents(row._id);
              }}
            />
          </div>

          <div className='col-sm-6 border flex-column'>
            
            <div className={current_panel === 'SUMMARY' ? 'elmesp-block' : 'elmesp-hidden'}>
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
                    />
                  </div>

                  <svg id="events-history-chart" width="900" height="300"></svg>

                  <button type="button" 
                          className="btn btn-link"
                          onClick={() => setCurrentPanel('DETAILS')}>View details</button>
                </form>
              </div>
            </div>
            

            <div className={current_panel === 'DETAILS' ? 'elmesp-block' : 'elmesp-hidden'}>
              <div className="d-flex justify-content-center">
                <h3>Details</h3>
              </div>
              
              <button type="button" 
                          className="btn btn-link"
                          onClick={() => setCurrentPanel('SUMMARY')}>View summary</button>
              
              <div style={{height: "80vh", overflowY: 'scroll', overflowX: 'hidden'}}>
                <svg id="top-speed-events-chart" className="mb-4" width="800" height="300"></svg>
                
                <svg id="fuel-level-events-chart" className="mb-4" width="800" height="300"></svg>

                <svg id="speed-delta-events-chart" className="mb-4" width="800" height="300"></svg>

                <svg id="top-rpm-events-chart" className="mb-4" width="800" height="300"></svg>
              </div>
            </div>
            
          </div>
        </div>
      </div>
  );
}

export default App;
