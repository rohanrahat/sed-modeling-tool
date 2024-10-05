// import { useState, useEffect } from 'react';

// const useSSPModels = () => {
//   const [sspModels, setSSPModels] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const loadSSPModels = async () => {
//       try {
//         // TODO: Replace this with actual data loading
//         const dummyData = [
//           { age: 1, data: [/* wavelength and luminosity data */] },
//           { age: 10, data: [/* wavelength and luminosity data */] },
//           { age: 100, data: [/* wavelength and luminosity data */] },
//           { age: 1000, data: [/* wavelength and luminosity data */] },
//           { age: 5000, data: [/* wavelength and luminosity data */] },
//           { age: 10000, data: [/* wavelength and luminosity data */] },
//         ];

//         setSSPModels(dummyData);
//         setIsLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setIsLoading(false);
//       }
//     };

//     loadSSPModels();
//   }, []);

//   return { sspModels, isLoading, error };
// };

// export default useSSPModels;

import { useState, useEffect } from 'react';

const useSSPModels = () => {
  const [sspModels, setSSPModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseSSPData = (data) => {
    const lines = data.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');
    
    const parsedData = lines.map(line => {
      const [wave, lum1, lum10, lum100, lum1000, lum5000, lum10000] = line.split(/\s+/).map(Number);
      return { wave, lum1, lum10, lum100, lum1000, lum5000, lum10000 };
    });

    const ageLabels = ['1', '10', '100', '1000', '5000', '10000'];
    const result = ageLabels.map((age, index) => ({
      age: parseInt(age),
      data: parsedData.map(d => [d.wave, d[`lum${age}`]])
    }));
    
    console.log("Parsed SSP data:", result);
    return result;
  };

  const loadDefaultModels = async () => {
    try {
      const response = await fetch('/bc03_models.txt');
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.text();
        console.log('Parsed data:', parseSSPData(data));
        setSSPModels(parseSSPData(data));
      } else {
        throw new Error('Failed to load default models');
      }
      setIsLoading(false);
    } catch (err) {
      setError("Error loading default models: " + err.message);
      setIsLoading(false);
    }
  };

  const loadUserModels = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        setSSPModels(parseSSPData(data));
        setError(null);
      } catch (err) {
        setError("Error parsing uploaded file: " + err.message);
      }
      setIsLoading(false);
    };
    reader.onerror = (e) => {
      setError("Error reading uploaded file: " + e.target.error);
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    loadDefaultModels();
  }, []);

  useEffect(() => {
    console.log('Updated sspModels:', sspModels);
  }, [sspModels]);
  
  return { sspModels, isLoading, error, loadUserModels };
};

export default useSSPModels;