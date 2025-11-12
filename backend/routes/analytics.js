const express = require('express');
const router = express.Router();
const pool = require('../db');

// Simple in-memory cache for analytics endpoints to reduce DB load
// cacheKey -> { ts: Date.now(), ttl: seconds, data: any }
const analyticsCache = new Map();

function setCache(key, data, ttl = 120) {
  analyticsCache.set(key, { ts: Date.now(), ttl, data });
}

function getCache(key) {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.ts) / 1000 > entry.ttl) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.data;
}

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

// Additional analytics endpoints added for richer insights
// 1) Top devices by reading count (example uses AirQuality readings) - useful to spot busiest sensors
router.get('/top-devices-by-readings', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT d.device_id, d.type, COUNT(r.reading_id) AS readings_count, AVG(r.value) AS avg_value
      FROM Readings r
      JOIN Devices d ON r.device_id = d.device_id
      WHERE r.reading_type = 'AirQuality'
      GROUP BY d.device_id
      ORDER BY readings_count DESC, avg_value DESC
      LIMIT 10
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2) Alerts aggregated by zone (which zones have the most alerts)
router.get('/alerts-by-zone', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT z.name AS zone, COUNT(a.alert_id) AS alert_count
      FROM Alerts a
      JOIN Devices d ON a.device_id = d.device_id
      JOIN Zones z ON d.zone_id = z.zone_id
      GROUP BY z.name
      ORDER BY alert_count DESC
      LIMIT 10
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3) Average maintenance cost per zone (useful for budgeting)
router.get('/avg-cost-per-zone', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT z.name AS zone, ROUND(AVG(m.cost),2) AS avg_cost
      FROM Maintenance m
      JOIN Devices d ON m.device_id = d.device_id
      JOIN Zones z ON d.zone_id = z.zone_id
      GROUP BY z.name
      ORDER BY avg_cost DESC
      LIMIT 20
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4) Devices needing replacement (example uses two heuristics: age > 5 years OR high average maintenance cost)
router.get('/devices-needing-replacement', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Subquery used to compute avg maintenance cost per device
    const [rows] = await connection.query(`
      SELECT d.device_id, d.type, d.install_date,
             IFNULL((SELECT ROUND(AVG(m.cost),2) FROM Maintenance m WHERE m.device_id = d.device_id), 0) AS avg_maintenance_cost,
             TIMESTAMPDIFF(YEAR, d.install_date, CURDATE()) AS age_years
      FROM Devices d
      WHERE TIMESTAMPDIFF(YEAR, d.install_date, CURDATE()) > 5
         OR IFNULL((SELECT AVG(m.cost) FROM Maintenance m WHERE m.device_id = d.device_id),0) > 1000
      ORDER BY age_years DESC, avg_maintenance_cost DESC
      LIMIT 50
    `);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- Additional analytics: anomalies, trends, severity breakdown, readings distribution ----

// 5) Anomalies detection for a given reading type over recent period
router.get('/anomalies', async (req, res) => {
  // Query params: type (e.g., AirQuality), days (default 7)
  const type = req.query.type || 'AirQuality';
  const days = parseInt(req.query.days || '7', 10);
  const cacheKey = `anomalies:${type}:${days}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const connection = await pool.getConnection();
    // Use a subquery to compute rolling avg+stddev per device (approx using per-device stats over period)
    const [rows] = await connection.query(`
      SELECT r.reading_id, r.device_id, r.reading_type, r.value, r.timestamp,
             stats.avg_val, stats.stddev_val
      FROM Readings r
      JOIN (
        SELECT device_id, AVG(value) AS avg_val, STDDEV_POP(value) AS stddev_val
        FROM Readings
        WHERE reading_type = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY device_id
      ) AS stats ON stats.device_id = r.device_id
      WHERE r.reading_type = ? AND r.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND r.value > (stats.avg_val + 3 * IFNULL(stats.stddev_val, 0))
      ORDER BY r.timestamp DESC
      LIMIT 200
    `, [type, days, type, days]);
    connection.release();

    setCache(cacheKey, rows, 120);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6) Maintenance trend with percent change month-over-month (last N months)
router.get('/maintenance-trend', async (req, res) => {
  const months = parseInt(req.query.months || '6', 10);
  const cacheKey = `maintenance-trend:${months}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const connection = await pool.getConnection();
    // Aggregate by month (YYYY-MM)
    const [rows] = await connection.query(`
      SELECT DATE_FORMAT(m.date, '%Y-%m') AS month, ROUND(SUM(m.cost),2) AS total_cost
      FROM Maintenance m
      GROUP BY DATE_FORMAT(m.date, '%Y-%m')
      ORDER BY month DESC
      LIMIT ?
    `, [months]);
    connection.release();

    // compute percent change relative to previous month
    const ordered = rows.slice().reverse(); // ascending
    const resRows = ordered.map((r, idx) => {
      const prev = idx > 0 ? ordered[idx - 1].total_cost : null;
      const pct = prev ? ((r.total_cost - prev) / prev) * 100 : null;
      return { month: r.month, total_cost: r.total_cost, pct_change: pct === null ? null : Number(pct.toFixed(2)) };
    });

    setCache(cacheKey, resRows, 300);
    res.json(resRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7) Alerts severity breakdown (count by severity)
router.get('/alerts-severity', async (req, res) => {
  const cacheKey = 'alerts-severity';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT severity, COUNT(*) AS count
      FROM Alerts
      GROUP BY severity
      ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low'), count DESC
    `);
    connection.release();

    setCache(cacheKey, rows, 120);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8) Readings distribution by zone and type (average + stddev)
router.get('/readings-distribution', async (req, res) => {
  const cacheKey = 'readings-distribution';
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT z.name AS zone, r.reading_type, ROUND(AVG(r.value),2) AS avg_value, ROUND(STDDEV_POP(r.value),2) AS stddev_value
      FROM Readings r
      JOIN Devices d ON r.device_id = d.device_id
      JOIN Zones z ON d.zone_id = z.zone_id
      GROUP BY z.name, r.reading_type
      ORDER BY z.name, r.reading_type
    `);
    connection.release();

    setCache(cacheKey, rows, 300);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
