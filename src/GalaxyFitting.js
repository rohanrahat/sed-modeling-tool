import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart } from 'recharts';
import { LinearProgress, Typography, Box } from '@mui/material';
import './GalaxyFitting.css';

const GalaxyFitting = () => {
  const [observedData, setObservedData] = useState([]);
  const [sspData, setSSPData] = useState(null);
  const [modelParameters, setModelParameters] = useState({
    c1: 10,
    c2: 50,
    c3: 120,
    c4: 50,
    c5: 120.0,
    tauV: 1.0
  });
  const [wavelengthRange, setWavelengthRange] = useState([3600, 9000]);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState(null);

  const parameterRanges = {
    c1: { min: 0, max: 10 },
    c2: { min: 0, max: 100 },
    c3: { min: 0, max: 1000 },
    c4: { min: 0, max: 150 },
    c5: { min: 0, max: 150 },
    tauV: { min: 0, max: 2 }
  };

  useEffect(() => {
    fetchObservedData();
    fetchSSPData();
  }, []);

  const fetchObservedData = async () => {
    try {
    //   const response = await fetch('/manga_7443-6102.txt');
      const response = await fetch(`${process.env.PUBLIC_URL}/manga_7443-6102.txt`);
      const text = await response.text();
      const parsedData = parseObservedData(text);
      setObservedData(parsedData);
      console.log('Default observed data loaded:', parsedData.length, 'points');
    } catch (error) {
      console.error('Error fetching observed data:', error);
      setFileUploadError('Error loading default data. Please try uploading your own file.');
    }
  };

  const parseObservedData = (text) => {
    try {
      const lines = text.trim().split('\n');
      const data = lines.slice(1).map(line => {
        const [wave, luminosity] = line.trim().split(/\s+/).map(Number);
        if (isNaN(wave) || isNaN(luminosity)) {
          throw new Error('Invalid data format');
        }
        return { wavelength: wave, observed: luminosity };
      });
      if (data.length === 0) {
        throw new Error('No valid data points found');
      }
      return data;
    } catch (error) {
      console.error('Error parsing observed data:', error);
      throw error;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileUploadError(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const parsedData = parseObservedData(text);
          setObservedData(parsedData);
          console.log('Uploaded data loaded:', parsedData.length, 'points');
          const minWavelength = Math.min(...parsedData.map(d => d.wavelength));
          const maxWavelength = Math.max(...parsedData.map(d => d.wavelength));
          setWavelengthRange([minWavelength, maxWavelength]);
        } catch (error) {
          console.error('Error processing uploaded file:', error);
          setFileUploadError('Error processing file. Please ensure it matches the required format.');
        }
      };
      reader.onerror = (e) => {
        console.error('File read error:', e);
        setFileUploadError('Error reading file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const fetchSSPData = async () => {
    try {
      const response = await fetch(`${process.env.PUBLIC_URL}/bc03_models.txt`);
      const text = await response.text();
      const parsedData = parseSSPData(text);
      setSSPData(parsedData);
      console.log('SSP data loaded:', Object.keys(parsedData));
    } catch (error) {
      console.error('Error fetching SSP data:', error);
    }
  };

  const parseSSPData = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].trim().split(/\s+/);
    const data = lines.slice(1).map(line => {
      const values = line.trim().split(/\s+/).map(Number);
      return {
        WAVE: values[0],
        LUM1: values[1],
        LUM10: values[2],
        LUM100: values[3],
        LUM1000: values[4],
        LUM5000: values[5],
        LUM10000: values[6],
      };
    });
  
    return {
      wavelengths: data.map(d => d.WAVE),
      L1: data.map(d => d.LUM1),
      L100: data.map(d => d.LUM100),
      L1000: data.map(d => d.LUM1000),
      L10Gyr: data.map(d => d.LUM10000)
    };
  };

  const interpolateSSP = (wavelengths, luminosities, wavelength) => {
    const i = wavelengths.findIndex(w => w > wavelength);
    if (i === 0) return luminosities[0];
    if (i === -1) return luminosities[luminosities.length - 1];
    const x0 = wavelengths[i - 1], x1 = wavelengths[i];
    const y0 = luminosities[i - 1], y1 = luminosities[i];
    return y0 + (y1 - y0) * (wavelength - x0) / (x1 - x0);
  };

  const calculateModel = (data, sspData, parameters) => {
    if (!sspData) return [];
    const { c1, c2, c3, c4, c5, tauV } = parameters;
    
    return data.map(point => {
      const wavelength = point.wavelength;
      const L1 = interpolateSSP(sspData.wavelengths, sspData.L1, wavelength);
      const L100 = interpolateSSP(sspData.wavelengths, sspData.L100, wavelength);
      const L1000 = interpolateSSP(sspData.wavelengths, sspData.L1000, wavelength);
      const L10Gyr = interpolateSSP(sspData.wavelengths, sspData.L10Gyr, wavelength);
      
      const combinedSSP = c1*L1 + c2*L100 + c3*L1000 + c4*L10Gyr;
      const dustFactor = Math.exp(-tauV * Math.pow(wavelength / 5000, -0.7));
      const modelValue = combinedSSP * c5 * dustFactor;

      return { ...point, model: modelValue };
    });
  };

  const calculateChiSquare = (observed, model) => {
    return observed.reduce((sum, point, index) => {
      const modelPoint = model[index];
      if (!modelPoint) return sum;
      const diff = point.observed - modelPoint.model;
      const error = 1; // Assuming constant error of 1 for simplicity
      return sum + (diff * diff) / (error * error);
    }, 0);
  };

  const optimizeParameters = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);
    setOptimizationResult(null);

    const gridSize = 3; // Reduced grid size
    const paramNames = Object.keys(parameterRanges);
    
    const generateGrid = (ranges, size) => {
      return ranges.map(range => {
        const { min, max } = range;
        const step = (max - min) / (size - 1);
        return Array.from({ length: size }, (_, i) => min + i * step);
      });
    };

    const grid = generateGrid(Object.values(parameterRanges), gridSize);
    const totalCombinations = Math.pow(gridSize, paramNames.length);

    let bestParams = { ...modelParameters };
    let bestChiSquare = Infinity;
    let combinationsChecked = 0;

    const searchGrid = async (index = 0, currentParams = {}) => {
      if (index === paramNames.length) {
        const modelData = calculateModel(observedData, sspData, currentParams);
        const chiSquare = calculateChiSquare(observedData, modelData);
        
        if (chiSquare < bestChiSquare) {
          bestChiSquare = chiSquare;
          bestParams = { ...currentParams };
        }

        combinationsChecked++;
        setOptimizationProgress((combinationsChecked / totalCombinations) * 100);
        
        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
        return;
      }

      const param = paramNames[index];
      for (let value of grid[index]) {
        await searchGrid(index + 1, { ...currentParams, [param]: value });
      }
    };

    await searchGrid();

    setModelParameters(bestParams);
    setOptimizationResult({
      params: bestParams,
      chiSquare: bestChiSquare,
      iterations: combinationsChecked
    });
    setIsOptimizing(false);
  };

  const handleParameterChange = (paramName, value) => {
    setModelParameters(prev => ({ ...prev, [paramName]: parseFloat(value) }));
  };

  const handleWavelengthChange = (e, index) => {
    const newRange = [...wavelengthRange];
    newRange[index] = Number(e.target.value);
    setWavelengthRange(newRange);
  };

  const modelData = useMemo(() => calculateModel(observedData, sspData, modelParameters), [observedData, sspData, modelParameters]);

  const residuals = useMemo(() => {
    return observedData.map((point, index) => ({
      wavelength: point.wavelength,
      residual: point.observed - (modelData[index]?.model || 0)
    }));
  }, [observedData, modelData]);

  const formatAxis = (tickItem) => tickItem.toExponential(1);

  // .... Description at the bottom about the best fit plot. 
  const generateGalaxyDescription = (params) => {
    const { c1, c2, c3, c4, c5, tauV } = params;
    const totalWeight = c1 + c2 + c3 + c4;
    const youngStars = c1 / totalWeight;
    const intermediateStars = c2 / totalWeight;
    const oldStars = (c3 + c4) / totalWeight;
  
    let description = [];
  
    // Stellar population
    description.push(`This galaxy's spectrum suggests a mix of stellar populations:`);
    description.push(`- Young stars (< 100 Myr): ${(youngStars * 100).toFixed(1)}%`);
    description.push(`- Intermediate-age stars (100 Myr - 1 Gyr): ${(intermediateStars * 100).toFixed(1)}%`);
    description.push(`- Old stars (> 1 Gyr): ${(oldStars * 100).toFixed(1)}%`);
  
    // Dominant population
    if (youngStars > 0.5) {
      description.push("The galaxy appears to be dominated by young stars, suggesting recent or ongoing star formation.");
    } else if (oldStars > 0.5) {
      description.push("The galaxy appears to be dominated by older stellar populations, suggesting it may be a more evolved system.");
    } else {
      description.push("The galaxy shows a balanced mix of stellar populations, indicating a complex star formation history.");
    }
  
    // Dust content
    if (tauV < 0.5) {
      description.push("The low dust attenuation (τV) suggests this galaxy has relatively little dust.");
    } else if (tauV > 1.5) {
      description.push("The high dust attenuation (τV) indicates this galaxy is quite dusty, which may be obscuring some of its stellar light.");
    } else {
      description.push("The moderate dust attenuation (τV) suggests a typical dust content for this type of galaxy.");
    }
  
    // Overall luminosity
    description.push(`The overall scale factor (c5 = ${c5.toFixed(2)}) provides information about the galaxy's total luminosity relative to the model.`);
  
    // Confidence statement
    description.push("Note: This interpretation is based on a simplified model and should be considered alongside other observational data for a comprehensive understanding of the galaxy.");
  
    return description;
  };

  const GalaxyDescription = ({ params }) => {
    const description = generateGalaxyDescription(params);
  
    return (
      <div className="galaxy-description">
        <h3>Galaxy Characteristics</h3>
        {description.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="galaxy-fitting">
      <h2>Galaxy Spectrum Fitting</h2>
      <div className="controls-container">
        <div className="file-upload">
          <label htmlFor="spectrum-upload">Upload Galaxy Spectrum:</label>
          <input
            type="file"
            id="spectrum-upload"
            accept=".txt"
            onChange={handleFileUpload}
          />
          {fileUploadError && <p className="error-message">{fileUploadError}</p>}
        </div>
        {Object.entries(modelParameters).map(([param, value]) => (
          <div key={param} className="parameter-slider">
            <label htmlFor={`param-${param}`}>{param}:</label>
            <input
              id={`param-${param}`}
              type="range"
              min={parameterRanges[param].min}
              max={parameterRanges[param].max}
              step={(parameterRanges[param].max - parameterRanges[param].min) / 100}
              value={value}
              onChange={(e) => handleParameterChange(param, e.target.value)}
            />
            <span>{value.toFixed(2)}</span>
          </div>
        ))}
        <div className="wavelength-range">
          <label>
            Min:
            <input
              type="number"
              value={wavelengthRange[0]}
              onChange={(e) => handleWavelengthChange(e, 0)}
              min={3600}
              max={10000}
            />
          </label>
          <label>
            Max:
            <input
              type="number"
              value={wavelengthRange[1]}
              onChange={(e) => handleWavelengthChange(e, 1)}
              min={3600}
              max={10000}
            />
          </label>
        </div>
        <button onClick={optimizeParameters} disabled={isOptimizing}>
          {isOptimizing ? 'Optimizing...' : 'Optimize Parameters'}
        </button>
        {isOptimizing && (
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={optimizationProgress} />
            <Typography variant="body2" color="text.secondary">{`${Math.round(optimizationProgress)}%`}</Typography>
          </Box>
        )}
        {optimizationResult && (
          <div className="optimization-result">
            <p>Optimization complete after {optimizationResult.iterations} iterations.</p>
            <p>Final Chi-Square: {optimizationResult.chiSquare.toExponential(4)}</p>
          </div>
        )}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={modelData} 
          margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
          >
            <XAxis
              dataKey="wavelength"
              type="number"
              scale="log"
              domain={wavelengthRange}
              tickFormatter={formatAxis}
              label={{ value: 'Wavelength (Å)', position: 'bottom' }}
            />
            <YAxis
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={formatAxis}
              label={{ value: 'Luminosity (L☉/Å)', angle: -90, position: 'insideLeft', offset: -10, dy: 50, textAnchor: 'middle' }}
            />
            <Tooltip
              formatter={(value, name) => [value.toExponential(4), name]}
              labelFormatter={(label) => `Wavelength: ${label.toFixed(0)} Å`}
            />
            <Line type="monotone" dataKey="observed" stroke="#8884d8" name="Observed" dot={false} />
            <Line type="monotone" dataKey="model" stroke="#82ca9d" name="Model" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="residuals-container">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={residuals} 
          margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
          >
            <XAxis
              dataKey="wavelength"
              type="number"
              scale="log"
              domain={wavelengthRange}
              tickFormatter={formatAxis}
              label={{ value: 'Wavelength (Å)', position: 'bottom' }}
            />
            <YAxis
              label={{ value: 'Residual', angle: -90, position: 'insideLeft', offset: 0, dy: 30, textAnchor: 'middle' }}
            />
            <Tooltip />
            <Line type="monotone" dataKey="residual" stroke="#ff7300" name="Residual" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      {optimizationResult && (
        <GalaxyDescription params={optimizationResult.params} />
      )}
    </div>
  );
};

export default GalaxyFitting;