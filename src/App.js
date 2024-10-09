import React from 'react';
import SSPVisualization from './SSPVisualization';
import GalaxyFitting from './GalaxyFitting';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>SED Modeling Tool</h1>
      <SSPVisualization />
      <GalaxyFitting />
    </div>
  );
}

export default App;