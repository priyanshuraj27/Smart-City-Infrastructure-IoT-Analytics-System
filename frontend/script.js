// Configuration
const API_URL = 'http://localhost:5000/api';

// Data storage
let allDevices = [];
let allReadings = [];
let allAlerts = [];
let allMaintenance = [];
let allZones = [];
let pollutionChart = null;
let maintenanceChart = null;
let statusChart = null;

// Update current time
function updateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleString();
}
setInterval(updateTime, 1000);
updateTime();

// Section Navigation
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
    // Show section
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    const zonesSection = document.getElementById('zones');
    if (zonesSection) {
        zonesSection.classList.add('active');
    }
    
    // Update nav link
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
    });
    const zoneLink = document.querySelector('a[onclick*="showZones"]');
    if (zoneLink) {
        zoneLink.classList.add('active');
    }
    
    // Load zones data
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

// Refresh all data
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
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/analytics/dashboard-summary`);
        const data = await response.json();

        document.getElementById('total-devices').textContent = data.totalDevices || 0;
        document.getElementById('active-alerts').textContent = data.activeAlerts || 0;
        document.getElementById('total-maintenance').textContent = data.totalMaintenance || 0;
        
        // Convert avgMaintenanceCost to number if it's a string (MySQL returns DECIMAL as string)
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
        
        // Convert avg_income to number if it's a string
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

function showAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'block';
}

function hideAddZoneForm() {
    document.getElementById('add-zone-form').style.display = 'none';
    
    // Reset form fields instead of calling .reset()
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

    // Validate inputs
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
    try {
        const response = await fetch(`${API_URL}/devices`);
        allDevices = await response.json();
        displayDevices();
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

function displayDevices() {
    const tbody = document.getElementById('devices-tbody');
    tbody.innerHTML = '';

    allDevices.forEach(device => {
        const row = document.createElement('tr');
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
    const searchTerm = document.getElementById('device-search').value.toLowerCase();
    const tbody = document.getElementById('devices-tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function showAddDeviceForm() {
    document.getElementById('add-device-form').style.display = 'block';
}

function hideAddDeviceForm() {
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
    try {
        // Load unserviced devices
        const response1 = await fetch(`${API_URL}/analytics/unserviced-devices`);
        const unserviced = await response1.json();
        displayUnservicedDevices(unserviced);

        // Load device status chart
        const response2 = await fetch(`${API_URL}/devices`);
        const devices = await response2.json();
        loadDeviceStatusChart(devices);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
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
