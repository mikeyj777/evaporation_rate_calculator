// Constants
const DIFFUSIVITY_WATER = 2.4e-5; // m2/s
const MW_WATER = 18.015; // g/mol
const KINEMATIC_VISCOSITY_AIR = 1.5e-5; // m2/s
const R = 8314; // J/kmol/K
const T = 298; // K
const PI = Math.PI;

export const calculateVaporPressure = (A, B, C, temperatureC = 25) => {
  // Antoine equation: log10(P) = A - (B / (C + T))
  // Returns vapor pressure in Pascals (converted from mmHg)
  if (!A || !B || !C) return null;
  const mmHg = Math.pow(10, A - (B / (C + temperatureC)));
  return mmHg * 133.322; // Convert mmHg to Pascal
};

export const calculateDiffusivity = (molecularWeight) => {
  // Diffusivity relative to water
  return DIFFUSIVITY_WATER * Math.sqrt(MW_WATER / molecularWeight);
};

export const calculateSchmidtNumber = (diffusivity) => {
  return KINEMATIC_VISCOSITY_AIR / diffusivity;
};

export const calculateEffectiveDiameter = (length, width) => {
  // Convert feet to meters
  const lengthM = length * 0.3048;
  const widthM = width * 0.3048;
  const area = lengthM * widthM;
  return Math.sqrt((4 * area) / PI);
};

export const calculateSurfaceArea = (length, width) => {
  // Convert feet to meters and calculate area in m²
  return (length * 0.3048) * (width * 0.3048);
};

export const calculateMassTransferCoefficient = (velocity, effectiveDiameter, schmidtNumber) => {
  velocity /= 3.28084;
  return 0.0048 * Math.pow(velocity, 7/9) * Math.pow(effectiveDiameter, -1/9) * Math.pow(schmidtNumber, -2/3);
};

export const calculateMixtureMolecularWeight = (components) => {
  // Calculate weighted average molecular weight based on mole fractions
  const totalMoles = components.reduce((sum, comp) => {
    if (comp.isMolar) {
      return sum + comp.amount;
    } else {
      // Convert mass percent to moles using molecular weight
      return sum + (comp.amount / comp.molecularWeight);
    }
  }, 0);

  return components.reduce((weightedSum, comp) => {
    let moleFraction;
    if (comp.isMolar) {
      moleFraction = comp.amount / totalMoles;
    } else {
      moleFraction = (comp.amount / comp.molecularWeight) / totalMoles;
    }
    return weightedSum + (moleFraction * comp.molecularWeight);
  }, 0);
};

export const calculateEvaporationRate = (components, hoodVelocity, hoodLength, hoodWidth) => {
  // Calculate surface area
  const area = calculateSurfaceArea(hoodLength, hoodWidth);
  
  // Calculate effective diameter
  const effectiveDiameter = calculateEffectiveDiameter(hoodLength, hoodWidth);
  
  // For mixtures, we need to:
  // 1. Calculate mixture molecular weight
  const mixtureMW = calculateMixtureMolecularWeight(components);
  
  // 2. Calculate mixture vapor pressure (Raoult's law)
  const mixtureVaporPressure = components.reduce((totalPressure, comp) => {
    const pureCompVaporPressure = calculateVaporPressure(
      comp.vaporPressureConstants.A,
      comp.vaporPressureConstants.B,
      comp.vaporPressureConstants.C
    );
    
    let moleFraction;
    if (comp.isMolar) {
      moleFraction = comp.amount / 100;
    } else {
      // Convert mass fraction to mole fraction
      const moles = comp.amount / comp.molecularWeight;
      moleFraction = moles / calculateMixtureMolecularWeight([comp]);
    }
    
    return totalPressure + (moleFraction * pureCompVaporPressure);
  }, 0);
  
  // Calculate diffusivity and Schmidt number
  const diffusivity = calculateDiffusivity(mixtureMW);
  const schmidtNumber = calculateSchmidtNumber(diffusivity);
  
  // Calculate mass transfer coefficient
  const km = calculateMassTransferCoefficient(hoodVelocity, effectiveDiameter, schmidtNumber);
  
  // Calculate final evaporation rate in kg/s
  const evaporationRate = area * km * (mixtureMW * mixtureVaporPressure / (R * T));
  
  return evaporationRate;
};

  // Utility function to parse CSV data properly handling quoted fields
const parseCsvData = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

      if (char === '"') {
          if (insideQuotes && text[i + 1] === '"') {
              // Handle escaped quotes ("") within quoted fields
              currentField += '"';
              i++;
          } else {
              // Toggle quote state
              insideQuotes = !insideQuotes;
          }
      } else if (char === ',' && !insideQuotes) {
          // End of field
          currentRow.push(currentField.trim());
          currentField = '';
      } else if (char === '\n' && !insideQuotes) {
          // End of row
          currentRow.push(currentField.trim());
          if (currentRow.some(field => field)) {
              // Skip empty rows
              rows.push([...currentRow]);
          }
          currentRow = [];
          currentField = '';
      } else {
          currentField += char;
      }
  }

  // Handle last row if file doesn't end with newline
  if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field)) {
          rows.push(currentRow);
      }
  }

  const header = rows[0];
  const data = rows.slice(1, rows.length);


  return {header, data};
};

// Utility function to read CSV data
export const loadChemicalData = async () => {
  try {
      const response = await fetch('/data/cheminfo.csv');
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
          name: values[0],
          casNumber: values[1],
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