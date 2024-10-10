import React from 'react';
import SSPVisualization from './SSPVisualization';
import GalaxyFitting from './GalaxyFitting';
import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <h1>SED Modeling Tool</h1>
//       <SSPVisualization />
//       <GalaxyFitting />
//     </div>
//   );
// }

// export default App;

function App() {
  return (
    <div className="App flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">SED Modeling Tool</h1>
          <a href="https://rohanrahat.github.io/astro-resources.html" className="text-blue-300 hover:text-white transition-colors">
            Back to Main Website
          </a>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-grow">
        <SSPVisualization/>
        <GalaxyFitting />
      </main>
      <footer className="bg-gray-800 text-white py-4">
        <p className="text-center text-sm">
          © {new Date().getFullYear()} SED-Modeling Tool. Rohan Rahatgaonkar. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;