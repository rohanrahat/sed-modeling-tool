import React from 'react';
import './App.css';
import SSPVisualization from './SSPVisualization';
import GalaxyFitting from './GalaxyFitting';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>SED Modeling Tool</h1>
          <a href="https://rohanrahat.github.io" className="back-link">
            Back to Main Website
          </a>
        </div>
      </header>
      
      <main className="app-main">
        <SSPVisualization />
        <GalaxyFitting />
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} SED Modeling Tool. Rohan Rahatgaonkar. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;