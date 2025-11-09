const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all maintenance logs
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT m.*, d.type as device_type 
      FROM Maintenance m 
      LEFT JOIN Devices d ON m.device_id = d.device_id
      ORDER BY m.date DESC
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance by device
router.get('/device/:device_id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM Maintenance WHERE device_id = ? ORDER BY date DESC',
      [req.params.device_id]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance log
router.post('/', async (req, res) => {
  try {
    const { log_id, device_id, technician_name, cost, date, issue_fixed } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Maintenance (log_id, device_id, technician_name, cost, date, issue_fixed) VALUES (?, ?, ?, ?, ?, ?)',
      [log_id, device_id, technician_name, cost, date, issue_fixed]
    );
    connection.release();
    res.status(201).json({ message: 'Maintenance log created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete maintenance log by ID (must come before GET /:id to avoid routing conflicts)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM Maintenance WHERE log_id = ?', [req.params.id]);
    connection.release();
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    
    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance log by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Maintenance WHERE log_id = ?', [req.params.id]);
    connection.release();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
