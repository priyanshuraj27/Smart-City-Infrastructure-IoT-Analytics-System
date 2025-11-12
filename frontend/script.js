const API_URL = 'http://localhost:5000/api';

// Global variables to store fetched data
let allDevices = [];
let allReadings = [];
let allAlerts = [];
let allMaintenance = [];
let allZones = [];
let pollutionChart = null;
let maintenanceChart = null;
let statusChart = null;
let alertsByZoneChart = null;
let topDevicesChart = null;

// Hold the last-fetched analytics data so export buttons can use it
let analyticsTopDevicesData = [];
let analyticsAlertsByZoneData = [];

// Display current time in the header (updates every second)
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

// Handle navigation between different dashboard sections
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
}

function showDashboard() {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.nav-link')[0].classList.add('active');
    loadDashboard();
}

function showDevices() {
    showSection('devices');
    loadDevices();
}

function showZones() {
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    const zonesSection = document.getElementById('zones');
    if (zonesSection) {
        zonesSection.classList.add('active');
    }
    
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
    });
    const zoneLink = document.querySelector('a[onclick*="showZones"]');
    if (zoneLink) {
        zoneLink.classList.add('active');
    }
    
    loadZones();
}

function showReadings() {
    showSection('readings');
    loadReadings();
}

function showAlerts() {
    showSection('alerts');
    loadAlerts();
}

function showMaintenance() {
    showSection('maintenance');
    loadMaintenance();
}

function showAnalytics() {
    showSection('analytics');
    loadAnalytics();
}

// Reload all data from the server
function refreshData() {
    loadDashboard();
    loadDevices();
    loadReadings();
    loadAlerts();
    loadMaintenance();
    loadZones();
    alert('Data refreshed successfully!');
}

