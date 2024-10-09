import React, { useState, useEffect, useMemo } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart } from 'recharts';
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

  useEffect(() => {
    fetchObservedData();
    fetchSSPData();
  }, []);

  const fetchObservedData = async () => {
    try {
      const response = await fetch('/manga_7443-6102.txt');
      const text = await response.text();
      const parsedData = parseObservedData(text);
      setObservedData(parsedData);
      console.log('Observed data loaded:', parsedData.length, 'points');
    } catch (error) {
      console.error('Error fetching observed data:', error);
    }
  };

  const parseObservedData = (text) => {
    const lines = text.trim().split('\n');
    return lines.slice(1).map(line => {
      const [wave, luminosity] = line.trim().split(/\s+/).map(Number);
      return { wavelength: wave, observed: luminosity };
    });
  };

  const fetchSSPData = async () => {
    try {
      const response = await fetch('/bc03_models.txt');
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
    if (i === 0) {
      console.log('Interpolation: wavelength below range', wavelength, wavelengths[0]);
      return luminosities[0];
    }
    if (i === -1) {
      console.log('Interpolation: wavelength above range', wavelength, wavelengths[wavelengths.length - 1]);
      return luminosities[luminosities.length - 1];
    }
    const x0 = wavelengths[i - 1];
    const x1 = wavelengths[i];
    const y0 = luminosities[i - 1];
    const y1 = luminosities[i];
    const interpolated = y0 + (y1 - y0) * (wavelength - x0) / (x1 - x0);
    if (isNaN(interpolated)) {
      console.error('NaN interpolation result', x0, x1, y0, y1, wavelength);
    }
    return interpolated;
  };

  const calculateModel = (data, sspData, parameters) => {
    console.log('calculateModel called with:', 
        'data length:', data.length, 
        'sspData:', sspData ? 'present' : 'null', 
        'parameters:', parameters);
    if (!sspData) return [];
    console.log('Calculating model with parameters:', parameters);
    const { c1, c2, c3, c4, c5, tauV } = parameters;
    
    const result = data.map(point => {
      const wavelength = point.wavelength;
      
      try {
        const L1 = interpolateSSP(sspData.wavelengths, sspData.L1, wavelength);
        const L100 = interpolateSSP(sspData.wavelengths, sspData.L100, wavelength);
        const L1000 = interpolateSSP(sspData.wavelengths, sspData.L1000, wavelength);
        const L10Gyr = interpolateSSP(sspData.wavelengths, sspData.L10Gyr, wavelength);
        
        const combinedSSP = c1*L1 + c2*L100 + c3*L1000 + c4*L10Gyr;
        const dustFactor = Math.exp(-tauV * Math.pow(wavelength / 5000, -0.7));
        const modelValue = combinedSSP * c5 * dustFactor;

        if (isNaN(modelValue)) {
            console.error('NaN modelValue calculated for wavelength:', wavelength, 
                          'L1:', L1, 'L100:', L100, 'L1000:', L1000, 'L10Gyr:', L10Gyr,
                          'combinedSSP:', combinedSSP, 'dustFactor:', dustFactor);
        }
      
        return {
            ...point,
            model: modelValue
        };
      } catch (error) {
        console.error('Error calculating model for wavelength:', wavelength, 'Error:', error);
        return { ...point, model: NaN };
      }
    });
    
    console.log('Model data sample:', result.slice(0, 5)); // Log first 5 points
    return result;
  };
  
  const modelData = useMemo(() => calculateModel(observedData, sspData, modelParameters), [observedData, sspData, modelParameters]);

  useEffect(() => {
    console.log('Model data updated, length:', modelData.length);
    console.log('Sample model data:', modelData.slice(0, 5));
  }, [modelData]);

  const handleParameterChange = (paramName, value) => {
    setModelParameters(prev => ({ ...prev, [paramName]: parseFloat(value) }));
  };

  const calculateResiduals = (observed, model) => {
    return observed.map((point, index) => ({
      wavelength: point.wavelength,
      residual: point.observed - model[index].model
    }));
  };

  const residuals = useMemo(() => calculateResiduals(observedData, modelData), [observedData, modelData]);

  const formatAxis = (tickItem) => {
    return tickItem.toExponential(1);
  };

  const handleWavelengthChange = (e, index) => {
    const newRange = [...wavelengthRange];
    newRange[index] = Number(e.target.value);
    setWavelengthRange(newRange);
  };

  return (
    <div className="galaxy-fitting">
      <h2>Galaxy Spectrum Fitting</h2>
      <div className="controls-container">
        {Object.entries(modelParameters).map(([param, value]) => (
          <label key={param}>
            {param}:
            <input
              type="range"
              min="0"
              max={
                param === 'c1' ? "10" :
                param === 'c2' ? "100" :
                param === 'c3' ? "1000" :
                param === 'c4' ? "150" :
                param === 'c5' ? "150" :
                param === 'tauV' ? "2" : "1"
              }
              step={
                param === 'c1' ? "1" :
                param === 'c2' ? "10" :
                param === 'c3' ? "50" :
                param === 'c4' || param === 'c5' ? "15" :
                "0.01"
              }
              value={value}
              onChange={(e) => handleParameterChange(param, e.target.value)}
            />
            {param === 'c1' || param === 'c5' || param === 'tauV' 
                ? value.toFixed(2) 
                : value.toFixed(0)}
          </label>
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
    </div>
  );
};

export default GalaxyFitting;