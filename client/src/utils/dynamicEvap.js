import * as consts from './consts';

const dynamicPoolEvap = (cas_no, temp_k, physProps, spillMassG) => {

    // track phys props without calcs.  these are subbed with water.  will notify user afterwards.
    const nulls = []

    // filterAndCalculate(chem.casNumber, "ST", temp_k, dipprCoeffs, tcData);
    //     double[] gasRatePerSec = 
    // new double[60];

    const gasRatePerSec = new Array(60).fill(0);

    //     double[] gasRatePerMin = 
    // new double[120];

    const gasRatePerMin = new Array(120).fill(0);

    //     static 
    // double[] gasRtPfl = new 
    // double[120];

    const gasRtPfl = new Array(120);
    //filterAndCalculate(cas_no, property_id, temperature, integrated=false)
    let surfaceTensionNm = physProps.filterAndCalculate(cas_no, "ST", temp_k);
    let vpPa = physProps.filterAndCalculate(cas_no, "VP", temp_k);
    let liqDensKmolM3 = physProps.filterAndCalculate(cas_no, "LDN", temp_k);
    let liqViscosityPaS = physProps.filterAndCalculate(cas_no, "LVS", temp_k);
    let mw = physProps.getPropertyValue(cas_no, "MW");

    if (!surfaceTensionNm) {
        nulls.push("ST");
        surfaceTensionNm = physProps.filterAndCalculate(consts.CAS_NO_WATER, "ST", temp_k);
    }
    if (!vpPa) {
        nulls.push("VP");
        vpPa = physProps.filterAndCalculate(consts.CAS_NO_WATER, "VP", temp_k);
    }
    if (!liqDensKmolM3) {
        nulls.push("LDN");
        liqDensKmolM3 = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LDN", temp_k);
    }
    if (!liqViscosityPaS) {
        nulls.push("LVS");
        liqViscosityPaS = physProps.filterAndCalculate(consts.CAS_NO_WATER, "LVS", temp_k);
    }

    console.log("chem: ", cas_no, " | st: ", surfaceTensionNm, " N/m | liq dens: ", liqDensKmolM3, " kmol/m3 | liq visc: ", liqViscosityPaS, " Pa.s");




    return {nulls, gasRtPfl}

}

export default dynamicPoolEvap;

    

        

        

//         st = Double.parseDouble(chemForAnalysis[8]);
// //Surface Tension (dyne/cm)

//         rho = Double.parseDouble(chemForAnalysis[9]) *
// 62.428; 
// //density (lb/ft3)

//         rho_KgM3 = rho * 16.0185; 
// // kg/m3

//         mu = Double.parseDouble(chemForAnalysis[10]);
// //Viscosity (cP)

//         vol = leakRate * duration / rho;

//         volRate = leakRate / rho;

//         surfaceRoughness = 0.01; 
// //m

//         mw = Double.parseDouble(chemForAnalysis[4]);

        

//         poolEvap();

        

//     }



//     private 
// void poolEvap () {

//         Double dt=1.0; 
// //s

//         Double t_modulo; //s

//         double duration_s = duration *
// 60; //s

//         double Vcdot = volRate / 
// 60 / 35.3147; 
// //m3/s

//         double pival = 
// 3.1415926535;

//         Double t=0.0; 
// //s

//         Double t_minute = -1.0; 
// //min

//         double gc = 
// 9.80665; //m/s2

//         double radius = Math.pow(32*gc*Vcdot/9/pival,0.25);
// //m

//         double accVol = Vcdot * dt; 
// //m3

//         double h = accVol / (pival * Math.pow(radius,
// 2)); //m

//         double hmin = surfaceRoughness;
// //m

        

//         if (h<hmin) {

//             h=hmin;

//             radius = Math.sqrt(accVol/pival/h);

//         }

        

//         double dr_grav;// m

//         double dr_newVol; 
// //m

//         double Km; 
// //m/s

//         double Evap = 
// 1; //kg/s

//         double lostMass; 
// //kg

//         double lostVol; 
// //m3

//         double area; 
// //m2

//         double Dm = 
// 2.4e-5 * Math.sqrt(18.01528/mw); 
// //m2/s

//         double nu_air = 
// 1.5e-5; //m2/s

//         double Sc = nu_air/Dm;

//         double evapRateLowerLimit_kgs =
// 4e-5;

//         double antA = Double.parseDouble(chemForAnalysis[5]);

//         double antB = Double.parseDouble(chemForAnalysis[6]);

//         double antC = Double.parseDouble(chemForAnalysis[7]);

//         temp = (localWeather[3] - 
// 32) / 1.8; 

//         pVap = Math.pow(10, antA - antB/(antC + temp)) *
// 133.322;

//         double totalgasrates;

        

        

//         u = localWeather[1] * 
// 0.44704; // m/s

        

//         //loop until evap is under threshold

//         while (radius>0 || t_minute <
// 120) {

//             t = t + dt;

//             Km = 0.0048 * Math.pow(u,
// 0.77777777778) * 
// 1/Math.pow(radius*2,0.111111111) *
// 1/Math.pow(Sc, 
// 0.66666667);

//             area = pival * Math.pow(radius, 
// 2);

//             Evap = area * Km * (mw * pVap / 
// 8314 / (temp + 273.15));

//             lostMass = Evap;

//             lostVol = lostMass/rho_KgM3;

//             accVol = accVol - lostVol;

//             if (accVol<0) {

//                 accVol = 0;

//             }

//             h = accVol/pival/Math.pow(radius,2);

//             if (h<hmin) {

//                 h = hmin;

//                 radius = Math.sqrt(accVol/pival/h);

//             }

            

//             dr_grav = Math.sqrt(2*gc*(h-hmin));

//             radius = radius + dr_grav;

//             if (t<=duration_s) {

//                 accVol = accVol + Vcdot * dt;

//                 dr_newVol = 0.75 * Math.pow(32 * gc * Vcdot /
// 9 / pival,0.25);

//                 radius = radius + dr_newVol;

//             }

                

//             t_modulo = t%60;

//             if (t_modulo == 
// 0) {

//                 t_modulo = 60.0;

//             }

            

//             gasRatePerSec[t_modulo.intValue()-1] = Evap *
// 132.277; 
// //lb/min 

            

//             totalgasrates = 0;

//             if (t_modulo == 
// 60) {

//                 t_minute = t_minute + 1.0;

//                 for (int i=0;i<60;i++) {

//                     totalgasrates = totalgasrates + gasRatePerSec[i];

//                 }

//                 if (t_minute<120) {

//                     gasRatePerMin[t_minute.intValue()] = totalgasrates/60;

//                 }

//             }

            

//         }

        

//         gasRtPfl = gasRatePerMin;

//         for (int i=0;i<gasRtPfl.length;i++) {

//             if (Double.isNaN(gasRtPfl[i])) {

//                 gasRtPfl[i] = 0;

//             }

//         }

        

//         sendData();

        

//         finish();

        

//     }



//     private 
// void sendData() {

        

    

//         Intent i = getIntent();

//         String msg = i.getStringExtra("grp");

        

//         if(msg.contentEquals("grp")) {

//             i.putExtra("giveMeTheProfile", gasRtPfl);

//             setResult(RESULT_OK, i);

//          }

         

         

//         finish();

    

//     }

    

// }

