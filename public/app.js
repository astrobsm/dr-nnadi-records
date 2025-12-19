// Initialize application
let records = [];
let patients = {}; // Store unique patients by folder number
let logoDataUrl = null;
let isCloudEnabled = false;

// API Configuration - Using cloud database
const API_BASE = window.location.hostname === 'localhost' ? '' : '';
const API_ENDPOINTS = {
    records: `${API_BASE}/api/records`,
    patients: `${API_BASE}/api/patients`,
    backup: `${API_BASE}/api/backup`,
    init: `${API_BASE}/api/init`
};

// Load records from cloud or localStorage on startup
window.addEventListener('DOMContentLoaded', async () => {
    showLoadingIndicator('Loading data...');
    await checkCloudConnection();
    await loadRecords();
    await loadPatients();
    
    // Sync local data to cloud if cloud is enabled
    if (isCloudEnabled) {
        await syncLocalDataToCloud();
    }
    
    populatePatientDropdown();
    updateHospitalFilters();
    displayRecords();
    setDefaultDate();
    // Load logo after a short delay to ensure DOM is ready
    setTimeout(loadLogo, 100);
    hideLoadingIndicator();
    updateSyncStatus();
});

// Sync local data to cloud
window.syncLocalDataToCloud = async function() {
    if (!isCloudEnabled) {
        console.log('Cloud sync not enabled');
        return;
    }
    
    try {
        showLoadingIndicator('Syncing local data to cloud...');
        
        // Get local records
        const localRecordsStr = localStorage.getItem('patientRecords');
        if (!localRecordsStr) {
            console.log('No local records to sync');
            hideLoadingIndicator();
            return;
        }
        
        const localRecords = JSON.parse(localRecordsStr);
        
        // Get cloud records to check what's already synced
        const response = await fetch(API_ENDPOINTS.records);
        const data = await response.json();
        const cloudRecords = data.success ? data.records : [];
        
        // Find records that exist locally but not in cloud
        // We'll use a combination of folderNumber, reviewDate, and serviceType as unique identifier
        const cloudRecordKeys = new Set(
            cloudRecords.map(r => `${r.folderNumber}-${r.reviewDate}-${r.serviceType}`)
        );
        
        const recordsToSync = localRecords.filter(localRecord => {
            const key = `${localRecord.folderNumber}-${localRecord.reviewDate}-${localRecord.serviceType}`;
            return !cloudRecordKeys.has(key);
        });
        
        if (recordsToSync.length === 0) {
            console.log('✓ All local data already synced to cloud');
            hideLoadingIndicator();
            return;
        }
        
        console.log(`Syncing ${recordsToSync.length} local records to cloud...`);
        
        let syncedCount = 0;
        let errorCount = 0;
        
        // Sync each record
        for (const record of recordsToSync) {
            try {
                const syncResponse = await fetch(API_ENDPOINTS.records, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patientName: record.patientName,
                        folderNumber: record.folderNumber,
                        reviewDate: record.reviewDate,
                        hospitalName: record.hospitalName,
                        serviceType: record.serviceType,
                        serviceDetails: record.serviceDetails,
                        fee: record.fee,
                        notes: record.notes || '',
                        firstVisit: record.firstVisit || record.reviewDate
                    })
                });
                
                const syncData = await syncResponse.json();
                if (syncData.success) {
                    syncedCount++;
                    console.log(`✓ Synced: ${record.patientName} - ${record.reviewDate}`);
                } else {
                    errorCount++;
                    console.error('Sync failed for record:', record);
                }
            } catch (error) {
                errorCount++;
                console.error('Error syncing record:', error);
            }
        }
        
        // Reload records from cloud to get the updated list
        await loadRecords();
        displayRecords();
        
        hideLoadingIndicator();
        
        if (syncedCount > 0) {
            alert(`✓ Successfully synced ${syncedCount} local records to cloud!${errorCount > 0 ? `\n⚠ ${errorCount} records failed to sync.` : ''}`);
        } else if (errorCount > 0) {
            alert(`⚠ Failed to sync ${errorCount} records. Please try again.`);
        }
        
        console.log(`Sync complete: ${syncedCount} synced, ${errorCount} errors`);
        
    } catch (error) {
        console.error('Error during local-to-cloud sync:', error);
        hideLoadingIndicator();
        alert('Error syncing data to cloud. Please check your connection and try again.');
    }
};

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

// Check if cloud database is available
async function checkCloudConnection() {
    try {
        const response = await fetch(API_ENDPOINTS.records);
        const data = await response.json();
        if (data.success !== undefined) {
            isCloudEnabled = true;
            console.log('☁️ Cloud sync enabled (Prisma Postgres + Accelerate)');
            return true;
        }
    } catch (error) {
        console.log('💾 Cloud unavailable, using local storage only');
    }
    isCloudEnabled = false;
    return false;
}

