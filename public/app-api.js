// API Configuration
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
const API_ENDPOINTS = {
    records: `${API_BASE}/api/records`,
    patients: `${API_BASE}/api/patients`,
    backup: `${API_BASE}/api/backup`,
    init: `${API_BASE}/api/init`
};

// Initialize application
let records = [];
let patients = {}; // Store unique patients by folder number
let logoDataUrl = null;
let isOnline = true;

// Check if API is available
async function checkAPIConnection() {
    try {
        const response = await fetch(API_ENDPOINTS.patients);
        isOnline = response.ok;
        if (isOnline) {
            console.log('✓ Connected to database');
            document.body.classList.remove('offline');
        } else {
            console.warn('⚠ API not responding, using localStorage fallback');
            isOnline = false;
            document.body.classList.add('offline');
        }
    } catch (error) {
        console.warn('⚠ Cannot connect to API, using localStorage fallback');
        isOnline = false;
        document.body.classList.add('offline');
    }
    return isOnline;
}

// Load records from API or localStorage
async function loadRecords() {
    try {
        if (isOnline) {
            const response = await fetch(API_ENDPOINTS.records);
            const data = await response.json();
            if (data.success) {
                records = data.records;
                // Also save to localStorage as backup
                localStorage.setItem('patientRecords', JSON.stringify(records));
                return;
            }
        }
    } catch (error) {
        console.error('Error loading records from API:', error);
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('patientRecords');
    if (stored) {
        records = JSON.parse(stored);
    }
}

// Load patients database from API or localStorage
async function loadPatients() {
    try {
        if (isOnline) {
            const response = await fetch(API_ENDPOINTS.patients);
            const data = await response.json();
            if (data.success) {
                patients = data.patients;
                // Also save to localStorage as backup
                localStorage.setItem('patientsDatabase', JSON.stringify(patients));
                return;
            }
        }
    } catch (error) {
        console.error('Error loading patients from API:', error);
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('patientsDatabase');
    if (stored) {
        patients = JSON.parse(stored);
    }
}

// Save records to API and localStorage
async function saveRecords() {
    localStorage.setItem('patientRecords', JSON.stringify(records));
}

// Save patients database to API and localStorage
async function savePatients() {
    localStorage.setItem('patientsDatabase', JSON.stringify(patients));
}

// Load records from localStorage on startup
window.addEventListener('DOMContentLoaded', async () => {
    // Show loading indicator
    showLoadingMessage('Connecting to database...');
    
    // Check API connection
    await checkAPIConnection();
    
    // Load data
    await loadRecords();
    await loadPatients();
    
    // Update UI
    populatePatientDropdown();
    updateHospitalFilters();
    displayRecords();
    setDefaultDate();
    
    // Load logo after a short delay to ensure DOM is ready
    setTimeout(loadLogo, 100);
    
    // Hide loading indicator
    hideLoadingMessage();
});

// Show loading message
function showLoadingMessage(message) {
    let loadingDiv = document.getElementById('loadingMessage');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingMessage';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a5298;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 16px;
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.textContent = message;
    loadingDiv.style.display = 'block';
}

// Hide loading message
function hideLoadingMessage() {
    const loadingDiv = document.getElementById('loadingMessage');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Load logo and convert to base64
function loadLogo() {
    const logoImg = document.getElementById('hospitalLogo');
    
    // Function to convert image to base64
    const convertToBase64 = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = logoImg.naturalWidth || 200;
            canvas.height = logoImg.naturalHeight || 200;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(logoImg, 0, 0);
            logoDataUrl = canvas.toDataURL('image/png');
            console.log('Logo loaded successfully');
        } catch (e) {
            console.error('Error converting logo:', e);
        }
    };
    
    // Wait for image to load
    if (logoImg.complete && logoImg.naturalHeight !== 0 && logoImg.naturalWidth !== 0) {
        // Image already loaded
        convertToBase64();
    } else {
        // Wait for image to load
        logoImg.onload = () => {
            console.log('Logo image loaded from file');
            convertToBase64();
        };
        
        logoImg.onerror = () => {
            console.error('Failed to load logo.png file');
            alert('Could not load logo.png. Please ensure the logo file is in the same folder as index.html');
        };
    }
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reviewDate').value = today;
    document.getElementById('summaryDate').value = today;
    generateDailySummary();
}
