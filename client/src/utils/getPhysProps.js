import * as consts from './consts'
import { parseCSV } from './csv_io'
import { eqn_100, eqn_101, eqn_105, eqn_106, eqn_107, eqn_114, eqn_124, eqn_127 }  from './dipprCalcs'; 

// Map equation IDs to functions
const eqnFunctions = {
    100: eqn_100,
    101: eqn_101,
    105: eqn_105,
    106: eqn_106,
    107: eqn_107,
    114: eqn_114,
    124: eqn_124,
    127: eqn_127
};

export async function loadTcData() {
    try {
        const data = await parseCSV(consts.DIPPR_CONSTANTS_CSV_NAME);
        return data.filter(row => row.property_id === "TC");
    } catch (error) {
        console.error('Error getting TC data:', error);
        return [];
    }
}

export function getTcValue(cas_no, tcData) {
    // Find the row with the specified cas_no and property_id
    console.log("cas no: ", cas_no);

    const row = tcData.find(row => row.cas_no === cas_no);

    console.log("row const value: ", row.const_value);
    console.log("row cas_no: ", row.cas_no);
    console.log("row prop id: ", row.property_id);

    if (!row) {
        throw new Error('No matching data found.');
    }

    return row.const_value;
}

export async function loadDipprCoeffs() {
    let data = []
    try {
        data = await parseCSV(consts.DIPPR_COEFFICIENTS_CSV_NAME);
    } catch (error) {
        console.error('Error getting TC data:', error);
    }
    return data
}

export function filterAndCalculate(cas_no, property_id, temperature, tcData, integrated=false) {
    // returns the calculated dippr equation.
    // integrated forms are used for equations such as heat capacity where the 
    // total value is based on integrating the base calculation over a temperature range.
    
    const data = parseCSV(consts.DIPPR_COEFFICIENTS_CSV_NAME);
    const tc = getTcValue(cas_no, tcData);

    // Filter by cas_no and property_id
    const filteredData = data.filter(row => row.cas_no === cas_no && row.property_id === property_id);

    // Find the row where temperature is within min_t and max_t
    let selectedRow = filteredData.find(row => temperature >= row.min_t && temperature <= row.max_t);

    // If no row is found, find the closest temperature range
    if (!selectedRow) {
        let closestRow = null;
        let smallestDiff = Infinity;
        filteredData.forEach(row => {
            const diff = Math.min(Math.abs(temperature - row.min_t), Math.abs(temperature - row.max_t));
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestRow = row;
            }
        });
        selectedRow = closestRow;
    }

    if (!selectedRow) {
        throw new Error('No matching data found.');
    }

    // Extract coefficients and equation ID
    const { coeff_a, coeff_b, coeff_c, coeff_d, coeff_e, coeff_f, coeff_g, eqn_id, min_t, max_t } = selectedRow;
    const consts = [coeff_a, coeff_b, coeff_c, coeff_d, coeff_e, coeff_f, coeff_g];

    // Get the appropriate DIPPR equation function
    const dipprFunction = eqnFunctions[eqn_id];
    if (!dipprFunction) {
        throw new Error('Unknown equation ID.');
    }

    // Call the function
    return dipprFunction(consts, temperature, tc, integrated);
}