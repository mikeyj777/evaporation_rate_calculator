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

// Utility function to read CSV data
export const loadChemicalData = async () => {
  try {
    const response = await fetch('/data/cheminfo.csv');
    const text = await response.text();
    
    // Parse CSV
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        name: values[0],
        casNumber: values[1],
        molecularWeight: parseFloat(values[5]),
        vaporPressureConstants: {
          A: parseFloat(values[6]),
          B: parseFloat(values[7]),
          C: parseFloat(values[8])
        }
      };
    });
  } catch (error) {
    console.error('Error loading chemical data:', error);
    return [];
  }
};