// Load records from cloud or localStorage
async function loadRecords() {
    if (isCloudEnabled) {
        try {
            const response = await fetch(API_ENDPOINTS.records);
            const data = await response.json();
            if (data.success && data.records) {
                records = data.records;
                // Save to localStorage as backup
                localStorage.setItem('patientRecords', JSON.stringify(records));
                console.log(`✓ Loaded ${records.length} records from cloud`);
                return;
            }
        } catch (error) {
            console.error('Error loading from cloud:', error);
        }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('patientRecords');
    if (stored) {
        records = JSON.parse(stored);
        console.log(`✓ Loaded ${records.length} records from local storage`);
    }
}

// Load patients database from cloud or localStorage
async function loadPatients() {
    if (isCloudEnabled) {
        try {
            const response = await fetch(API_ENDPOINTS.patients);
            const data = await response.json();
            if (data.success && data.patients) {
                patients = data.patients;
                // Save to localStorage as backup
                localStorage.setItem('patientsDatabase', JSON.stringify(patients));
                console.log(`✓ Loaded ${Object.keys(patients).length} patients from cloud`);
                return;
            }
        } catch (error) {
            console.error('Error loading patients from cloud:', error);
        }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('patientsDatabase');
    if (stored) {
        patients = JSON.parse(stored);
        console.log(`✓ Loaded ${Object.keys(patients).length} patients from local storage`);
    }
}

// Save record to cloud and localStorage
async function saveRecordToCloud(record) {
    if (!isCloudEnabled) {
        localStorage.setItem('patientRecords', JSON.stringify(records));
        return true;
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.records, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data = await response.json();
        if (data.success) {
            console.log('✓ Record saved to cloud');
            // Also save to localStorage as backup
            localStorage.setItem('patientRecords', JSON.stringify(records));
            return true;
        }
    } catch (error) {
        console.error('Error saving to cloud:', error);
        // Save to localStorage as fallback
        localStorage.setItem('patientRecords', JSON.stringify(records));
    }
    return false;
}

// Update record in cloud
async function updateRecordInCloud(record) {
    if (!isCloudEnabled) {
        localStorage.setItem('patientRecords', JSON.stringify(records));
        return true;
    }
    
    try {
        const response = await fetch(API_ENDPOINTS.records, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
        const data = await response.json();
        if (data.success) {
            console.log('✓ Record updated in cloud');
            localStorage.setItem('patientRecords', JSON.stringify(records));
            return true;
        }
    } catch (error) {
        console.error('Error updating in cloud:', error);
        localStorage.setItem('patientRecords', JSON.stringify(records));
    }
    return false;
}

// Delete record from cloud
async function deleteRecordFromCloud(id) {
    if (!isCloudEnabled) {
        return true;
    }
    
    try {
        const response = await fetch(`${API_ENDPOINTS.records}?id=${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
            console.log('✓ Record deleted from cloud');
            return true;
        }
    } catch (error) {
        console.error('Error deleting from cloud:', error);
    }
    return false;
}

// Save patients database to localStorage
function savePatients() {
    localStorage.setItem('patientsDatabase', JSON.stringify(patients));
}

// Show loading indicator
function showLoadingIndicator(message = 'Loading...') {
    let loader = document.getElementById('loadingIndicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#2a5298;color:white;padding:20px 40px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;font-size:16px;';
        document.body.appendChild(loader);
    }
    loader.textContent = message;
    loader.style.display = 'block';
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Update sync status indicator
function updateSyncStatus() {
    let statusDiv = document.getElementById('syncStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'syncStatus';
        statusDiv.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:bold;z-index:1000;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
        document.body.appendChild(statusDiv);
    }
    
    if (isCloudEnabled) {
        statusDiv.textContent = '☁️ Cloud Sync Active';
        statusDiv.style.background = '#28a745';
        statusDiv.style.color = 'white';
    } else {
        statusDiv.textContent = '💾 Local Storage Only';
        statusDiv.style.background = '#ffc107';
        statusDiv.style.color = '#333';
    }
}

// Populate patient filter dropdown in View Records tab
function populatePatientFilter() {
    const dropdown = document.getElementById('filterPatient');
    if (!dropdown) return;

    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">All Patients</option>';
    
    // Sort patients by name
    const sortedPatients = Object.values(patients).sort((a, b) =>
        a.patientName.localeCompare(b.patientName)
    );
    
    // Add patient options
    sortedPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.folderNumber;
        option.textContent = `${patient.patientName} - ${patient.folderNumber}`;
        dropdown.appendChild(option);
    });
}

// Populate patient dropdown
function populatePatientDropdown() {
    const dropdown = document.getElementById('existingPatient');
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- Select Existing Patient or Add New Below --</option>';
    
    // Sort patients by name
    const sortedPatients = Object.values(patients).sort((a, b) => 
        a.patientName.localeCompare(b.patientName)
    );
    
    // Add patient options
    sortedPatients.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.folderNumber;
        option.textContent = `${patient.patientName} - ${patient.folderNumber}`;
        dropdown.appendChild(option);
    });
}

// Update hospital filter dropdowns
function updateHospitalFilters() {
    // Get unique hospitals from records
    const hospitals = [...new Set(records.map(r => r.hospitalName))].sort();
    
    // Update filter hospital dropdown
    const filterHospital = document.getElementById('filterHospital');
    const currentFilter = filterHospital.value;
    filterHospital.innerHTML = '<option value="">All Hospitals</option>';
    hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital;
        option.textContent = hospital;
        filterHospital.appendChild(option);
    });
    filterHospital.value = currentFilter;
    
    // Update summary hospital dropdown
    const summaryHospital = document.getElementById('summaryHospital');
    const currentSummary = summaryHospital.value;
    summaryHospital.innerHTML = '<option value="">All Hospitals</option>';
    hospitals.forEach(hospital => {
        const option = document.createElement('option');
        option.value = hospital;
        option.textContent = hospital;
        summaryHospital.appendChild(option);
    });
    summaryHospital.value = currentSummary;
}

// Load patient details when selected from dropdown
function loadPatientDetails() {
    const folderNumber = document.getElementById('existingPatient').value;
    
    if (!folderNumber) {
        // Clear form if no patient selected
        document.getElementById('patientName').value = '';
        document.getElementById('folderNumber').value = '';
        return;
    }
    
    const patient = patients[folderNumber];
    if (patient) {
        document.getElementById('patientName').value = patient.patientName;
        document.getElementById('folderNumber').value = patient.folderNumber;
    }
}

// Save records to localStorage
function saveRecords() {
    localStorage.setItem('patientRecords', JSON.stringify(records));
}

// Handle service type change to show/hide dynamic fields
function handleServiceTypeChange() {
    const serviceType = document.getElementById('serviceType').value;
    const npwtSizeGroup = document.getElementById('npwtSizeGroup');
    const othersGroup = document.getElementById('othersGroup');
    const npwtSize = document.getElementById('npwtSize');
    const othersSpecify = document.getElementById('othersSpecify');

    // Reset dynamic fields
    npwtSizeGroup.style.display = 'none';
    othersGroup.style.display = 'none';
    npwtSize.removeAttribute('required');
    othersSpecify.removeAttribute('required');

    // Show relevant dynamic field
    if (serviceType === 'Negative Pressure Wound Therapy') {
        npwtSizeGroup.style.display = 'block';
        npwtSize.setAttribute('required', 'required');
    } else if (serviceType === 'Others') {
        othersGroup.style.display = 'block';
        othersSpecify.setAttribute('required', 'required');
    }
}

// Handle hospital change to show/hide other hospital field
function handleHospitalChange() {
    const hospitalName = document.getElementById('hospitalName').value;
    const otherHospitalGroup = document.getElementById('otherHospitalGroup');
    const otherHospital = document.getElementById('otherHospital');

    if (hospitalName === 'Other') {
        otherHospitalGroup.style.display = 'block';
        otherHospital.setAttribute('required', 'required');
    } else {
        otherHospitalGroup.style.display = 'none';
        otherHospital.removeAttribute('required');
        otherHospital.value = '';
    }
}

// Handle form submission
document.getElementById('patientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    showLoadingIndicator('Saving record...');
    
    const patientName = document.getElementById('patientName').value.trim();
    const folderNumber = document.getElementById('folderNumber').value.trim();
    const reviewDate = document.getElementById('reviewDate').value;
    const serviceType = document.getElementById('serviceType').value;
    const fee = parseFloat(document.getElementById('fee').value);
    const notes = document.getElementById('notes').value.trim();
    
    // Get hospital name
    let hospitalName = document.getElementById('hospitalName').value;
    if (hospitalName === 'Other') {
        hospitalName = document.getElementById('otherHospital').value.trim();
    }
    
    let serviceDetails = serviceType;
    
    // Add NPWT size if applicable
    if (serviceType === 'Negative Pressure Wound Therapy') {
        const npwtSize = document.getElementById('npwtSize').value;
        if (npwtSize) {
            serviceDetails += ` (${npwtSize})`;
        }
    }
    
    // Add Others specification if applicable
    if (serviceType === 'Others') {
        const othersSpecify = document.getElementById('othersSpecify').value.trim();
        if (othersSpecify) {
            serviceDetails = othersSpecify;
        }
    }
    
    // Create record object
    const record = {
        id: Date.now(),
        patientName,
        folderNumber,
        reviewDate,
        hospitalName,
        serviceType,
        serviceDetails,
        fee,
        notes,
        createdAt: new Date().toISOString()
    };
    
    // Add or update record
    if (editingRecordId) {
        // Update existing record
        const index = records.findIndex(r => r.id === editingRecordId);
        if (index !== -1) {
            records[index] = { ...record, id: editingRecordId };
            await updateRecordInCloud({ ...record, id: editingRecordId });
        }
        editingRecordId = null;
        cancelEdit();
    } else {
        // Add new record
        records.push(record);
        await saveRecordToCloud(record);
    }
    
    // Add patient to patients database if not already exists
    if (!patients[folderNumber]) {
        patients[folderNumber] = {
            patientName,
            folderNumber,
            firstVisit: reviewDate
        };
        savePatients();
        populatePatientDropdown();
    }
    
    // Update hospital filters
    updateHospitalFilters();
    
    hideLoadingIndicator();
    
    // Show success message
    showSuccessMessage(editingRecordId ? 'Record updated and synced to cloud!' : 'Record saved and synced to cloud!');
    
    // Reset form
    resetForm();
    
    // Update displays
    displayRecords();
    if (document.getElementById('summaryDate').value === reviewDate) {
        generateDailySummary();
    }
});

// Show success message
function showSuccessMessage(message) {
    // Create success message element if it doesn't exist
    let successMsg = document.querySelector('.success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        const form = document.getElementById('patientForm');
        form.parentNode.insertBefore(successMsg, form);
    }
    
    successMsg.textContent = message;
    successMsg.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 3000);
}

// Reset form
function resetForm() {
    document.getElementById('patientForm').reset();
    document.getElementById('existingPatient').value = '';
    setDefaultDate();
    handleServiceTypeChange();
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const tabMap = {
        'record': 'recordTab',
        'view': 'viewTab',
        'daily': 'dailyTab',
        'data': 'dataTab'
    };
    
    document.getElementById(tabMap[tabName]).classList.add('active');
    
    // Set active button
    event.target.classList.add('active');
    
    // Refresh data if viewing records or daily summary
    if (tabName === 'view') {
        displayRecords();
    } else if (tabName === 'daily') {
        generateDailySummary();
    } else if (tabName === 'data') {
        updateDataStats();
    }
}

// Display all records
function displayRecords() {
    const recordsList = document.getElementById('recordsList');
    if (!recordsList) return; // Guard against missing element
    
    const filterDateElem = document.getElementById('filterDate');
    const filterServiceElem = document.getElementById('filterService');
    const filterHospitalElem = document.getElementById('filterHospital');
    
    const filterDate = filterDateElem ? filterDateElem.value : '';
    const filterService = filterServiceElem ? filterServiceElem.value : '';
    const filterHospital = filterHospitalElem ? filterHospitalElem.value : '';
    
    let filteredRecords = records;
    
    // Apply filters
    if (filterDate) {
        filteredRecords = filteredRecords.filter(r => r.reviewDate === filterDate);
    }
    
    if (filterService) {
        filteredRecords = filteredRecords.filter(r => r.serviceType === filterService);
    }
    
    if (filterHospital) {
        filteredRecords = filteredRecords.filter(r => r.hospitalName === filterHospital);
    }
    
    // Sort by date (most recent first)
    filteredRecords = filteredRecords.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
    
    if (filteredRecords.length === 0) {
        recordsList.innerHTML = `
            <div class="no-records">
                <p>No records found.</p>
            </div>
        `;
        return;
    }
    
    recordsList.innerHTML = filteredRecords.map(record => `
        <div class="record-item">
            <div class="record-header">
                <div>
                    <div class="record-patient">${record.patientName}</div>
                    <div class="record-folder">Folder: ${record.folderNumber}</div>
                </div>
                <div class="record-actions">
                    <button class="btn btn-primary" onclick="editRecord(${record.id})" style="margin-right: 10px;">Edit</button>
                    <button class="btn btn-danger" onclick="deleteRecord(${record.id})">Delete</button>
                </div>
            </div>
            <div class="record-details">
                <div class="detail-item">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formatDate(record.reviewDate)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Hospital</span>
                    <span class="detail-value">${record.hospitalName}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">${record.serviceDetails}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fee</span>
                    <span class="detail-value fee-highlight">₦${record.fee.toLocaleString('en-NG', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            ${record.notes ? `<div class="detail-item" style="margin-top: 15px;">
                <span class="detail-label">Notes</span>
                <span class="detail-value">${record.notes}</span>
            </div>` : ''}
        </div>
    `).join('');
}

// Filter records
function filterRecords() {
    displayRecords();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterService').value = '';
    document.getElementById('filterHospital').value = '';
    displayRecords();
}

// Delete record
async function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        showLoadingIndicator('Deleting record...');
        
        // Delete from cloud first
        await deleteRecordFromCloud(id);
        
        // Then delete locally
        records = records.filter(r => r.id !== id);
        localStorage.setItem('patientRecords', JSON.stringify(records));
        
        hideLoadingIndicator();
        displayRecords();
        
        // Update daily summary if on that tab
        const summaryDate = document.getElementById('summaryDate').value;
        if (summaryDate) {
            generateDailySummary();
        }
        
        showSuccessMessage('Record deleted and synced to cloud!');
    }
}

// Generate daily summary
function generateDailySummary() {
    const summaryDate = document.getElementById('summaryDate').value;
    const summaryHospital = document.getElementById('summaryHospital').value;
    const dailySummary = document.getElementById('dailySummary');
    
    if (!summaryDate) {
        dailySummary.innerHTML = '<div class="no-records"><p>Please select a date.</p></div>';
        return;
    }
    
    let dailyRecords = records.filter(r => r.reviewDate === summaryDate);
    
    // Filter by hospital if selected
    if (summaryHospital) {
        dailyRecords = dailyRecords.filter(r => r.hospitalName === summaryHospital);
    }
    
    // Sort by patient name
    dailyRecords = dailyRecords.sort((a, b) => a.patientName.localeCompare(b.patientName));
    
    if (dailyRecords.length === 0) {
        dailySummary.innerHTML = '<div class="no-records"><p>No records found for this date' + (summaryHospital ? ' and hospital' : '') + '.</p></div>';
        return;
    }
    
    // Calculate statistics
    const totalPatients = dailyRecords.length;
    const totalRevenue = dailyRecords.reduce((sum, r) => sum + r.fee, 0);
    
    // Group by service type
    const serviceBreakdown = {};
    dailyRecords.forEach(record => {
        if (!serviceBreakdown[record.serviceType]) {
            serviceBreakdown[record.serviceType] = {
                count: 0,
                revenue: 0
            };
        }
        serviceBreakdown[record.serviceType].count++;
        serviceBreakdown[record.serviceType].revenue += record.fee;
    });
    
    // Build summary HTML
    let html = `
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-value">${totalPatients}</div>
                <div class="stat-label">Total Patients</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">₦${totalRevenue.toLocaleString('en-NG', {minimumFractionDigits: 2})}</div>
                <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Object.keys(serviceBreakdown).length}</div>
                <div class="stat-label">Service Types</div>
            </div>
        </div>
        
        <h4 style="margin-bottom: 15px; color: #2a5298;">Daily Procedures</h4>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Patient Name</th>
                    <th>Folder No.</th>
                    ${!summaryHospital ? '<th>Hospital</th>' : ''}
                    <th>Service</th>
                    <th>Fee (₦)</th>
                </tr>
            </thead>
            <tbody>
                ${dailyRecords.map(record => `
                    <tr>
                        <td>${record.patientName}</td>
                        <td>${record.folderNumber}</td>
                        ${!summaryHospital ? `<td>${record.hospitalName}</td>` : ''}
                        <td>${record.serviceDetails}</td>
                        <td>₦${record.fee.toLocaleString('en-NG', {minimumFractionDigits: 2})}</td>
                    </tr>
                `).join('')}
                <tr style="background: #2a5298; color: white; font-weight: bold;">
                    <td colspan="${!summaryHospital ? 4 : 3}" style="text-align: right;">TOTAL</td>
                    <td>₦${totalRevenue.toLocaleString('en-NG', {minimumFractionDigits: 2})}</td>
                </tr>
            </tbody>
        </table>
        
        <h4 style="margin-top: 30px; margin-bottom: 15px; color: #2a5298;">Service Breakdown</h4>
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Service Type</th>
                    <th>Count</th>
                    <th>Revenue (₦)</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(serviceBreakdown).map(([service, data]) => `
                    <tr>
                        <td>${service}</td>
                        <td>${data.count}</td>
                        <td>₦${data.revenue.toLocaleString('en-NG', {minimumFractionDigits: 2})}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    dailySummary.innerHTML = html;
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-NG', options);
}

// Print daily report
function printDailyReport() {
    window.print();
}

// Export to PDF
async function exportDailyReport() {
    const summaryDate = document.getElementById('summaryDate').value;
    const summaryHospital = document.getElementById('summaryHospital').value;
    
    if (!summaryDate) {
        alert('Please select a date first.');
        return;
    }
    
    let dailyRecords = records.filter(r => r.reviewDate === summaryDate);
    
    // Filter by hospital if selected
    if (summaryHospital) {
        dailyRecords = dailyRecords.filter(r => r.hospitalName === summaryHospital);
    }
    
    if (dailyRecords.length === 0) {
        alert('No records found for this date' + (summaryHospital ? ' and hospital' : '') + '.');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;
        
        // Determine which hospital name to display
        const hospitalForHeader = summaryHospital || (dailyRecords.length > 0 ? dailyRecords[0].hospitalName : 'Niger Foundation Hospital Enugu');
        
        // Add logo - ensure it's loaded
        if (logoDataUrl) {
            try {
                doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
                yPos += 45;
            } catch (e) {
                console.error('Error adding logo:', e);
                yPos += 5;
            }
        }
        
        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("Dr Nnadi's Surgeries, Reviews and Procedures", pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
        
        doc.setFontSize(12);
        doc.text(hospitalForHeader, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Burns Plastic and Reconstructive Surgery Services', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // Date
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Report - ' + formatDate(summaryDate), pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // Summary stats
        const totalPatients = dailyRecords.length;
        const totalRevenue = dailyRecords.reduce((sum, r) => sum + r.fee, 0);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Total Patients: ' + totalPatients, 20, yPos);
        const revenueText = 'Total Revenue: N' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        doc.text(revenueText, pageWidth - 20, yPos, { align: 'right' });
        yPos += 12;
        
        // Draw line
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;
        
        // Table header
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        
        doc.setFontSize(9);
        doc.text('Patient Name', 20, yPos);
        doc.text('Folder', 70, yPos);
        if (!summaryHospital) {
            doc.text('Hospital', 95, yPos);
            doc.text('Service', 130, yPos);
        } else {
            doc.text('Service', 100, yPos);
        }
        doc.text('Fee (N)', pageWidth - 20, yPos, { align: 'right' });
        yPos += 8;
        
        // Sort records by date
        dailyRecords = dailyRecords.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));
        
        // Prepare table data
        const tableData = dailyRecords.map(record => {
            const row = [
                record.patientName,
                record.folderNumber
            ];
            if (!summaryHospital) {
                row.push(record.hospitalName);
            }
            row.push(record.serviceDetails);
            row.push('N' + record.fee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
            return row;
        });
        
        // Table headers
        const tableHeaders = ['Patient Name', 'Folder No.'];
        if (!summaryHospital) {
            tableHeaders.push('Hospital');
        }
        tableHeaders.push('Service');
        tableHeaders.push('Fee (N)');
        
        // Use autoTable for better layout
        doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: {
                fillColor: [42, 82, 152],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 3
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: summaryHospital ? 50 : 40 },
                1: { cellWidth: summaryHospital ? 35 : 30 },
                2: { cellWidth: summaryHospital ? 60 : 35 },
                3: { cellWidth: summaryHospital ? 'auto' : 45 },
                4: { cellWidth: summaryHospital ? 'auto' : 35, halign: 'right' }
            },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            margin: { left: 15, right: 15 },
            didDrawPage: function(data) {
                // Footer on each page
                doc.setTextColor(100, 100, 100);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                const footerText = 'Generated on ' + new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        });
        
        // Get final Y position after table
        yPos = doc.lastAutoTable.finalY + 5;
        
        // Total row
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setFontSize(10);
        doc.text('TOTAL', 20, yPos + 5);
        const totalText = 'N' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        doc.text(totalText, pageWidth - 20, yPos + 5, { align: 'right' });
        
        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const footerText = 'Generated on ' + new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Save PDF
        const hospitalSlug = (summaryHospital || 'All_Hospitals').replace(/\s+/g, '_');
        doc.save('Daily_Report_' + hospitalSlug + '_' + summaryDate + '.pdf');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try using the Print option instead.');
    }
}

// Data Management Functions

// Update data statistics
function updateDataStats() {
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('totalPatients').textContent = Object.keys(patients).length;
    
    // Calculate storage size
    const dataSize = new Blob([JSON.stringify({records, patients})]).size;
    const sizeKB = (dataSize / 1024).toFixed(2);
    document.getElementById('storageUsed').textContent = sizeKB + ' KB';
}

// Export all data to file
function exportAllData() {
    const dataToExport = {
        records: records,
        patients: patients,
        exportDate: new Date().toISOString(),
        appVersion: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dr-nnadi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Backup file downloaded successfully!\n\nYou can use this file to restore data on this or another device.');
}

// Import data from file
function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            const mergeMode = document.getElementById('mergeData').checked;
            
            if (mergeMode) {
                // Merge mode - combine with existing data
                let recordsAdded = 0;
                let patientsAdded = 0;
                
                // Merge records (avoid duplicates by ID)
                const existingIds = new Set(records.map(r => r.id));
                importedData.records.forEach(record => {
                    if (!existingIds.has(record.id)) {
                        records.push(record);
                        recordsAdded++;
                    }
                });
                
                // Merge patients
                Object.keys(importedData.patients).forEach(folderNumber => {
                    if (!patients[folderNumber]) {
                        patients[folderNumber] = importedData.patients[folderNumber];
                        patientsAdded++;
                    }
                });
                
                saveRecords();
                savePatients();
                populatePatientDropdown();
                displayRecords();
                updateDataStats();
                
                alert(`Data merged successfully!\n\nRecords added: ${recordsAdded}\nPatients added: ${patientsAdded}`);
            } else {
                // Replace mode - confirm first
                if (confirm(`This will REPLACE all existing data with the imported data.\n\nCurrent records: ${records.length}\nImported records: ${importedData.records.length}\n\nAre you sure?`)) {
                    records = importedData.records;
                    patients = importedData.patients;
                    
                    saveRecords();
                    savePatients();
                    populatePatientDropdown();
                    displayRecords();
                    updateDataStats();
                    
                    alert('Data restored successfully!');
                }
            }
            
            // Reset file input
            fileInput.value = '';
            
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error importing data. Please make sure the file is a valid backup file.');
            fileInput.value = '';
        }
    };
    
    reader.readAsText(file);
}

// Delete all data
function deleteAllData() {
    const confirmation = prompt('WARNING: This will permanently delete ALL data!\n\nType "DELETE" to confirm:');
    
    if (confirmation === 'DELETE') {
        records = [];
        patients = {};
        
        localStorage.removeItem('patientRecords');
        localStorage.removeItem('patientsDatabase');
        
        populatePatientDropdown();
        displayRecords();
        updateDataStats();
        
        alert('All data has been deleted.');
        
        // Refresh the page
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else if (confirmation !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
    }
}







// Export patient history to PDF
async function exportPatientHistory() {
    const filterPatient = document.getElementById('filterPatient').value;
    
    if (!filterPatient) {
        alert('Please select a patient first.');
        return;
    }

    const patient = patients[filterPatient];
    if (!patient) {
        alert('Patient not found.');
        return;
    }

    const patientRecords = records.filter(r => r.folderNumber === filterPatient).sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));

    if (patientRecords.length === 0) {
        alert('No records found for this patient.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Add logo if available
        if (logoDataUrl) {
            try {
                doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
                yPos += 45;
            } catch (e) {
                console.error('Error adding logo:', e);
                yPos += 5;
            }
        }

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("Dr Nnadi's Surgeries, Reviews and Procedures", pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;

        doc.setFontSize(12);
        doc.text('Niger Foundation Hospital Enugu', pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Burns Plastic and Reconstructive Surgery Services', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Patient Information
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Patient History Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Patient: ' + patient.patientName, 20, yPos);
        yPos += 6;
        doc.text('Folder Number: ' + patient.folderNumber, 20, yPos);
        yPos += 6;
        doc.setFont(undefined, 'normal');
        doc.text('Total Visits: ' + patientRecords.length, 20, yPos);
        yPos += 6;
        doc.text('First Visit: ' + formatDate(patient.firstVisit), 20, yPos);
        yPos += 6;
        const latestVisit = patientRecords.length > 0 ? patientRecords[0].reviewDate : patient.firstVisit;
        doc.text('Latest Visit: ' + formatDate(latestVisit), 20, yPos);
        yPos += 6;
        const totalFees = patientRecords.reduce((sum, r) => sum + r.fee, 0);
        doc.text('Total Fees: N' + totalFees.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 20, yPos);
        yPos += 12;

        // Draw line
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;

        // Visit History
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Visit History', 20, yPos);
        yPos += 8;

        // Records
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        patientRecords.forEach((record, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }

            // Visit number
            doc.setFont(undefined, 'bold');
            doc.text(`Visit ${index + 1}`, 20, yPos);
            yPos += 5;
            
            doc.setFont(undefined, 'normal');
            doc.text('Date: ' + formatDate(record.reviewDate), 25, yPos);
            yPos += 5;
            doc.text('Hospital: ' + record.hospitalName, 25, yPos);
            yPos += 5;
            doc.text('Service: ' + record.serviceDetails, 25, yPos);
            yPos += 5;
            doc.text('Fee: N' + record.fee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 25, yPos);
            yPos += 5;
            
            if (record.notes) {
                doc.text('Notes: ' + record.notes.substring(0, 80), 25, yPos);
                yPos += 5;
                if (record.notes.length > 80) {
                    doc.text('  ' + record.notes.substring(80, 160), 25, yPos);
                    yPos += 5;
                }
            }
            
            yPos += 3;
            // Draw separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(20, yPos, pageWidth - 20, yPos);
            yPos += 6;
        });

        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const footerText = 'Generated on ' + new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save PDF
        const fileName = `Patient_History_${patient.patientName.replace(/\s+/g, '_')}_${patient.folderNumber}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please make sure you have internet connection for the PDF library.');
    }
}


// Export date range report to PDF
async function exportDateRangeReport() {
    const filterDateStart = document.getElementById('filterDateStart').value;
    const filterDateEnd = document.getElementById('filterDateEnd').value;
    const filterService = document.getElementById('filterService').value;
    const filterHospital = document.getElementById('filterHospital').value;
    const filterPatient = document.getElementById('filterPatient') ? document.getElementById('filterPatient').value : '';

    // Determine date range
    let startDate = filterDateStart;
    let endDate = filterDateEnd;
    
    if (!startDate && !endDate) {
        // If no dates specified, use all records
        if (records.length === 0) {
            alert('No records available to export.');
            return;
        }
    }

    // Filter records
    let filteredRecords = records;

    if (startDate) {
        filteredRecords = filteredRecords.filter(r => r.reviewDate >= startDate);
    }

    if (endDate) {
        filteredRecords = filteredRecords.filter(r => r.reviewDate <= endDate);
    }

    if (filterService) {
        filteredRecords = filteredRecords.filter(r => r.serviceType === filterService);
    }

    if (filterHospital) {
        filteredRecords = filteredRecords.filter(r => r.hospitalName === filterHospital);
    }

    if (filterPatient) {
        filteredRecords = filteredRecords.filter(r => r.folderNumber === filterPatient);
        // Enable export button when a patient is selected
        const exportBtn = document.getElementById('exportPatientBtn');
        if (exportBtn) exportBtn.disabled = false;
    } else {
        // Disable export button when no patient is selected
        const exportBtn = document.getElementById('exportPatientBtn');
        if (exportBtn) exportBtn.disabled = true;
    }

    if (filteredRecords.length === 0) {
        alert('No records found for the selected criteria.');
        return;
    }

    // Sort by date
    filteredRecords = filteredRecords.sort((a, b) => new Date(a.reviewDate) - new Date(b.reviewDate));

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Add logo if available
        if (logoDataUrl) {
            try {
                doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 20, yPos, 40, 40);
                yPos += 45;
            } catch (e) {
                console.error('Error adding logo:', e);
                yPos += 5;
            }
        }

        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text("Dr Nnadi's Surgeries, Reviews and Procedures", pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;

        doc.setFontSize(12);
        doc.text('Niger Foundation Hospital Enugu', pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Burns Plastic and Reconstructive Surgery Services', pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        // Report title and date range
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const dateRangeText = startDate && endDate 
            ? `Date Range Report: ${formatDate(startDate)} - ${formatDate(endDate)}`
            : startDate 
                ? `Records from ${formatDate(startDate)}`
                : endDate
                    ? `Records up to ${formatDate(endDate)}`
                    : 'All Records Report';
        doc.text(dateRangeText, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Summary statistics
        const totalPatients = new Set(filteredRecords.map(r => r.folderNumber)).size;
        const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.fee, 0);
        const totalVisits = filteredRecords.length;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Total Visits: ' + totalVisits, 20, yPos);
        yPos += 5;
        doc.text('Unique Patients: ' + totalPatients, 20, yPos);
        yPos += 5;
        doc.text('Total Revenue: N' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), 20, yPos);
        yPos += 5;

        if (filterHospital) {
            doc.text('Hospital: ' + filterHospital, 20, yPos);
            yPos += 5;
        }
        if (filterService) {
            doc.text('Service: ' + filterService, 20, yPos);
            yPos += 5;
        }
        if (filterPatient) {
            const patient = patients[filterPatient];
            if (patient) {
                doc.text('Patient: ' + patient.patientName + ' (' + filterPatient + ')', 20, yPos);
                yPos += 5;
            }
        }

        yPos += 5;

        // Draw line
        doc.setLineWidth(0.5);
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 8;

        // Table header
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

        doc.setFontSize(9);
        doc.text('Date', 20, yPos);
        doc.text('Patient', 45, yPos);
        doc.text('Folder', 85, yPos);
        if (!filterHospital) {
            doc.text('Hospital', 105, yPos);
        }
        doc.text('Service', filterHospital ? 105 : 135, yPos);
        doc.text('Fee (N)', pageWidth - 20, yPos, { align: 'right' });
        yPos += 8;

        // Prepare table data
        const tableData = filteredRecords.map(record => {
            const dateFormatted = new Date(record.reviewDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
            const row = [
                dateFormatted,
                record.patientName,
                record.folderNumber
            ];
            if (!filterHospital) {
                row.push(record.hospitalName);
            }
            row.push(record.serviceDetails);
            row.push('N' + record.fee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
            return row;
        });
        
        // Table headers
        const tableHeaders = ['Date', 'Patient', 'Folder'];
        if (!filterHospital) {
            tableHeaders.push('Hospital');
        }
        tableHeaders.push('Service');
        tableHeaders.push('Fee (N)');
        
        // Use autoTable for better layout
        doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: yPos,
            theme: 'striped',
            headStyles: {
                fillColor: [42, 82, 152],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 9
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 2.5
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: 22 },
                1: { cellWidth: filterHospital ? 40 : 35 },
                2: { cellWidth: 25 },
                3: { cellWidth: filterHospital ? 60 : 30 },
                4: { cellWidth: filterHospital ? 'auto' : 40 },
                5: { cellWidth: filterHospital ? 'auto' : 30, halign: 'right' }
            },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            margin: { left: 15, right: 15 },
            didDrawPage: function(data) {
                // Footer on each page
                doc.setTextColor(100, 100, 100);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
                const footerText = 'Generated on ' + new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        });
        
        // Get final Y position after table
        yPos = doc.lastAutoTable.finalY + 5;
        
        // Total row
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
        doc.setFontSize(10);
        doc.text('TOTAL', 20, yPos + 5);
        const totalText = 'N' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        doc.text(totalText, pageWidth - 20, yPos + 5, { align: 'right' });

        // Service breakdown section
        if (yPos < pageHeight - 60) {
            yPos += 15;
        } else {
            doc.addPage();
            yPos = 20;
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('Service Breakdown', 20, yPos);
        yPos += 8;

        // Group by service type
        const serviceBreakdown = {};
        filteredRecords.forEach(record => {
            if (!serviceBreakdown[record.serviceType]) {
                serviceBreakdown[record.serviceType] = {
                    count: 0,
                    revenue: 0
                };
            }
            serviceBreakdown[record.serviceType].count++;
            serviceBreakdown[record.serviceType].revenue += record.fee;
        });

        // Service breakdown table header
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setFontSize(9);
        doc.text('Service Type', 20, yPos);
        doc.text('Count', pageWidth / 2, yPos);
        doc.text('Revenue (N)', pageWidth - 20, yPos, { align: 'right' });
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        Object.entries(serviceBreakdown).forEach(([service, data], index) => {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
            }

            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(15, yPos - 5, pageWidth - 30, 7, 'F');
            }

            doc.setFontSize(9);
            const serviceName = service.length > 35 ? service.substring(0, 35) + '...' : service;
            doc.text(serviceName, 20, yPos);
            doc.text(data.count.toString(), pageWidth / 2, yPos);
            const revenueText = 'N' + data.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            doc.text(revenueText, pageWidth - 20, yPos, { align: 'right' });
            yPos += 7;
        });

        // Footer
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const footerText = 'Generated on ' + new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save PDF
        const dateRangeSlug = startDate && endDate 
            ? `${startDate}_to_${endDate}`
            : startDate 
                ? `from_${startDate}`
                : endDate
                    ? `to_${endDate}`
                    : 'All_Records';
        const fileName = `Date_Range_Report_${dateRangeSlug}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please make sure you have internet connection for the PDF library.');
    }
}







// Global variable to track if we're editing
let editingRecordId = null;

// Edit record
function editRecord(id) {
    const record = records.find(r => r.id === id);
    if (!record) {
        alert('Record not found.');
        return;
    }

    // Set editing mode
    editingRecordId = id;

    // Populate form with record data
    document.getElementById('patientName').value = record.patientName;
    document.getElementById('folderNumber').value = record.folderNumber;
    document.getElementById('reviewDate').value = record.reviewDate;
    document.getElementById('fee').value = record.fee || '';
    document.getElementById('notes').value = record.notes || '';

    // Set hospital
    const hospitalSelect = document.getElementById('hospitalName');
    const hospitalExists = Array.from(hospitalSelect.options).some(opt => opt.value === record.hospitalName);
    
    if (hospitalExists) {
        hospitalSelect.value = record.hospitalName;
    } else {
        hospitalSelect.value = 'Other';
        handleHospitalChange();
        document.getElementById('otherHospital').value = record.hospitalName;
    }

    // Set service type
    const serviceSelect = document.getElementById('serviceType');
    const serviceExists = Array.from(serviceSelect.options).some(opt => opt.value === record.serviceType);
    
    if (serviceExists) {
        serviceSelect.value = record.serviceType;
        handleServiceTypeChange();

        // Handle NPWT size if applicable
        if (record.serviceType === 'Negative Pressure Wound Therapy' && record.serviceDetails.includes('(')) {
            const sizeMatch = record.serviceDetails.match(/\((.*?)\)/);
            if (sizeMatch) {
                document.getElementById('npwtSize').value = sizeMatch[1];
            }
        }
    } else {
        // Must be "Others"
        serviceSelect.value = 'Others';
        handleServiceTypeChange();
        document.getElementById('othersSpecify').value = record.serviceDetails;
    }

    // Update form button text
    const submitBtn = document.querySelector('#patientForm button[type="submit"]');
    submitBtn.textContent = 'Update Record';
    submitBtn.classList.add('btn-warning');
    submitBtn.classList.remove('btn-primary');

    // Show cancel button
    let cancelBtn = document.getElementById('cancelEditBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = 'Cancel Edit';
        cancelBtn.onclick = cancelEdit;
        cancelBtn.style.marginLeft = '10px';
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
    }

    // Switch to record tab
    showTab('record');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancel edit mode
function cancelEdit() {
    editingRecordId = null;
    resetForm();
    
    // Remove cancel button
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }

    // Reset submit button
    const submitBtn = document.querySelector('#patientForm button[type="submit"]');
    submitBtn.textContent = 'Save Record';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');
}










// Sync patients database from records (ensures consistency)
function syncPatientsFromRecords() {
    let updated = false;
    
    records.forEach(record => {
        if (!patients[record.folderNumber]) {
            // Add missing patient to database
            patients[record.folderNumber] = {
                patientName: record.patientName,
                folderNumber: record.folderNumber,
                firstVisit: record.reviewDate
            };
            updated = true;
        } else {
            // Update patient name if it has changed
            if (patients[record.folderNumber].patientName !== record.patientName) {
                patients[record.folderNumber].patientName = record.patientName;
                updated = true;
            }
            // Update first visit if this record is earlier
            if (record.reviewDate < patients[record.folderNumber].firstVisit) {
                patients[record.folderNumber].firstVisit = record.reviewDate;
                updated = true;
            }
        }
    });
    
    if (updated) {
        savePatients();
        console.log('Patient database synchronized with records');
    }
}

// Online/Offline event handlers for PWA
window.addEventListener('online', async () => {
    console.log('✓ Back online!');
    updateSyncStatus();
    
    // Re-check cloud connection
    await checkCloudConnection();
    
    // Auto-sync local data to cloud
    if (isCloudEnabled && window.syncLocalDataToCloud) {
        console.log('Auto-syncing local data to cloud...');
        await syncLocalDataToCloud();
    }
});

window.addEventListener('offline', () => {
    console.log('⚠ Offline mode');
    updateSyncStatus();
});

// Update sync status indicator
function updateSyncStatus() {
    // Create status indicator if it doesn't exist
    let statusDiv = document.getElementById('syncStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'syncStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(statusDiv);
    }
    
    const isOnline = navigator.onLine;
    
    if (isOnline && isCloudEnabled) {
        statusDiv.innerHTML = '🟢 Cloud Synced';
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
    } else if (isOnline && !isCloudEnabled) {
        statusDiv.innerHTML = '🟡 Online (Local Storage)';
        statusDiv.style.backgroundColor = '#fff3cd';
        statusDiv.style.color = '#856404';
    } else {
        statusDiv.innerHTML = '🔴 Offline Mode';
        statusDiv.style.backgroundColor = '#f8d7da';
        statusDiv.style.color = '#721c24';
    }
}

// Manual sync button functionality
window.manualSync = async function() {
    if (!isCloudEnabled) {
        alert('Cloud sync is not available. Please check your connection.');
        return;
    }
    
    if (confirm('Sync all local data to cloud?\n\nThis will upload any records that exist locally but not in the cloud database.')) {
        await syncLocalDataToCloud();
    }
};


