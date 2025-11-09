const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all devices
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT d.*, z.name as zone_name 
      FROM Devices d 
      LEFT JOIN Zones z ON d.zone_id = z.zone_id
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get devices by zone
router.get('/zone/:zone_id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM Devices WHERE zone_id = ?',
      [req.params.zone_id]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create device
router.post('/', async (req, res) => {
  try {
    const { device_id, type, zone_id, install_date, status } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Devices (device_id, type, zone_id, install_date, status) VALUES (?, ?, ?, ?, ?)',
      [device_id, type, zone_id, install_date, status]
    );
    connection.release();
    res.status(201).json({ message: 'Device created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete device by ID (must come before GET /:id to avoid routing conflicts)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM Devices WHERE device_id = ?', [req.params.id]);
    connection.release();
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Devices WHERE device_id = ?', [req.params.id]);
    connection.release();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
