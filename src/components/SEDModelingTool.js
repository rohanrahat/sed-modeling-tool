// import React, { useState, useCallback, useEffect } from 'react';
// import Plot from 'react-plotly.js';
// import useSSPModels from '../hooks/useSSPModels';
// import useSpectrumPlot from '../hooks/useSpectrumPlot';

// const SEDModelingTool = () => {
//   const { sspModels, isLoading, error } = useSSPModels();
//   const [galaxySpectrum, setGalaxySpectrum] = useState(null);
//   const [combinedSpectrum, setCombinedSpectrum] = useState(null);
//   const [dustAttenuation, setDustAttenuation] = useState(0);
//   const [sspWeights, setSSPWeights] = useState([]);

//   const { plotData, layout } = useSpectrumPlot(sspModels, combinedSpectrum, galaxySpectrum);

//   useEffect(() => {
//     if (sspModels.length > 0) {
//       setSSPWeights(new Array(sspModels.length).fill(0));
//     }
//   }, [sspModels]);

//   const combineSpectra = useCallback(() => {
//     if (sspModels.length === 0 || sspWeights.length === 0) return null;

//     const combinedData = sspModels[0].data.map((_, index) => {
//       const wavelength = sspModels[0].data[index].wavelength;
//       const luminosity = sspModels.reduce((sum, model, modelIndex) => {
//         return sum + model.data[index].luminosity * sspWeights[modelIndex];
//       }, 0);
//       return { wavelength, luminosity };
//     });

//     // Apply dust attenuation
//     const attenuatedData = combinedData.map(({ wavelength, luminosity }) => {
//       const tau = dustAttenuation * Math.pow(wavelength / 5000, -0.7);
//       const attenuatedLuminosity = luminosity * Math.exp(-tau);
//       return { wavelength, luminosity: attenuatedLuminosity };
//     });

//     return attenuatedData;
//   }, [sspModels, sspWeights, dustAttenuation]);

//   useEffect(() => {
//     setCombinedSpectrum(combineSpectra());
//   }, [combineSpectra]);

//   const handleSSPChange = useCallback((index, value) => {
//     setSSPWeights(prev => {
//       const newWeights = [...prev];
//       newWeights[index] = parseFloat(value);
//       return newWeights;
//     });
//   }, []);

//   const handleDustChange = useCallback((value) => {
//     setDustAttenuation(parseFloat(value));
//   }, []);

//   if (isLoading) return <div>Loading SSP models...</div>;
//   if (error) return <div>Error loading SSP models: {error}</div>;

//   return (
//     <div className="sed-modeling-tool">
//       <h1>SED Modeling Visualization Tool</h1>
//       <div className="controls">
//         {sspModels.map((model, index) => (
//           <div key={model.age}>
//             <label>{model.age} Myr SSP:</label>
//             <input
//               type="range"
//               min="0"
//               max="1"
//               step="0.01"
//               value={sspWeights[index] || 0}
//               onChange={(e) => handleSSPChange(index, e.target.value)}
//             />
//             <span>{sspWeights[index]?.toFixed(2) || 0}</span>
//           </div>
//         ))}
//         <div>
//           <label>Dust Attenuation:</label>
//           <input
//             type="range"
//             min="0"
//             max="2"
//             step="0.1"
//             value={dustAttenuation}
//             onChange={(e) => handleDustChange(e.target.value)}
//           />
//           <span>{dustAttenuation.toFixed(1)}</span>
//         </div>
//       </div>
//       <div className="plot">
//         <Plot
//           data={plotData}
//           layout={layout}
//           style={{ width: '100%', height: '600px' }}
//         />
//       </div>
//     </div>
//   );
// };

// export default SEDModelingTool;

import React, { useState, useCallback, useEffect } from 'react';
import Plot from 'react-plotly.js';
import useSSPModels from '../hooks/useSSPModels';
import useSpectrumPlot from '../hooks/useSpectrumPlot';

const SEDModelingTool = () => {
  const { sspModels, isLoading, error, loadUserModels } = useSSPModels();
  const [sspWeights, setSSPWeights] = useState([]);
  const [dustAttenuation, setDustAttenuation] = useState(0);

  useEffect(() => {
    if (sspModels.length > 0) {
      const initialWeights = new Array(sspModels.length).fill(0.5);
      console.log("Initializing SSP weights:", initialWeights);
      setSSPWeights(initialWeights);
    }
  }, [sspModels]);

  useEffect(() => {
    console.log("SSP Models:", sspModels);
    console.log("SSP Weights:", sspWeights);
    console.log("Dust Attenuation:", dustAttenuation);
  }, [sspModels, sspWeights, dustAttenuation]);

  console.log("Before useSpectrumPlot - SSP Models:", sspModels);
  console.log("Before useSpectrumPlot - SSP Weights:", sspWeights);

  const { plotData, layout } = useSpectrumPlot(sspModels, sspWeights, dustAttenuation);

  console.log("After useSpectrumPlot - SSP Models:", sspModels);
  console.log("After useSpectrumPlot - SSP Weights:", sspWeights);

  console.log("Plot Data:", plotData);
  console.log("Layout:", layout);

  const handleSSPChange = useCallback((index, value) => {
    setSSPWeights(prev => {
      const newWeights = [...prev];
      newWeights[index] = parseFloat(value);
      return newWeights;
    });
  }, []);

  const handleDustChange = useCallback((value) => {
    setDustAttenuation(parseFloat(value));
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      loadUserModels(file);
    }
  };

  if (isLoading) return <div>Loading SSP models...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="sed-modeling-tool">
      <h1>SED Modeling Visualization Tool</h1>
      <div className="file-upload">
        <input type="file" onChange={handleFileUpload} accept=".txt" />
        <p>Upload your own BC03 model file (optional)</p>
      </div>
      <div className="controls">
        {sspModels.map((model, index) => (
          <div key={model.age}>
            <label>{model.age} Myr SSP:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sspWeights[index] || 0}
              onChange={(e) => handleSSPChange(index, e.target.value)}
            />
            <span>{sspWeights[index]?.toFixed(2) || 0}</span>
          </div>
        ))}
        <div>
          <label>Dust Attenuation:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={dustAttenuation}
            onChange={(e) => handleDustChange(e.target.value)}
          />
          <span>{dustAttenuation.toFixed(1)}</span>
        </div>
      </div>
      <div className="plot">
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: '600px' }}
        />
      </div>
    </div>
  );
};

export default SEDModelingTool;