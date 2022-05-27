import './App.css';
import React from 'react';
import Button from 'react-bootstrap/Button';

function App() {
  const [carIds, setCarIds] = React.useState(null);

  const getCarIds = () => {
    fetch('/api/reports/distinct?field=carId')
      .then(result => result.json())
      .then(body => setCarIds(body));
  };


  // Page render ---------------------
  return (
    <div>
      <button onClick={getCarIds}>Car IDs</button>
        {
         <div>{carIds}</div>
        }
    </div>
  );
}

export default App;
