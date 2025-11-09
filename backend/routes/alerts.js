const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT a.*, d.type as device_type 
      FROM Alerts a 
      LEFT JOIN Devices d ON a.device_id = d.device_id
      ORDER BY a.alert_time DESC
      LIMIT 100
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active alerts
router.get('/active', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM Alerts WHERE resolved = 0 ORDER BY alert_time DESC'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create alert
router.post('/', async (req, res) => {
  try {
    const { alert_id, device_id, alert_type, severity, alert_time, resolved } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Alerts (alert_id, device_id, alert_type, severity, alert_time, resolved) VALUES (?, ?, ?, ?, ?, ?)',
      [alert_id, device_id, alert_type, severity, alert_time, resolved || 0]
    );
    connection.release();
    res.status(201).json({ message: 'Alert created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert by ID (must come before GET /:id to avoid routing conflicts)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM Alerts WHERE alert_id = ?', [req.params.id]);
    connection.release();
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Alerts WHERE alert_id = ?', [req.params.id]);
    connection.release();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
