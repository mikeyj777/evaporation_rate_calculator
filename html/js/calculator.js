import { loadChemicalData, normalizeComponents } from './evaporationUtils.js';

// State management
let chemicalData = [];
let mixtureComponents = [];
let filteredChemicals = [];
let selectedChemical = null;

// DOM Elements
const elements = {
    hoodLength: document.getElementById('hood-length'),
    hoodDepth: document.getElementById('hood-depth'),
    hoodVelocity: document.getElementById('hood-velocity'),
    chemicalSearch: document.getElementById('chemical-search'),
    componentAmount: document.getElementById('component-amount'),
    molarBasis: document.getElementById('molar-basis'),
    addComponentButton: document.getElementById('add-component-button'),
    chemicalDropdown: document.getElementById('chemical-dropdown'),
    mixtureSummary: document.getElementById('mixture-summary'),
    mixtureTableBody: document.getElementById('mixture-table-body'),
    errorMessage: document.getElementById('error-message'),
    calculateButton: document.getElementById('calculate-button'),
    results: document.getElementById('results'),
    evaporationRate: document.getElementById('evaporation-rate'),
    tenSecondResult: document.getElementById('ten-second-result'),
    sixtySecondResult: document.getElementById('sixty-second-result')
};

// Initialize
async function init() {
    try {
        chemicalData = await loadChemicalData();
        console.log("loading data");
        setupEventListeners();
    } catch (error) {
        showError('Error loading chemical data');
    }
}

// Event Listeners
function setupEventListeners() {
    elements.chemicalSearch.addEventListener('input', handleChemicalSearch);
    elements.calculateButton.addEventListener('click', calculateResults);
    elements.addComponentButton.addEventListener('click', () => {
        if (selectedChemical) {
            addComponent(selectedChemical.name);
        }
    });
    
    // Add input listeners for validation
    elements.hoodLength.addEventListener('input', validateInputs);
    elements.hoodDepth.addEventListener('input', validateInputs);
    elements.hoodVelocity.addEventListener('input', validateInputs);
}

// Chemical Search Handler
function handleChemicalSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    selectedChemical = null;
    elements.addComponentButton.disabled = true;
    
    if (searchTerm.length > 0) {
        filteredChemicals = chemicalData.filter(chem => 
            chem.name.toLowerCase().includes(searchTerm) ||
            (chem.casNumber && chem.casNumber.includes(searchTerm))
        );
        displayFilteredChemicals();
    } else {
        elements.chemicalDropdown.style.display = 'none';
        filteredChemicals = [];
    }
}

// Display Functions
function displayFilteredChemicals() {
    if (filteredChemicals.length > 0) {
        elements.chemicalDropdown.innerHTML = filteredChemicals
            .map(chem => `
                <div class="dropdown-item" onclick="selectChemical('${chem.name}')">
                    ${chem.name} | ${chem.casNumber}
                </div>
            `).join('');
        elements.chemicalDropdown.style.display = 'block';
    } else {
        elements.chemicalDropdown.style.display = 'none';
    }
}

function updateMixtureTable() {
    if (mixtureComponents.length > 0) {
        elements.mixtureSummary.style.display = 'block';
        elements.mixtureTableBody.innerHTML = mixtureComponents
            .map(comp => `
                <tr>
                    <td class="table-cell">${comp.name}</td>
                    <td class="table-cell">${comp.casNumber}</td>
                    <td class="table-cell">${comp.originalAmount.toFixed(2)} (${comp.originalBasis})</td>
                    <td class="table-cell">${comp.amount.toFixed(2)}</td>
                    <td class="table-cell">
                        <button class="remove-button" onclick="removeComponent('${comp.name}')">
                            Remove
                        </button>
                    </td>
                </tr>
            `).join('');
    } else {
        elements.mixtureSummary.style.display = 'none';
    }
    validateInputs();
}

// Component Management
function selectChemical(chemicalName) {
    selectedChemical = filteredChemicals.find(chem => chem.name === chemicalName);
    elements.chemicalSearch.value = `${selectedChemical.name} | ${selectedChemical.casNumber}`;
    elements.chemicalDropdown.style.display = 'none';
    elements.addComponentButton.disabled = false;
}

function addComponent(chemicalName) {
    if (!selectedChemical) {
        showError('Please select a chemical from the dropdown');
        return;
    }

    const amount = parseFloat(elements.componentAmount.value);
    if (!amount || isNaN(amount) || amount <= 0) {
        showError('Please enter a valid positive number');
        return;
    }

    const newComponent = {
        ...selectedChemical,
        amount,
        isMolar: elements.molarBasis.checked
    };

    const newComponents = [...mixtureComponents, newComponent];
    mixtureComponents = normalizeComponents(newComponents);

    // Reset inputs
    elements.chemicalSearch.value = '';
    elements.componentAmount.value = '';
    elements.molarBasis.checked = false;
    elements.chemicalDropdown.style.display = 'none';
    elements.addComponentButton.disabled = true;
    selectedChemical = null;
    hideError();

    updateMixtureTable();
}

function removeComponent(chemicalName) {
    const remainingComponents = mixtureComponents.filter(comp => comp.name !== chemicalName);
    mixtureComponents = remainingComponents.length > 0 ? normalizeComponents(remainingComponents) : [];
    updateMixtureTable();
}

// Calculation and Validation
function validateInputs() {
    const isValid = elements.hoodLength.value && 
                   elements.hoodDepth.value && 
                   elements.hoodVelocity.value && 
                   mixtureComponents.length > 0;
    
    elements.calculateButton.disabled = !isValid;
}

function calculateResults() {
    try {
        const evaporationRate = calculateEvaporationRate(
            mixtureComponents,
            parseFloat(elements.hoodVelocity.value),
            parseFloat(elements.hoodLength.value),
            parseFloat(elements.hoodDepth.value)
        );

        elements.evaporationRate.textContent = `Evaporation Rate: ${evaporationRate.toFixed(6)} kg/sec`;
        elements.tenSecondResult.textContent = `Amount evaporated in 10 seconds: ${(evaporationRate * 10 * 1000).toFixed(2)} g`;
        elements.sixtySecondResult.textContent = `Amount evaporated in 60 seconds: ${(evaporationRate * 60 * 1000).toFixed(2)} g`;
        elements.results.style.display = 'block';
        hideError();
    } catch (err) {
        showError('Error calculating evaporation rate: ' + err.message);
    }
}

// Error Handling
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Make functions available to inline onclick handlers
window.selectChemical = selectChemical;
window.removeComponent = removeComponent;

// Initialize the application
init();