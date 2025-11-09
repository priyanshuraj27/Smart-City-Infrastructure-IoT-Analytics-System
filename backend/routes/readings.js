const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all readings
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.*, d.type as device_type 
      FROM Readings r 
      LEFT JOIN Devices d ON r.device_id = d.device_id
      ORDER BY r.timestamp DESC
      LIMIT 100
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get readings by device
router.get('/device/:device_id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM Readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 50',
      [req.params.device_id]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reading
router.post('/', async (req, res) => {
  try {
    const { reading_id, device_id, reading_type, value, timestamp } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Readings (reading_id, device_id, reading_type, value, timestamp) VALUES (?, ?, ?, ?, ?)',
      [reading_id, device_id, reading_type, value, timestamp]
    );
    connection.release();
    res.status(201).json({ message: 'Reading created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete reading by ID (must come before GET /:id to avoid routing conflicts)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM Readings WHERE reading_id = ?', [req.params.id]);
    connection.release();
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    
    res.json({ message: 'Reading deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reading by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Readings WHERE reading_id = ?', [req.params.id]);
    connection.release();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