// ============ DASHBOARD ============
// Load and display key performance indicators (KPIs) and charts
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/analytics/dashboard-summary`);
        const data = await response.json();

        document.getElementById('total-devices').textContent = data.totalDevices || 0;
        document.getElementById('active-alerts').textContent = data.activeAlerts || 0;
        document.getElementById('total-maintenance').textContent = data.totalMaintenance || 0;
        
        // MySQL returns DECIMAL fields as strings, so we need to convert to number
        const avgCost = typeof data.avgMaintenanceCost === 'string' 
            ? parseFloat(data.avgMaintenanceCost) 
            : data.avgMaintenanceCost;
        document.getElementById('avg-cost').textContent = '$' + ((avgCost || 0).toFixed(2));

        loadPollutionChart();
        loadMaintenanceChart();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadPollutionChart() {
    try {
        const response = await fetch(`${API_URL}/analytics/top-polluted-zones`);
        const data = await response.json();

        const ctx = document.getElementById('pollutionChart').getContext('2d');
        
        if (pollutionChart) {
            pollutionChart.destroy();
        }

        pollutionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.name),
                datasets: [{
                    label: 'Average Pollution Level',
                    data: data.map(item => item.avg_pollution),
                    backgroundColor: 'rgba(255, 107, 107, 0.8)',
                    borderColor: 'rgba(255, 107, 107, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        console.error('Error loading pollution chart:', error);
    }
}

async function loadMaintenanceChart() {
    try {
        const response = await fetch(`${API_URL}/analytics/maintenance-by-zone`);
        const data = await response.json();

        const ctx = document.getElementById('maintenanceChart').getContext('2d');
        
        if (maintenanceChart) {
            maintenanceChart.destroy();
        }

        maintenanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((item, idx) => `${item.zone}-M${item.month}`),
                datasets: [{
                    label: 'Total Cost ($)',
                    data: data.map(item => item.total_cost),
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true }
                }
            }
        });
    } catch (error) {
        console.error('Error loading maintenance chart:', error);
    }
}

// ============ ZONES ============
async function loadZones() {
    try {
        const response = await fetch(`${API_URL}/zones`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allZones = data;
        displayZones();
        
    } catch (error) {
        console.error('Error loading zones:', error);
    }
}

function displayZones() {
    const tbody = document.getElementById('zones-tbody');
    
    if (!tbody) {
        console.error('zones-tbody element not found');
        return;
    }
    
    tbody.innerHTML = '';

    if (!allZones || allZones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No zones found</td></tr>';
        return;
    }
    
    allZones.forEach((zone) => {
        const row = document.createElement('tr');
        
        // MySQL returns DECIMAL fields as strings, so we convert to number for formatting
        const avgIncome = typeof zone.avg_income === 'string' 
            ? parseFloat(zone.avg_income) 
            : zone.avg_income;
        
        row.innerHTML = `
            <td>${zone.zone_id}</td>
            <td>${zone.name}</td>
            <td>${zone.population}</td>
            <td>$${(avgIncome || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteZone(${zone.zone_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ----------------- Authentication helpers (frontend-only) -----------------
function showLoginForm() {
    const m = document.getElementById('login-modal'); if (m) m.style.display = 'flex';
}

function hideLoginForm() { const m = document.getElementById('login-modal'); if (m) m.style.display = 'none'; }

function showSignupForm() { const m = document.getElementById('signup-modal'); if (m) m.style.display = 'flex'; }
function hideSignupForm() { const m = document.getElementById('signup-modal'); if (m) m.style.display = 'none'; }

async function signupUser(event) {
    event.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { alert('Please fill all fields'); return; }
    try {
        const resp = await fetch(`${API_URL}/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
        const data = await resp.json();
        if (resp.ok) { alert('Account created. You can now log in.'); hideSignupForm(); showLoginForm(); }
        else alert('Signup error: ' + (data.error || JSON.stringify(data)));
    } catch (err) { alert('Signup failed: ' + err.message); }
}

async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) { alert('Please enter email and password'); return; }
    try {
        const resp = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await resp.json();
        if (resp.ok && data.token) {
            localStorage.setItem('authToken', data.token);
            if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
            hideLoginForm(); updateAuthUI(); alert('Logged in');
        } else {
            alert('Login failed: ' + (data.error || JSON.stringify(data)));
        }
    } catch (err) { alert('Login failed: ' + err.message); }
}

function logout() { localStorage.removeItem('authToken'); localStorage.removeItem('authUser'); updateAuthUI(); }

function getAuthHeaders() { const token = localStorage.getItem('authToken'); return token ? { Authorization: 'Bearer ' + token } : {}; }

function updateAuthUI() {
    const authArea = document.getElementById('auth-area');
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('authUser');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!authArea) return;
    if (token && user) {
        authArea.innerHTML = `<span style="margin-right:8px">Hi, ${String(user.name || user.email || 'User').replace(/[<>"'`]/g,'')}</span><button class="btn btn-secondary" onclick="logout()">Logout</button>`;
    } else {
        authArea.innerHTML = `<button class="btn btn-secondary" id="btn-login" onclick="showLoginForm()">Login</button>`;
    }
}

// Initialize auth UI after script load
try { updateAuthUI(); } catch (e) { /* ignore if DOM not ready */ }

function showAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'block';
}

function hideAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'none';
    
    // Clear all form fields
    document.getElementById('zone-id').value = '';
    document.getElementById('zone-name').value = '';
    document.getElementById('zone-population').value = '';
    document.getElementById('zone-income').value = '';
}

async function addZone(event) {
    event.preventDefault();

    const zoneId = document.getElementById('zone-id').value;
    const zoneName = document.getElementById('zone-name').value;
    const population = document.getElementById('zone-population').value;
    const avgIncome = document.getElementById('zone-income').value;

    // Check that all required fields are filled
    if (!zoneId || !zoneName || !population || !avgIncome) {
        alert('Please fill all fields');
        return;
    }

    const zoneData = {
        zone_id: parseInt(zoneId),
        name: zoneName,
        population: parseInt(population),
        avg_income: parseFloat(avgIncome)
    };

    try {
        const response = await fetch(`${API_URL}/zones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(zoneData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Zone added successfully!');
            hideAddZoneForm();
            loadZones();
        } else {
            alert('Error: ' + (result.error || 'Could not add zone'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteZone(zoneId) {
    if (confirm('Are you sure you want to delete Zone ID ' + zoneId + '?')) {
        try {
            const response = await fetch(`${API_URL}/zones/${zoneId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Zone deleted successfully!');
                loadZones();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Could not delete zone'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ============ DEVICES ============
async function loadDevices() {
    // Fetch all registered devices from the API
    try {
        const response = await fetch(`${API_URL}/devices`);
        allDevices = await response.json();
        displayDevices();
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

function displayDevices() {
    // Render all devices in the table with formatted status badges
    const tbody = document.getElementById('devices-tbody');
    tbody.innerHTML = '';

    allDevices.forEach(device => {
        const row = document.createElement('tr');
        // Color-code device status: green for active, red for inactive, yellow for maintenance
        const statusClass = device.status === 'Active' ? 'badge-active' : device.status === 'Inactive' ? 'badge-inactive' : 'badge-maintenance';
        row.innerHTML = `
            <td>${device.device_id}</td>
            <td>${device.type}</td>
            <td>${device.zone_name || device.zone_id}</td>
            <td>${new Date(device.install_date).toLocaleDateString()}</td>
            <td><span class="badge ${statusClass}">${device.status}</span></td>
            <td>
                <button class="btn btn-danger" onclick="deleteDevice(${device.device_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterDevices() {
    // Search devices in real-time as user types in the search box
    const searchTerm = document.getElementById('device-search').value.toLowerCase();
    const tbody = document.getElementById('devices-tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        // Show or hide rows based on whether they match the search term
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function showAddDeviceForm() {
    // Display the add device form modal
    document.getElementById('add-device-form').style.display = 'block';
}

function hideAddDeviceForm() {
    // Hide the add device form modal and clear all input fields
    document.getElementById('add-device-form').style.display = 'none';
    document.getElementById('device-id').value = '';
    document.getElementById('device-type').value = '';
    document.getElementById('device-zone').value = '';
    document.getElementById('device-date').value = '';
    document.getElementById('device-status').value = '';
}

async function addDevice(event) {
    event.preventDefault();

    const deviceData = {
        device_id: document.getElementById('device-id').value,
        type: document.getElementById('device-type').value,
        zone_id: document.getElementById('device-zone').value,
        install_date: document.getElementById('device-date').value,
        status: document.getElementById('device-status').value
    };

    try {
        const response = await fetch(`${API_URL}/devices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deviceData)
        });

        if (response.ok) {
            alert('Device added successfully!');
            hideAddDeviceForm();
            loadDevices();
        } else {
            alert('Error adding device');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteDevice(deviceId) {
    if (confirm('Are you sure you want to delete Device ID ' + deviceId + '?')) {
        try {
            const response = await fetch(`${API_URL}/devices/${deviceId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Device deleted successfully!');
                loadDevices();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Could not delete device'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ============ READINGS ============
async function loadReadings() {
    try {
        const response = await fetch(`${API_URL}/readings`);
        allReadings = await response.json();
        displayReadings();
    } catch (error) {
        console.error('Error loading readings:', error);
    }
}

function displayReadings() {
    const tbody = document.getElementById('readings-tbody');
    tbody.innerHTML = '';

    allReadings.forEach(reading => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reading.reading_id}</td>
            <td>${reading.device_id}</td>
            <td>${reading.reading_type}</td>
            <td>${reading.value}</td>
            <td>${new Date(reading.timestamp).toLocaleString()}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteReading(${reading.reading_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterReadings() {
    const filterType = document.getElementById('reading-filter').value;
    const tbody = document.getElementById('readings-tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const type = row.cells[2].textContent;
        row.style.display = filterType === '' || type === filterType ? '' : 'none';
    });
}

function showAddReadingForm() {
    document.getElementById('add-reading-form').style.display = 'block';
}

function hideAddReadingForm() {
    document.getElementById('add-reading-form').style.display = 'none';
    document.getElementById('reading-id').value = '';
    document.getElementById('reading-device').value = '';
    document.getElementById('reading-type').value = '';
    document.getElementById('reading-value').value = '';
    document.getElementById('reading-timestamp').value = '';
}

async function addReading(event) {
    event.preventDefault();

    const readingData = {
        reading_id: document.getElementById('reading-id').value,
        device_id: document.getElementById('reading-device').value,
        reading_type: document.getElementById('reading-type').value,
        value: document.getElementById('reading-value').value,
        timestamp: document.getElementById('reading-timestamp').value
    };

    try {
        const response = await fetch(`${API_URL}/readings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(readingData)
        });

        if (response.ok) {
            alert('Reading added successfully!');
            hideAddReadingForm();
            loadReadings();
        } else {
            alert('Error adding reading');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteReading(readingId) {
    if (confirm('Are you sure you want to delete Reading ID ' + readingId + '?')) {
        try {
            const response = await fetch(`${API_URL}/readings/${readingId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Reading deleted successfully!');
                loadReadings();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Could not delete reading'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ============ ALERTS ============
async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/alerts`);
        allAlerts = await response.json();
        displayAlerts();
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

function displayAlerts() {
    const tbody = document.getElementById('alerts-tbody');
    tbody.innerHTML = '';

    allAlerts.forEach(alert => {
        const row = document.createElement('tr');
        const statusBadge = alert.resolved ? 'badge-resolved' : 'badge-active';
        const severityClass = 'badge-' + alert.severity.toLowerCase();
        row.innerHTML = `
            <td>${alert.alert_id}</td>
            <td>${alert.device_id}</td>
            <td>${alert.alert_type}</td>
            <td><span class="badge ${severityClass}">${alert.severity}</span></td>
            <td>${new Date(alert.alert_time).toLocaleString()}</td>
            <td><span class="badge ${statusBadge}">${alert.resolved ? 'Resolved' : 'Active'}</span></td>
            <td>
                <button class="btn btn-danger" onclick="deleteAlert(${alert.alert_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterAlerts() {
    const filterStatus = document.getElementById('alert-filter').value;
    const tbody = document.getElementById('alerts-tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const status = row.cells[5].textContent;
        const isResolved = status.includes('Resolved');
        const matches = filterStatus === '' || 
                       (filterStatus === '0' && !isResolved) || 
                       (filterStatus === '1' && isResolved);
        row.style.display = matches ? '' : 'none';
    });
}

function showAddAlertForm() {
    document.getElementById('add-alert-form').style.display = 'block';
}

function hideAddAlertForm() {
    document.getElementById('add-alert-form').style.display = 'none';
    document.getElementById('alert-id').value = '';
    document.getElementById('alert-device').value = '';
    document.getElementById('alert-type').value = '';
    document.getElementById('alert-severity').value = '';
    document.getElementById('alert-time').value = '';
}

async function addAlert(event) {
    event.preventDefault();

    const alertData = {
        alert_id: document.getElementById('alert-id').value,
        device_id: document.getElementById('alert-device').value,
        alert_type: document.getElementById('alert-type').value,
        severity: document.getElementById('alert-severity').value,
        alert_time: document.getElementById('alert-time').value,
        resolved: 0
    };

    try {
        const response = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertData)
        });

        if (response.ok) {
            alert('Alert created successfully!');
            hideAddAlertForm();
            loadAlerts();
        } else {
            alert('Error creating alert');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteAlert(alertId) {
    if (confirm('Are you sure you want to delete Alert ID ' + alertId + '?')) {
        try {
            const response = await fetch(`${API_URL}/alerts/${alertId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Alert deleted successfully!');
                loadAlerts();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Could not delete alert'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ============ MAINTENANCE ============
async function loadMaintenance() {
    try {
        const response = await fetch(`${API_URL}/maintenance`);
        allMaintenance = await response.json();
        displayMaintenance();
    } catch (error) {
        console.error('Error loading maintenance:', error);
    }
}

function displayMaintenance() {
    const tbody = document.getElementById('maintenance-tbody');
    tbody.innerHTML = '';

    allMaintenance.forEach(log => {
        const row = document.createElement('tr');
        
        // Convert cost to number if it's a string
        const cost = typeof log.cost === 'string' 
            ? parseFloat(log.cost) 
            : log.cost;
        
        row.innerHTML = `
            <td>${log.log_id}</td>
            <td>${log.device_id}</td>
            <td>${log.technician_name}</td>
            <td>$${(cost || 0).toFixed(2)}</td>
            <td>${new Date(log.date).toLocaleDateString()}</td>
            <td>${log.issue_fixed}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteMaintenance(${log.log_id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddMaintenanceForm() {
    document.getElementById('add-maintenance-form').style.display = 'block';
}

function hideAddMaintenanceForm() {
    document.getElementById('add-maintenance-form').style.display = 'none';
    document.getElementById('maintenance-id').value = '';
    document.getElementById('maintenance-device').value = '';
    document.getElementById('maintenance-technician').value = '';
    document.getElementById('maintenance-cost').value = '';
    document.getElementById('maintenance-date').value = '';
    document.getElementById('maintenance-issue').value = '';
}

async function addMaintenance(event) {
    event.preventDefault();

    const maintenanceData = {
        log_id: document.getElementById('maintenance-id').value,
        device_id: document.getElementById('maintenance-device').value,
        technician_name: document.getElementById('maintenance-technician').value,
        cost: document.getElementById('maintenance-cost').value,
        date: document.getElementById('maintenance-date').value,
        issue_fixed: document.getElementById('maintenance-issue').value
    };

    try {
        const response = await fetch(`${API_URL}/maintenance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(maintenanceData)
        });

        if (response.ok) {
            alert('Maintenance log added successfully!');
            hideAddMaintenanceForm();
            loadMaintenance();
        } else {
            alert('Error adding maintenance log');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteMaintenance(logId) {
    if (confirm('Are you sure you want to delete Maintenance Log ID ' + logId + '?')) {
        try {
            const response = await fetch(`${API_URL}/maintenance/${logId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Maintenance log deleted successfully!');
                loadMaintenance();
            } else {
                const error = await response.json();
                alert('Error: ' + (error.error || 'Could not delete maintenance log'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// ============ ANALYTICS ============
async function loadAnalytics() {
    // Load and display analytics: unserviced devices, device status, and additional lists
    try {
        // Devices with unresolved alerts that require service
        const respUnserviced = await fetch(`${API_URL}/analytics/unserviced-devices`);
        const unserviced = await respUnserviced.json();
        displayUnservicedDevices(unserviced);

        // Device status distribution (doughnut chart)
        const respDevices = await fetch(`${API_URL}/devices`);
        const devices = await respDevices.json();
        loadDeviceStatusChart(devices);

    // Top devices by reading count
    const respTopDevices = await fetch(`${API_URL}/analytics/top-devices-by-readings`);
    const topDevices = await respTopDevices.json();
    analyticsTopDevicesData = topDevices;
    displayTopDevices(topDevices);
    renderTopDevicesChart(topDevices);

        // Alerts aggregated by zone
    const respAlertsZone = await fetch(`${API_URL}/analytics/alerts-by-zone`);
    const alertsByZone = await respAlertsZone.json();
    analyticsAlertsByZoneData = alertsByZone;
    displayAlertsByZone(alertsByZone);
    renderAlertsByZoneChart(alertsByZone);

        // Average maintenance cost per zone
        const respAvgCost = await fetch(`${API_URL}/analytics/avg-cost-per-zone`);
        const avgCostPerZone = await respAvgCost.json();
        displayAvgCostPerZone(avgCostPerZone);

        // Devices needing replacement
        const respReplacement = await fetch(`${API_URL}/analytics/devices-needing-replacement`);
        const replacementDevices = await respReplacement.json();
        displayDevicesNeedingReplacement(replacementDevices);

    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Convert array of objects to CSV and trigger download
function exportCSV(dataArray, filename = 'export.csv') {
    if (!dataArray || dataArray.length === 0) {
        alert('No data to export');
        return;
    }

    const headers = Object.keys(dataArray[0]);
    const csvRows = [headers.join(',')];

    dataArray.forEach(row => {
        const values = headers.map(h => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            // Escape double quotes
            return `"${val.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Render bar chart for alerts by zone
function renderAlertsByZoneChart(rows) {
    const ctx = document.getElementById('canvas-alerts-by-zone');
    if (!ctx) return;

    const labels = rows.map(r => r.zone);
    const values = rows.map(r => r.alert_count);

    if (alertsByZoneChart) alertsByZoneChart.destroy();

    alertsByZoneChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Alerts by Zone',
                data: values,
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
}

// Render horizontal bar chart for top devices
function renderTopDevicesChart(devices) {
    const ctx = document.getElementById('canvas-top-devices');
    if (!ctx) return;

    const labels = devices.map(d => `#${d.device_id}`);
    const values = devices.map(d => d.readings_count);

    if (topDevicesChart) topDevicesChart.destroy();

    topDevicesChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Readings count',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.7)'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true
        }
    });
}

// Helper wrappers wired to Export buttons
function exportTopDevicesCSV() {
    exportCSV(analyticsTopDevicesData, 'top-devices.csv');
}

function exportAlertsByZoneCSV() {
    exportCSV(analyticsAlertsByZoneData, 'alerts-by-zone.csv');
}

function displayUnservicedDevices(devices) {
    const container = document.getElementById('unserviced-devices');
    container.innerHTML = '';

    if (devices.length === 0) {
        container.innerHTML = '<p>All devices with alerts have been serviced!</p>';
        return;
    }

    devices.forEach(device => {
        const item = document.createElement('div');
        item.className = 'device-item';
        item.style.padding = '10px';
        item.style.borderBottom = '1px solid #eee';
        item.innerHTML = `
            <span>Device #${device.device_id} - ${device.type}</span>
            <span style="float:right; color:#999; font-size:12px">${device.alert_count} alerts</span>
        `;
        container.appendChild(item);
    });
}

// Render helpers for new analytics endpoints
function displayTopDevices(devices) {
    const container = document.getElementById('top-devices');
    if (!container) return;
    container.innerHTML = '';
    if (!devices || devices.length === 0) {
        container.innerHTML = '<p>No top devices available</p>';
        return;
    }

    const list = document.createElement('ol');
    devices.forEach(d => {
        const item = document.createElement('li');
        item.textContent = `Device ${d.device_id} (${d.type}) — readings: ${d.readings_count}, avg: ${Number(d.avg_value).toFixed(2)}`;
        list.appendChild(item);
    });
    container.appendChild(list);
}

function displayAlertsByZone(rows) {
    const container = document.getElementById('alerts-by-zone');
    if (!container) return;
    container.innerHTML = '';
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p>No alerts data</p>';
        return;
    }

    const list = document.createElement('ul');
    rows.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.zone} — ${r.alert_count} alerts`;
        list.appendChild(li);
    });
    container.appendChild(list);
}

function displayAvgCostPerZone(rows) {
    const container = document.getElementById('avg-cost-per-zone');
    if (!container) return;
    container.innerHTML = '';
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p>No cost data</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'simple-table';
    table.innerHTML = `<tr><th>Zone</th><th>Avg Cost ($)</th></tr>`;
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.zone}</td><td>${Number(r.avg_cost).toFixed(2)}</td>`;
        table.appendChild(tr);
    });
    container.appendChild(table);
}

function displayDevicesNeedingReplacement(rows) {
    const container = document.getElementById('devices-needing-replacement');
    if (!container) return;
    container.innerHTML = '';
    if (!rows || rows.length === 0) {
        container.innerHTML = '<p>No devices need replacement</p>';
        return;
    }

    const list = document.createElement('ol');
    rows.forEach(d => {
        const li = document.createElement('li');
        li.textContent = `Device ${d.device_id} (${d.type}) — age: ${d.age_years} yrs, avg maintenance: $${Number(d.avg_maintenance_cost).toFixed(2)}`;
        list.appendChild(li);
    });
    container.appendChild(list);
}

function loadDeviceStatusChart(devices) {
    const statusCount = {
        'Active': 0,
        'Inactive': 0,
        'Maintenance': 0
    };

    devices.forEach(device => {
        if (statusCount[device.status] !== undefined) {
            statusCount[device.status]++;
        }
    });

    const ctx = document.getElementById('statusChart').getContext('2d');
    
    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Inactive', 'Maintenance'],
            datasets: [{
                data: [statusCount['Active'], statusCount['Inactive'], statusCount['Maintenance']],
                backgroundColor: [
                    'rgba(81, 207, 102, 0.8)',
                    'rgba(255, 107, 107, 0.8)',
                    'rgba(255, 193, 7, 0.8)'
                ],
                borderColor: [
                    'rgba(81, 207, 102, 1)',
                    'rgba(255, 107, 107, 1)',
                    'rgba(255, 193, 7, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'bottom' }
            }
        }
    });
}
