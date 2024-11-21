import React, { useState, useEffect } from 'react';
import { 
  loadChemicalData, 
  calculateEvaporationRate,
  convertToMolarBasis,
  getAverageMolecularWeight
} from '../utils/evaporationUtils';
import '../styles/EvaporationCalculator.css';

const EvaporationCalculator = () => {
  const [hoodVelocity, setHoodVelocity] = useState('');
  const [hoodLength, setHoodLength] = useState('');
  const [hoodDepth, setHoodDepth] = useState('');
  const [chemicalInput, setChemicalInput] = useState('');
  const [componentAmount, setComponentAmount] = useState('');
  const [isMolarBasis, setIsMolarBasis] = useState(false);
  const [mixtureComponents, setMixtureComponents] = useState([]);
  const [filteredChemicals, setFilteredChemicals] = useState([]);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [chemicalData, setChemicalData] = useState([]);

  useEffect(() => {
    loadChemicalData().then(data => setChemicalData(data));
  }, []);

  useEffect(() => {
    if (chemicalInput.length > 0) {
      const searchTerm = chemicalInput.toLowerCase();
      const filtered = chemicalData.filter(chem => 
        chem.name.toLowerCase().includes(searchTerm) ||
        (chem.casNumber && chem.casNumber.includes(searchTerm))
      );
      setFilteredChemicals(filtered);
    } else {
      setFilteredChemicals([]);
    }
  }, [chemicalInput, chemicalData]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddComponent();
    }
  };

  const handleChemicalSelect = (chemical) => {
    setSelectedChemical(chemical);
    setChemicalInput(`${chemical.name} | ${chemical.casNumber}`);
    setFilteredChemicals([]);
  };

  const handleAddComponent = () => {
    if (!selectedChemical) {
      setError('Please select a valid chemical from the dropdown');
      return;
    }

    if (!componentAmount) {
      setError('Please enter component amount');
      return;
    }

    const amount = parseFloat(componentAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setMixtureComponents([
      ...mixtureComponents,
      {
        ...selectedChemical,
        amount,
        isMolar: isMolarBasis
      }
    ]);

    // Reset inputs
    setChemicalInput('');
    setComponentAmount('');
    setSelectedChemical(null);
    setFilteredChemicals([]);
    setError('');
  };

  const removeComponent = (identifier) => {
    const remainingComponents = mixtureComponents.filter(comp => 
      (comp.casNumber && comp.casNumber === identifier) || 
      (!comp.casNumber && comp.name === identifier)
    );
    setMixtureComponents(remainingComponents);
  };

  const calculateResults = () => {
    if (!hoodVelocity || !hoodLength || !hoodDepth) {
      setError('Please provide all hood dimensions and face velocity');
      return;
    }

    if (mixtureComponents.length === 0) {
      setError('Please add at least one component to the mixture');
      return;
    }

    try {
      if (!isMolarBasis) setMixtureComponents(convertToMolarBasis(mixtureComponents));
    } catch (err) {
      setError('Error converting mass to molar: ' + err.message);
      console.log("Mixture after converting to molar basis: ", mixtureComponents);
      return;
    }
    

    try {
      console.log("in calculateResults.  Mixture components: ", mixtureComponents, " | hoodVelocity: ", hoodVelocity, " | hoodLength: ", hoodLength, " | hoodDepth: ", hoodDepth);
      const evaporationRate = calculateEvaporationRate(
        mixtureComponents,
        parseFloat(hoodVelocity),
        parseFloat(hoodLength),
        parseFloat(hoodDepth),
      );

      setResults({
        ratePerSecond: evaporationRate,
        tenSeconds: evaporationRate * 10 * 1000, // Convert to grams
        sixtySeconds: evaporationRate * 60 * 1000 // Convert to grams
      });
      setError('');
    } catch (err) {
      setError('Error calculating evaporation rate: ' + err.message);
    }
  };

  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <h1 className="calculator-title">Lab Hood Evaporation Calculator</h1>
      </div>

      <div className="form-group">
        <label className="form-label">Hood Dimensions</label>
        <div className="dimension-inputs">
          <div>
            <label className="form-label">Length (ft)</label>
            <input
              type="number"
              value={hoodLength}
              onChange={(e) => setHoodLength(e.target.value)}
              placeholder="Enter length"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Depth (ft)</label>
            <input
              type="number"
              value={hoodDepth}
              onChange={(e) => setHoodDepth(e.target.value)}
              placeholder="Enter depth"
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="hood-velocity">
          Hood Face Velocity (ft/s)
        </label>
        <input
          id="hood-velocity"
          type="number"
          value={hoodVelocity}
          onChange={(e) => setHoodVelocity(e.target.value)}
          placeholder="Enter hood face velocity"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <div className="basis-selection">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isMolarBasis}
              onChange={(e) => setIsMolarBasis(e.target.checked)}
              disabled={mixtureComponents.length > 0}
              className="checkbox"
            />
            Molar Basis
          </label>
        </div>

        <label className="form-label">Add Mixture Component</label>
        <div className="component-input-row">
          <div className="chemical-input-container">
            <input
              value={chemicalInput}
              onChange={(e) => setChemicalInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Search by Chemical Name or CAS Number"
              className="form-input"
            />
            {filteredChemicals.length > 0 && (
              <div className="dropdown">
                {filteredChemicals.map((chem) => (
                  <div
                    key={chem.casNumber || chem.name}
                    className="dropdown-item"
                    onClick={() => handleChemicalSelect(chem)}
                  >
                    {chem.name} | {chem.casNumber}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="amount-input-container">
            <input
              type="number"
              value={componentAmount}
              onChange={(e) => setComponentAmount(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Amount"
              className="form-input"
            />
          </div>

          <button
            className="add-button"
            onClick={handleAddComponent}
          >
            Add Chemical
          </button>
        </div>
      </div>

      {mixtureComponents.length > 0 && (
        <div className="mixture-summary">
          <h3>Mixture Components {isMolarBasis ? '(Molar Basis)' : '(Mass Basis)'}</h3>
          <table className="mixture-table">
            <thead>
              <tr>
                <th className="table-header">Chemical</th>
                <th className="table-header">CAS Number</th>
                <th className="table-header">Amount</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mixtureComponents.map((component) => (
                <tr key={component.casNumber || component.name}>
                  <td className="table-cell">
                    {component.name}
                  </td>
                  <td className="table-cell">
                    {component.casNumber}
                  </td>
                  <td className="table-cell">
                    {component.amount.toFixed(2)}
                  </td>
                  <td className="table-cell">
                    <button
                      className="remove-button"
                      onClick={() => removeComponent(component.casNumber || component.name)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        className="calculate-button"
        onClick={calculateResults}
        disabled={!hoodVelocity || !hoodLength || !hoodDepth || mixtureComponents.length === 0}
      >
        Calculate Evaporation Rate
      </button>

      {results && (
        <div className="results-container">
          <h3>Results:</h3>
          <p>Evaporation Rate: {results.ratePerSecond.toFixed(6)} kg/sec</p>
          <p>Amount evaporated in 10 seconds: {results.tenSeconds.toFixed(2)} g</p>
          <p>Amount evaporated in 60 seconds: {results.sixtySeconds.toFixed(2)} g</p>
        </div>
      )}
    </div>
  );
};

export default EvaporationCalculator;
