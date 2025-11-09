// Quick test to check API connectivity
console.log('🧪 Testing Smart City API...');

const API_URL = 'http://localhost:5000/api';

// Test zones endpoint
console.log('📍 Testing: GET /api/zones');
fetch(`${API_URL}/zones`)
    .then(response => {
        console.log('Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Zones Response:', data);
    })
    .catch(error => {
        console.error('❌ Zones Error:', error);
    });

// Test devices endpoint
console.log('🔧 Testing: GET /api/devices');
fetch(`${API_URL}/devices`)
    .then(response => response.json())
    .then(data => {
        console.log('✅ Devices Response:', data.length, 'devices');
    })
    .catch(error => {
        console.error('❌ Devices Error:', error);
    });

// Test health endpoint
console.log('❤️ Testing: GET /api/health');
fetch(`${API_URL}/health`)
    .then(response => response.json())
    .then(data => {
        console.log('✅ Health Response:', data);
    })
    .catch(error => {
        console.error('❌ Health Error:', error);
    });
