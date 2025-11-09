const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const deviceRoutes = require('./routes/devices');
const readingRoutes = require('./routes/readings');
const alertRoutes = require('./routes/alerts');
const maintenanceRoutes = require('./routes/maintenance');
const zoneRoutes = require('./routes/zones');
const analyticsRoutes = require('./routes/analytics');

// Use routes
app.use('/api/devices', deviceRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Smart City API running on http://localhost:${PORT}`);
});
