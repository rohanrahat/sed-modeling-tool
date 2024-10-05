// import { useMemo } from 'react';

// const useSpectrumPlot = (sspModels, sspWeights, dustAttenuation) => {
//   const plotData = useMemo(() => {
//     if (!sspModels.length) return [];

//     // Combine SSP models based on weights
//     const combinedSpectrum = sspModels[0].data.map((_, i) => {
//       return sspModels.reduce((sum, model, index) => {
//         return sum + model.data[i][1] * sspWeights[index];
//       }, 0);
//     });

//     // Apply dust attenuation
//     const attenuatedSpectrum = combinedSpectrum.map((value, i) => {
//       const wavelength = sspModels[0].data[i][0];
//       const attenuation = Math.exp(-dustAttenuation * Math.pow(wavelength / 5000, -0.7));
//       return value * attenuation;
//     });

//     return [
//       {
//         x: sspModels[0].data.map(d => d[0]),
//         y: attenuatedSpectrum,
//         type: 'scatter',
//         mode: 'lines',
//         name: 'Combined Spectrum',
//       },
//       ...sspModels.map((model, index) => ({
//         x: model.data.map(d => d[0]),
//         y: model.data.map(d => d[1] * sspWeights[index]),
//         type: 'scatter',
//         mode: 'lines',
//         name: `${model.age} Myr SSP`,
//         visible: 'legendonly',
//       })),
//     ];
//   }, [sspModels, sspWeights, dustAttenuation]);

//   const layout = {
//     title: 'Spectral Energy Distribution',
//     xaxis: { title: 'Wavelength (Å)', type: 'log' },
//     yaxis: { title: 'Luminosity (L☉ Å⁻¹)', type: 'log' },
//     showlegend: true,
//   };

//   return { plotData, layout };
// };

// export default useSpectrumPlot;
import { useMemo } from 'react';

const useSpectrumPlot = (sspModels, sspWeights, dustAttenuation) => {
  const plotData = useMemo(() => {
    console.log("useSpectrumPlot - SSP Models:", sspModels);
    console.log("useSpectrumPlot - SSP Weights:", sspWeights);
    console.log("useSpectrumPlot - Dust Attenuation:", dustAttenuation);

    if (!sspModels.length || sspWeights.length !== sspModels.length) {
      console.log("Returning empty plot data due to mismatched lengths");
      return [];
    }

    // Combine SSP models based on weights
    const combinedSpectrum = sspModels[0].data.map((_, i) => {
      return sspModels.reduce((sum, model, index) => {
        return sum + model.data[i][1] * sspWeights[index];
      }, 0);
    });

    console.log("Combined Spectrum:", combinedSpectrum);

    // Apply dust attenuation
    const attenuatedSpectrum = combinedSpectrum.map((value, i) => {
      const wavelength = sspModels[0].data[i][0];
      const attenuation = Math.exp(-dustAttenuation * Math.pow(wavelength / 5000, -0.7));
      return value * attenuation;
    });

    console.log("Attenuated Spectrum:", attenuatedSpectrum);

    const plotData = [
      {
        x: sspModels[0].data.map(d => d[0]),
        y: attenuatedSpectrum,
        type: 'scatter',
        mode: 'lines',
        name: 'Combined Spectrum',
      },
      ...sspModels.map((model, index) => ({
        x: model.data.map(d => d[0]),
        y: model.data.map(d => d[1] * sspWeights[index]),
        type: 'scatter',
        mode: 'lines',
        name: `${model.age} Myr SSP`,
        visible: 'legendonly',
      })),
    ];

    console.log("Plot Data:", plotData);

    return plotData;
  }, [sspModels, sspWeights, dustAttenuation]);

  const layout = {
    title: 'Spectral Energy Distribution',
    xaxis: { title: 'Wavelength (Å)', type: 'log' },
    yaxis: { title: 'Luminosity (L☉ Å⁻¹)', type: 'log' },
    showlegend: true,
  };

  return { plotData, layout };
};

export default useSpectrumPlot;