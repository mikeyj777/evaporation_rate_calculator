import * as consts from './consts';
import { getAverageMolecularWeight, getMixtureVaporPressurePa, getAverageLiquidDensityKgM3 } from './evaporationUtils';

//         st = Double.parseDouble(chemForAnalysis[8]);
// //Surface Tension (dyne/cm)

//         rho = Double.parseDouble(chemForAnalysis[9]) *
// 62.428; 
// //density (lb/ft3)

//         rho_KgM3 = rho * 16.0185; 
// // kg/m3

//         mu = Double.parseDouble(chemForAnalysis[10]);
// //Viscosity (cP)


const dynamicPoolEvap = (components, temp_k, physProps, spillVolML, hoodVelocityFtMin, hoodLengthFt, hoodDepthFt, mwManual, vpManual, liquidDensityManualLbGal) => {

    const nulls = []

    // assumes a spill and initial spread duration of 10 sec;
    const durationSec = 10;

    console.log("components in dyn evap: ", components);
    
    const gasRatePerSec = [];
    const totalGasEvapGforOutput = {
        10: null,
        60: null,
        3600: null,
        timeToCompletelyEvaporateSec: null
    };

    let mw = mwManual;
    let vpPa = vpManual;
    let liqDensLbGal = liquidDensityManualLbGal;
    
    let liqDensKmolM3 = 0;
    //filterAndCalculate(cas_no, property_id, temperature, integrated=false)
    if (!vpPa) vpPa = getMixtureVaporPressurePa(components, temp_k);
    if (!mw) mw = getAverageMolecularWeight(components);
    if (!liqDensLbGal) {
        try {
            // getAverageLiquidDensityKgM3 = (components, physProps, tempK = TEMP_K)
            // return {badChems, densKgM3};
            const dens_data = getAverageLiquidDensityKgM3(components, physProps, temp_k);
            const liqDensKgM3 = dens_data.densKgM3;
            const badChems = dens_data.badChems;
            if (badChems.length > 0) nulls.push("LDN");
            liqDensLbGal = liqDensKgM3 * consts.LB_PER_KG / consts.GAL_PER_M3;
            
        } catch (error) {
            // error logging already in the phys props methods.
            console.error("error: ", error);
        }
    }

    if (!mw) {
        nulls.push("MW");
        mw = physProps.getPropertyValue(consts.CAS_NO_WATER, "VP");
    }
    if (!vpPa) {
        nulls.push("VP");
        vpPa = physProps.filterAndCalculate(consts.CAS_NO_WATER, "VP", temp_k);
    }
    if (!liqDensLbGal) {
        if (!nulls.includes("LDN")) nulls.push("LDN");
        liqDensKmolM3 = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LDN", temp_k);
        liqDensLbGal = liqDensKmolM3 * consts.MW_H2O * consts.LB_PER_KG / consts.GAL_PER_M3;
    }

    const rho_KgM3 = liqDensLbGal / consts.LB_PER_KG * consts.GAL_PER_M3;
    const volM3 = spillVolML * 1e-6;
    const vcDot = volM3 / durationSec; // m3/sec
    const dtSec = 1.0;
    const pi = Math.PI;
    const surfaceRoughness = 0.01;
    const dm = 2.4e-5 * Math.sqrt(consts.MW_H2O / mw); //m2/s
    const nu_air = 1.5e-5; //m2/s
    const gc = consts.GC_M_S2;
    const hmin = surfaceRoughness;
    const Sc = nu_air / dm;
    const evapRateLowerLimit_kgs = 4e-5;
    const u = hoodVelocityFtMin / 3.28084 / 60; // wind speed - m/s

    let t = 1.0;

    // use Shaw and Briscoe radial calc
    let radius = Math.pow(32*gc*vcDot/9/pi,0.25) * Math.pow(t, 3/4);
    // console.log("radius 1: ", radius, " | vcDot: ", vcDot, " | pi: ", pi);
    let accVol = vcDot * dtSec; //m3
    let h = accVol / pi / Math.pow(radius, 2) //m
    
    // if height calc is below minimum allowable (controlled by roughness factor), set to hmin.  calc radius from that
    if (h<hmin) {
        h=hmin;
        radius = Math.sqrt(accVol/pi/h);
    }
    let evap = 1 // kg/s
    let prevEvap = 0; // kg/s
    let lostMass = 0; //kg
    let lostVol = 0; //m3
    let area = 0; //m2
    let dr_grav = 0; //m
    let dr_newVol = 0; //m
    let Km = 0; //m/s
    let pVap = vpPa; // Pa
    let totalEvaporatedKg = 0;

    const maxEvapRateAndTime = {
        evapRateGperSec: null,
        timeSec: null,
    };

    let maxEvapRate = 0;

    while (radius > 0 && t <= 3600) {
        t += dtSec;
        Km = 0.0048 * Math.pow(u, 0.77777777778) * 1/Math.pow(radius*2,0.111111111) * 1/Math.pow(Sc, 0.66666667);
        // console.log("km: ", Km, Math.pow(u, 0.77777777778),  1/Math.pow(radius*2,0.111111111) , 1/Math.pow(Sc, 0.66666667) );
        area = pi * Math.pow(radius, 2);
        evap = area * Km * mw * pVap / 8314 / temp_k;
        evap = Math.max(evap, evapRateLowerLimit_kgs);
        if (evap > maxEvapRate) {
            maxEvapRateAndTime.evapRateGperSec = evap * 1000;
            maxEvapRateAndTime.timeSec = t;
            maxEvapRate = evap;
        }
        gasRatePerSec.push(evap);
        totalEvaporatedKg += 0.5 * (evap + prevEvap) * dtSec;
        if (totalGasEvapGforOutput.hasOwnProperty(t)) {
            totalGasEvapGforOutput[t] = totalEvaporatedKg * 1000; 
        }
        lostMass = evap;
        lostVol = lostMass / rho_KgM3;
        accVol -= lostVol;
        if (accVol <= 0) break;
        accVol = Math.max(accVol, 0);

        
        if (t<=durationSec) {
            accVol += vcDot * dtSec;
            radius = 0.75 * Math.pow(32 * gc * vcDot / 9 / pi,0.25) * Math.pow(t, 3/4);
            h = accVol / pi / Math.pow(radius, 2);
        }
        
        // at each step, determine the calc height is below min.  adjust radius accordingly.
        h = accVol / pi / Math.pow(radius, 2);
        if (h<hmin) {
            h = hmin;
            radius = Math.sqrt(accVol/pi/h);
        }
        dr_grav = Math.sqrt(2*gc*(h-hmin));
        radius = radius + dr_grav;

    }

    if (accVol <= 0) totalGasEvapGforOutput.timeToCompletelyEvaporateSec = t;


    console.log("nulls: ", nulls, " | totalGasEvapGforOutput: ", totalGasEvapGforOutput, " | accVol: ", accVol, " | t: ", t, " | totalGasEvapGforOutput.timeToCompletelyEvaporateSec: ", totalGasEvapGforOutput.timeToCompletelyEvaporateSec);

    return {nulls, gasRatePerSec, maxEvapRateAndTime, totalGasEvapGforOutput};

}

export default dynamicPoolEvap;