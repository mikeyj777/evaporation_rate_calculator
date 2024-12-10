import * as consts from './consts';


//         st = Double.parseDouble(chemForAnalysis[8]);
// //Surface Tension (dyne/cm)

//         rho = Double.parseDouble(chemForAnalysis[9]) *
// 62.428; 
// //density (lb/ft3)

//         rho_KgM3 = rho * 16.0185; 
// // kg/m3

//         mu = Double.parseDouble(chemForAnalysis[10]);
// //Viscosity (cP)


const dynamicPoolEvap = (cas_no, temp_k, physProps, spillMassG, hoodVelocityFtMin) => {

    // track phys props without calcs.  these are subbed with water.  will notify user afterwards.
    const nulls = []

    // assumes a spill duration of 10 sec;
    const durationSec = 10;
    
    // filterAndCalculate(chem.casNumber, "ST", temp_k, dipprCoeffs, tcData);
    //     double[] gasRatePerSec = 
    // new double[60];

    const gasRatePerSec = [];

    //filterAndCalculate(cas_no, property_id, temperature, integrated=false)
    let vpPa = physProps.filterAndCalculate(cas_no, "VP", temp_k);
    let liqDensKmolM3 = physProps.filterAndCalculate(cas_no, "LDN", temp_k);
    let mw = physProps.getPropertyValue(cas_no, "MW");

    if (!vpPa) {
        nulls.push("VP");
        vpPa = physProps.filterAndCalculate(consts.CAS_NO_WATER, "VP", temp_k);
    }
    if (!liqDensKmolM3) {
        nulls.push("LDN");
        liqDensKmolM3 = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LDN", temp_k);
    }
    
    spillMassG = 6200000;

    const rho_KgM3 = liqDensKmolM3 * mw;
    const volM3 = spillMassG / 1000 / rho_KgM3;
    const vcDot = volM3 / durationSec; // m3/sec
    const dtSec = 1.0;
    const pi = Math.PI;
    const surfaceRoughness = 0.01;
    const dm = 2.4e-5 * Math.sqrt(18.01528/mw); //m2/s
    const nu_air = 1.5e-5; //m2/s
    const gc = consts.GC_M_S2;
    const hmin = surfaceRoughness;
    const Sc = nu_air / dm;
    const evapRateLowerLimit_kgs = 4e-5;
    const u = hoodVelocityFtMin / 3.28084 / 60; // wind speed - m/s

    let t = 0.0;

    let radius = Math.pow(32*gc*vcDot/9/pi,0.25);
    // console.log("radius 1: ", radius, " | vcDot: ", vcDot, " | pi: ", pi);
    let accVol = vcDot * dtSec; //m3
    let h = accVol / pi / Math.pow(radius, 2) //m
    
    if (h<hmin) {
        h=hmin;
        radius = Math.sqrt(accVol/pi/h);
    }
    let evap = 1 // kg/s
    let lostMass = 0; //kg
    let lostVol = 0; //m3
    let area = 0; //m2
    let dr_grav = 0; //m
    let dr_newVol = 0; //m
    let Km = 0; //m/s
    let pVap = vpPa; // Pa
    let totalgasrates = 0;

    const maxEvapRateAndTime = {
        evapRateGperSec: null,
        timeSec: null,
    };

    let maxEvapRate = 0;

    while (radius > 0 && t < 3600) {
        t += dtSec;
        Km = 0.0048 * Math.pow(u, 0.77777777778) * 1/Math.pow(radius*2,0.111111111) * 1/Math.pow(Sc, 0.66666667);
        // console.log("km: ", Km, Math.pow(u, 0.77777777778),  1/Math.pow(radius*2,0.111111111) , 1/Math.pow(Sc, 0.66666667) );
        area = pi * Math.pow(radius, 2);
        evap = area * Km * mw * pVap / 8314 / temp_k;
        // evap = Math.max(evap, evapRateLowerLimit_kgs);
        if (evap > maxEvapRate) {
            maxEvapRateAndTime['evapRateGperSec'] = evap * 1000;
            maxEvapRateAndTime['timeSec'] = t;
            maxEvapRate = evap;
        }
        gasRatePerSec.push(evap);
        lostMass = evap;
        lostVol = lostMass / rho_KgM3;
        accVol -= lostVol;
        if (accVol <= 0) break;
        accVol = Math.max(accVol, 0);
        h = accVol / pi / Math.pow(radius, 2);
        if (h<hmin) {
            h = hmin;
            radius = Math.sqrt(accVol/pi/h);
        }
        dr_grav = Math.sqrt(2*gc*(h-hmin));
        radius = radius + dr_grav;
        if (t<=durationSec) {
            accVol = accVol + vcDot * dtSec;
            dr_newVol = 0.75 * Math.pow(32 * gc * vcDot / 9 / pi,0.25);
            radius = radius + dr_newVol;
        }

    }

    

    return {nulls, gasRatePerSec}

}

export default dynamicPoolEvap;