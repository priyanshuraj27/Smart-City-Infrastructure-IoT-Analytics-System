const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all zones
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Zones ORDER BY zone_id');
    connection.release();
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching zones:', error.message);
    res.status(500).json({ error: 'Failed to fetch zones: ' + error.message });
  }
});

// Create new zone
router.post('/', async (req, res) => {
  try {
    const { zone_id, name, population, avg_income } = req.body;
    
    // Validate input
    if (!zone_id || !name || population === undefined || avg_income === undefined) {
      return res.status(400).json({ error: 'Missing required fields: zone_id, name, population, avg_income' });
    }
    
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO Zones (zone_id, name, population, avg_income) VALUES (?, ?, ?, ?)',
      [zone_id, name, population, avg_income]
    );
    connection.release();
    
    res.status(201).json({ message: 'Zone created successfully', zone_id });
  } catch (error) {
    console.error('Error creating zone:', error.message);
    
    // Check for duplicate key error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Zone ID already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create zone: ' + error.message });
  }
});

// Delete zone by ID (must come before GET /:id to avoid routing issues)
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const result = await connection.query('DELETE FROM Zones WHERE zone_id = ?', [req.params.id]);
    connection.release();
    
    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    res.json({ message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error.message);
    res.status(500).json({ error: 'Failed to delete zone: ' + error.message });
  }
});

// Get zone by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM Zones WHERE zone_id = ?', [req.params.id]);
    connection.release();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Zone not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching zone:', error.message);
    res.status(500).json({ error: 'Failed to fetch zone: ' + error.message });
  }
});

module.exports = router;
