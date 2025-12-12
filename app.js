// Initialize application
let records = [];
let patients = {}; // Store unique patients by folder number
let logoDataUrl = null;

// Load records from localStorage on startup
window.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    loadPatients();
    populatePatientDropdown();
    updateHospitalFilters();
    displayRecords();
    setDefaultDate();
    // Load logo after a short delay to ensure DOM is ready
    setTimeout(loadLogo, 100);
});

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

// Load records from localStorage
function loadRecords() {
    const stored = localStorage.getItem('patientRecords');
    if (stored) {
        records = JSON.parse(stored);
    }
}

// Load patients database from localStorage
function loadPatients() {
    const stored = localStorage.getItem('patientsDatabase');
    if (stored) {
        patients = JSON.parse(stored);
    }
}

// Save patients database to localStorage
function savePatients() {
    localStorage.setItem('patientsDatabase', JSON.stringify(patients));
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
document.getElementById('patientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
    
    // Add to records array
    records.unshift(record);
    saveRecords();
    
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
    
    // Show success message
    showSuccessMessage('Record saved successfully!');
    
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
    const filterDate = document.getElementById('filterDate').value;
    const filterService = document.getElementById('filterService').value;
    const filterHospital = document.getElementById('filterHospital').value;
    
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
function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        records = records.filter(r => r.id !== id);
        saveRecords();
        displayRecords();
        
        // Update daily summary if on that tab
        const summaryDate = document.getElementById('summaryDate').value;
        if (summaryDate) {
            generateDailySummary();
        }
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
        
        // Table rows
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        
        dailyRecords.forEach((record, index) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
                
                // Repeat header on new page
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
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);
            }
            
            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(15, yPos - 5, pageWidth - 30, 7, 'F');
            }
            
            doc.setFontSize(9);
            // Truncate text to fit
            const patientName = record.patientName.length > 18 ? record.patientName.substring(0, 18) + '...' : record.patientName;
            const folderNum = record.folderNumber.length > 10 ? record.folderNumber.substring(0, 10) : record.folderNumber;
            
            doc.text(patientName, 20, yPos);
            doc.text(folderNum, 70, yPos);
            
            if (!summaryHospital) {
                const hospitalShort = record.hospitalName.length > 15 ? record.hospitalName.substring(0, 15) + '...' : record.hospitalName;
                doc.text(hospitalShort, 95, yPos);
                const service = record.serviceDetails.length > 20 ? record.serviceDetails.substring(0, 20) + '...' : record.serviceDetails;
                doc.text(service, 130, yPos);
            } else {
                const service = record.serviceDetails.length > 25 ? record.serviceDetails.substring(0, 25) + '...' : record.serviceDetails;
                doc.text(service, 100, yPos);
            }
            
            // Format fee properly
            const feeText = 'N' + record.fee.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            doc.text(feeText, pageWidth - 20, yPos, { align: 'right' });
            yPos += 7;
        });
        
        // Total row
        yPos += 3;
        doc.setFont(undefined, 'bold');
        doc.setFillColor(42, 82, 152);
        doc.setTextColor(255, 255, 255);
        doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
        doc.setFontSize(10);
        doc.text('TOTAL', summaryHospital ? 100 : 130, yPos);
        const totalText = 'N' + totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        doc.text(totalText, pageWidth - 20, yPos, { align: 'right' });
        
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
