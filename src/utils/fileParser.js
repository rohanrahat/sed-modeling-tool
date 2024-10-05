// src/utils/fileParser.js

export const parseDataFile = (fileContent) => {
  const lines = fileContent.split('\n');
  const headers = lines[0].trim().split(/\s+/).slice(1); // Remove '#' and split

  const data = lines.slice(1).map(line => {
    const values = line.trim().split(/\s+/);
    const obj = { WAVE: parseFloat(values[0]) };
    headers.forEach((header, index) => {
      obj[header] = parseFloat(values[index + 1]);
    });
    return obj;
  });

  return { headers, data };
};
