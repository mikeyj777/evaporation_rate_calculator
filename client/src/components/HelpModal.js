//HelpModal.js

import React, { useEffect } from 'react';
import '../styles/HelpModal.css';

const HelpModal = () => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        const modalElement = document.querySelector('.modal.show');
        if (modalElement) {
          const event = new Event('click');
          modalElement.dispatchEvent(event);
        }
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div>
      <div className="modal-content">
        
        <h2>Evaporation Calculator Help</h2>
        
        <section>
          <h3>About</h3>
          <p>The basis for these calculations is a white paper entitled 'Modeling hydrochloric acid evaporation in ALOHA'. 
             The methods detailed in this paper should hold for a wide range of components and mixtures below their normal boiling point.</p>
          <p>Source: <a href="https://repository.library.noaa.gov/view/noaa/2132">NOAA Technical Memorandum</a></p>
        </section>

        <section>
          <h3>Required Inputs</h3>
          
          <h4>Hood Dimensions</h4>
          <div className="subsection">
            <p><strong>Length:</strong> The length across the work surface (left to right) in feet</p>
            <p><strong>Depth:</strong> The depth of the work surface (from sash at the front to air intake at back) in feet</p>
          </div>

          <h4>Hood Face Velocity</h4>
          <div className="subsection">
            <p>Measured in feet per second. This value depends on the sash height setting. Use values developed for your hood's specific sash height targets.</p>
          </div>

          <h4>Mixture Components</h4>
          <div className="subsection">
            <ul>
              <li>Enter all components that could be spilled</li>
              <li>Search by chemical name or CAS Number</li>
              <li>The list of available chemicals will automatically filter while typing</li>
              <li>For pure components:
                <ul>
                  <li>Enter single component</li>
                  <li>Any numeric value works for "Amount"</li>
                </ul>
              </li>
              <li>For mixtures:
                <ul>
                  <li>Select molar or mass basis before adding components</li>
                  <li>Must remove all components to change molar/mass basis selection</li>
                  <li>Enter relative amounts (ratios or fractions)</li>
                  <li>Avoid using %, $, or commas (periods for decimals are OK)</li>
                  <li>Values do not need to sum to 1 or 100</li>
                  <li>Values will be normalized when submitted</li>
                </ul>
              </li>
            </ul>
          </div>

          <h4>Manually Input Required Parameters</h4>
          <div className="subsection">
            <ul>
              <li>Check this box to directly enter:
                <ul>
                  <li>Molecular weight</li>
                  <li>Vapor pressure at 25°C (in Pascals)</li>
                </ul>
              </li>
              <li>Values can be:
                <ul>
                  <li>Pure component properties</li>
                  <li>Average/effective properties for a mixture</li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h3>Key Equations</h3>
          
          <p><strong>Diffusivity:</strong></p>
          <div className="equation">D_mixture = D_water × √(MW_water / MW_mixture)</div>
          
          <p><strong>Schmidt Number:</strong></p>
          <div className="equation">Sc = kinematic_viscosity_air / D_mixture</div>
          
          <p><strong>Mass Transfer Coefficient (Km):</strong></p>
          <div className="equation">Km = 0.0048 × (velocity)^(7/9) × (diameter)^(-1/9) × (Schmidt)^(-2/3)</div>
          
          <p><strong>Evaporation Rate:</strong></p>
          <div className="equation">Rate = area × Km × (MW × vapor_pressure / R / T)</div>
          
          <p><strong>Where:</strong></p>
          <dl className="constant-list">
            <dt>R</dt>
            <dd>8314 J/kmol/K (gas constant)</dd>
            
            <dt>T</dt>
            <dd>298.15 K (assumed ambient temperature)</dd>
            
            <dt>D_water</dt>
            <dd>2.4E-5 m²/s (diffusivity of water in air)</dd>
            
            <dt>MW_water</dt>
            <dd>18.02 g/mol</dd>
            
            <dt>kinematic_viscosity_air</dt>
            <dd>1.568E-5 m²/s at 298.15 K</dd>
            
            <dt>area</dt>
            <dd>hood length × width (m²)</dd>
            
            <dt>diameter</dt>
            <dd>√(4 × area / π)</dd>
          </dl>
        </section>

        <section>
          <h3>Contact</h3>
          <p>For questions or support, contact Mike James (mjames@eastman.com)</p>
        </section>
      </div>
    </div>
  );
};

export default HelpModal;
