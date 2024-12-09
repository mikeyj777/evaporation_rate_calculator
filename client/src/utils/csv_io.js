import * as consts from './consts';

export const loadChemicalData = async () => {
    try {
        const response = await fetch(consts.CHEMINFO_CSV_NAME);
        const text = await response.text();
  
        // Parse CSV properly handling commas in fields
        const rows = text.split('\n').map(row => {
            const cells = [];
            let currentCell = '';
            let inQuotes = false;
  
            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    cells.push(currentCell.trim().replace(/^"|"$/g, ''));
                    currentCell = '';
                } else {
                    currentCell += char;
                }
            }
  
            // Push the last cell
            cells.push(currentCell.trim().replace(/^"|"$/g, ''));
            return cells;
        });
  
        const headers = rows[0];
        return rows.slice(1).map(values => ({
          casNumber: values[0],  
          name: values[1],
            molecularWeight: parseFloat(values[4]),
            vaporPressureConstants: {
                A: parseFloat(values[5]),
                B: parseFloat(values[6]),
                C: parseFloat(values[7]),
                D: parseFloat(values[8]),
                E: parseFloat(values[9]),
            },
        })).filter(chem => chem.name); // Filter out any empty rows
    } catch (error) {
        console.error('Error loading chemical data:', error);
        return [];
    }
  };

  export const parseCSV = async (url) => {
    try {
        const response = await fetch(url);
        const text = await response.text();

        const lines = text.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = isNaN(values[index]) ? values[index] : parseFloat(values[index]);
                return obj;
            }, {});
        });
    } catch (error) {
        console.error('Error loading CSV data:', error);
        return [];
    }
};