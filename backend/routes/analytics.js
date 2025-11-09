const express = require('express');
const router = express.Router();
const pool = require('../db');

// Top polluted zones (last 30 days)
router.get('/top-polluted-zones', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT z.name, AVG(r.value) AS avg_pollution
      FROM Readings r
      JOIN Devices d ON r.device_id = d.device_id
      JOIN Zones z ON d.zone_id = z.zone_id
      WHERE r.reading_type = 'AirQuality' 
        AND r.timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY z.name
      ORDER BY avg_pollution DESC
      LIMIT 5
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inactive devices
router.get('/inactive-devices', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT type, COUNT(*) AS count FROM Devices WHERE status = "Inactive" GROUP BY type'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Devices with alerts but no maintenance
router.get('/unserviced-devices', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT DISTINCT d.device_id, d.type
      FROM Devices d
      JOIN Alerts a ON d.device_id = a.device_id
      WHERE d.device_id NOT IN (SELECT device_id FROM Maintenance)
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly maintenance costs by zone
router.get('/maintenance-by-zone', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT z.name AS zone, 
             MONTH(m.date) AS month, 
             SUM(m.cost) AS total_cost
      FROM Maintenance m
      JOIN Devices d ON m.device_id = d.device_id
      JOIN Zones z ON d.zone_id = z.zone_id
      GROUP BY z.name, MONTH(m.date)
      ORDER BY total_cost DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard summary
router.get('/dashboard-summary', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const [totalDevices] = await connection.query('SELECT COUNT(*) as count FROM Devices');
    const [activeAlerts] = await connection.query('SELECT COUNT(*) as count FROM Alerts WHERE resolved = 0');
    const [totalMaintenance] = await connection.query('SELECT COUNT(*) as count FROM Maintenance');
    const [avgCost] = await connection.query('SELECT AVG(cost) as avg FROM Maintenance');
    
    connection.release();
    
    res.json({
      totalDevices: totalDevices[0].count,
      activeAlerts: activeAlerts[0].count,
      totalMaintenance: totalMaintenance[0].count,
      avgMaintenanceCost: avgCost[0].avg || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
