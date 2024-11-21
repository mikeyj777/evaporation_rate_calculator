// Constants
const DIFFUSIVITY_WATER = 2.4e-5; // m2/s
const MW_WATER = 18.015; // g/mol
const KINEMATIC_VISCOSITY_AIR = 1.5e-5; // m2/s
const R = 8314; // J/kmol/K
const TEMP_K = 298.15; // K
const PI = Math.PI;

export const convertToMolarBasis = (mixture) => {
  let totMol = 0;
  for (let i=0; i < mixture.length; i++) {
    mixture[i].amount /= mixture[i].molecularWeight;
    totMol += mixture[i].amount;
  }
  for (let i=0; i < mixture.length; i++) {
    mixture[i].amount /= totMol;
  }

  return mixture;
}

export const getAverageMolecularWeight = (mixture) => {
  let aveMw = 0;
  mixture.forEach((element) => aveMw += (element.amount * element.molecularWeight));

  return aveMw;

}


export const calculateVaporPressure = (A, B, C, D, E, tempK = TEMP_K) => {
  // Antoine equation: log10(P) = A - (B / (C + T))
  // Returns vapor pressure in Pascals (converted from mmHg)
  if (!A || !B || !C || !D || !E) return null;
  const pressPa = Math.exp(A + B / tempK + C * Math.log(tempK)+ D * Math.pow(tempK, E));
  return pressPa;
};

export const calculateDiffusivity = (molecularWeight) => {
  // Diffusivity relative to water
  return DIFFUSIVITY_WATER * Math.sqrt(MW_WATER / molecularWeight);
};

export const calculateSchmidtNumber = (diffusivity) => {
  return KINEMATIC_VISCOSITY_AIR / diffusivity;
};

export const calculateEffectiveDiameter = (area) => {
  // Convert feet to meters
  return Math.sqrt((4 * area) / PI);
};

export const calculateSurfaceArea = (length, width) => {
  // Convert feet to meters and calculate area in m²
  return (length / 3.28084) * (width / 3.28084);
};

export const calculateMassTransferCoefficient = (velocity, effectiveDiameter, schmidtNumber) => {
  velocity /= 3.28084;
  return 0.0048 * Math.pow(velocity, 7/9) * Math.pow(effectiveDiameter, -1/9) * Math.pow(schmidtNumber, -2/3);
};

export const calculateEvaporationRate = (components, hoodVelocity, hoodLength, hoodWidth) => {
  // Calculate surface area
  const area = calculateSurfaceArea(hoodLength, hoodWidth);
  
  // Calculate effective diameter
  const effectiveDiameter = calculateEffectiveDiameter(area);
  
  // For mixtures, we need to:
  // 1. Calculate mixture molecular weight
  const mixtureMW = getAverageMolecularWeight(components);
  console.log("ave mw: ", mixtureMW);
  
  // 2. Calculate mixture vapor pressure (Raoult's law)
  const mixtureVaporPressure = components.reduce((totalPressure, comp) => {
    const pureCompVaporPressure = calculateVaporPressure(
      comp.vaporPressureConstants.A,
      comp.vaporPressureConstants.B,
      comp.vaporPressureConstants.C,
      comp.vaporPressureConstants.D,
      comp.vaporPressureConstants.E,
      TEMP_K
    );
    
    return totalPressure + (comp.amount * pureCompVaporPressure);
  }, 0);

  console.log("mixture vp: ", mixtureVaporPressure);
  
  // Calculate diffusivity and Schmidt number
  const diffusivity = calculateDiffusivity(mixtureMW);
  const schmidtNumber = calculateSchmidtNumber(diffusivity);
  
  // Calculate mass transfer coefficient
  const Km = calculateMassTransferCoefficient(hoodVelocity, effectiveDiameter, schmidtNumber);
  
  // Calculate final evaporation rate in kg/s
  const evaporationRate = area * Km * (mixtureMW * mixtureVaporPressure / R / TEMP_K);
  
  return evaporationRate;
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