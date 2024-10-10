import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import './SSPVisualization.css';

const filterWavelengths = [
  { name: 'u', wavelength: 3551, color: 'rgba(255, 0, 0, 0.1)' },
  { name: 'g', wavelength: 4686, color: 'rgba(0, 255, 0, 0.1)' },
  { name: 'r', wavelength: 6166, color: 'rgba(0, 0, 255, 0.1)' },
  { name: 'i', wavelength: 7480, color: 'rgba(255, 255, 0, 0.1)' },
  { name: 'z', wavelength: 8932, color: 'rgba(255, 0, 255, 0.1)' },
];


const SSPColors = {
  LUM1: '#e41a1c',
  LUM10: '#377eb8',
  LUM100: '#4daf4a',
  LUM1000: '#984ea3',
  LUM5000: '#ff7f00',
  LUM10000: '#a65628',
};

const SSPVisualization = () => {
  const [tauV, setTauV] = useState(1.0);
  const [data, setData] = useState([]);
  const [visibleSSPs, setVisibleSSPs] = useState(Object.keys(SSPColors));
  const [wavelengthRange, setWavelengthRange] = useState([3400, 10000]);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/bc03_models.txt');
      const text = await response.text();
      const parsedData = parseData(text);
      setData(parsedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const parseData = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].trim().split(/\s+/);
    return lines.slice(1).map(line => {
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
  };

  const applyDustAttenuation = (wavelength, luminosity) => {
    const tau = tauV * Math.pow(wavelength / 5000, -0.7);
    return luminosity * Math.exp(-tau);
  };

  const filteredData = data.filter(
    d => d.WAVE >= wavelengthRange[0] && d.WAVE <= wavelengthRange[1]
  ).map(d => ({
    ...d,
    LUM1: applyDustAttenuation(d.WAVE, d.LUM1),
    LUM10: applyDustAttenuation(d.WAVE, d.LUM10),
    LUM100: applyDustAttenuation(d.WAVE, d.LUM100),
    LUM1000: applyDustAttenuation(d.WAVE, d.LUM1000),
    LUM5000: applyDustAttenuation(d.WAVE, d.LUM5000),
    LUM10000: applyDustAttenuation(d.WAVE, d.LUM10000),
  }));

  const toggleSSP = (ssp) => {
    setVisibleSSPs(prev => 
      prev.includes(ssp) ? prev.filter(s => s !== ssp) : [...prev, ssp]
    );
  };

  const handleWavelengthChange = (e, index) => {
    const newRange = [...wavelengthRange];
    newRange[index] = Number(e.target.value);
    setWavelengthRange(newRange);
  };

  const handleTauVChange = (e) => {
    setTauV(Number(e.target.value));
  };

  const formatXAxis = (tickItem) => {
    return tickItem.toExponential(1);
  };

  return (
    <div className="ssp-visualization">
      <h2 className="chart-title">Spectral Energy Distribution (SED) Visualization</h2>
      <div className="controls-container">
        <div className="ssp-toggles">
          <h4>Toggle SSP Visibility</h4>
          {Object.entries(SSPColors).map(([ssp, color]) => (
            <label key={ssp} style={{color}}>
              <input
                type="checkbox"
                checked={visibleSSPs.includes(ssp)}
                onChange={() => toggleSSP(ssp)}
              />
              {ssp.replace('LUM', '')} Myr
            </label>
          ))}
        </div>
        <div className="dust-attenuation">
          <h4>Dust Attenuation</h4>
          <label>
            <input
              type="number"
              value={tauV}
              onChange={handleTauVChange}
              min={0}
              max={5}
              step={0.1}
            />
          </label>
        </div>
        <div className="filter-toggle">
        <h4>Togge u,g,r,i,z filters</h4>
          <label>
            <input
              type="checkbox"
              checked={showFilters}
              onChange={() => setShowFilters(!showFilters)}
            />
          </label>
        </div>
        <div className="wavelength-range">
          <h4>Wavelength Range</h4>
          <label>
            Min:
            <input
              type="number"
              value={wavelengthRange[0]}
              onChange={(e) => handleWavelengthChange(e, 0)}
              min={3400}
              max={10000}
            />
          </label>
          <label>
            Max:
            <input
              type="number"
              value={wavelengthRange[1]}
              onChange={(e) => handleWavelengthChange(e, 1)}
              min={3400}
              max={10000}
            />
          </label>
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={filteredData}
            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
          >
            <XAxis
              dataKey="WAVE"
              type="number"
              scale="log"
              domain={wavelengthRange}
              tickFormatter={formatXAxis}
              label={{ value: 'Wavelength (Angstroms)', position: 'bottom', offset: 40 }}
            />
            <YAxis
              type="number"
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={(value) => value.toExponential(1)}
              label={{ value: 'Luminosity (L☉/Å)', angle: -90, position: 'insideLeft', offset: -10, dy: 50, textAnchor: 'middle' }}
            />
            <Tooltip
              formatter={(value, name) => [value.toExponential(4), `${name.replace('LUM', '')} Myr`]}
              labelFormatter={(label) => `Wavelength: ${label.toFixed(0)} Å`}
            />
            {visibleSSPs.map((ssp) => (
              <Line
                key={ssp}
                type="monotone"
                dataKey={ssp}
                stroke={SSPColors[ssp]}
                dot={false}
                name={`${ssp.replace('LUM', '')} Myr`}
              />
            ))}
            {showFilters && filterWavelengths.map((filter, index, arr) => (
              <ReferenceArea
                key={filter.name}
                x1={index === 0 ? wavelengthRange[0] : arr[index - 1].wavelength}
                x2={filter.wavelength}
                fill={filter.color}
                fillOpacity={0.3}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default SSPVisualization;