# Smart City — Queries Reference

This document collects the important SQL queries used across the Smart City Infrastructure & IoT Analytics System. Each entry includes: purpose, the SQL, parameters (if any), expected results, and short notes including performance / index recommendations.

> Source: consolidated from `database/queries.sql` and backend route files under `backend/routes/*.js`.

---

## Table of contents

- Dashboard & Analytics
  - Top polluted zones (last 30 days)
  - Top devices by readings
  - Alerts by zone
  - Average maintenance cost per zone
  - Devices needing replacement
  - Anomalies detection (recent period)
  - Maintenance trend (month-over-month)
  - Alerts severity breakdown
  - Readings distribution by zone & type
  - Dashboard summary (counts & averages)
- Devices
  - Get all devices (with zone)
  - Get devices by zone
  - Create device
  - Get device by id
  - Delete device
- Readings
  - Get recent readings (all)
  - Get readings by device
  - Insert reading
  - Get reading by id
- Alerts
  - Get recent alerts (all)
  - Get active alerts
  - Create alert
  - Get alert by id
  - Delete alert
- Maintenance
  - Get maintenance logs (all)
  - Get maintenance by device
  - Create maintenance log
  - Get maintenance by id
  - Delete maintenance log
- Zones
  - (Core CRUD queries live in backend `zones.js` — examples shown below)
- Additional complex/reporting queries (from `database/queries.sql`)
  - Devices with alerts but no maintenance (detailed)
  - Monthly maintenance cost by zone (detailed)
  - Top 5 expensive maintenance operations
  - Pollution & traffic trends
  - Zone performance, compliance and others

---

## DASHBOARD & ANALYTICS

### Top polluted zones (last 30 days)
- Endpoint: `GET /api/analytics/top-polluted-zones`
- Purpose: list zones with highest average AirQuality readings in the last 30 days.
- SQL:
```sql
SELECT z.name, AVG(r.value) AS avg_pollution
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE r.reading_type = 'AirQuality'
  AND r.timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY z.name
ORDER BY avg_pollution DESC
LIMIT 5;
```
- Notes: convert numeric results as needed in the frontend. Consider an index on `Readings(reading_type, timestamp)` and `Devices(zone_id)` for the JOIN.

---

### Top devices by readings
- Endpoint: `GET /api/analytics/top-devices-by-readings`
- Purpose: identify busiest sensors (example uses `AirQuality`).
- SQL:
```sql
SELECT d.device_id, d.type, COUNT(r.reading_id) AS readings_count, AVG(r.value) AS avg_value
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
WHERE r.reading_type = 'AirQuality'
GROUP BY d.device_id
ORDER BY readings_count DESC, avg_value DESC
LIMIT 10;
```
- Notes: useful to find sensors with the most activity; index on `Readings(reading_type, device_id)` recommended.

---

### Alerts by zone
- Endpoint: `GET /api/analytics/alerts-by-zone`
- Purpose: counts of alerts grouped by zone.
- SQL:
```sql
SELECT z.name AS zone, COUNT(a.alert_id) AS alert_count
FROM Alerts a
JOIN Devices d ON a.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
GROUP BY z.name
ORDER BY alert_count DESC
LIMIT 10;
```
- Notes: index `Alerts(device_id)` and `Devices(zone_id)` help aggregation.

---

### Average maintenance cost per zone
- Endpoint: `GET /api/analytics/avg-cost-per-zone`
- Purpose: average maintenance cost grouped by zone (for budgeting).
- SQL:
```sql
SELECT z.name AS zone, ROUND(AVG(m.cost),2) AS avg_cost
FROM Maintenance m
JOIN Devices d ON m.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
GROUP BY z.name
ORDER BY avg_cost DESC
LIMIT 20;
```
- Notes: `Maintenance(device_id, date)` index recommended for grouping/filtering.

---

### Devices needing replacement (heuristics)
- Endpoint: `GET /api/analytics/devices-needing-replacement`
- Purpose: find devices that are old or have high avg maintenance cost.
- SQL:
```sql
SELECT d.device_id, d.type, d.install_date,
       IFNULL((SELECT ROUND(AVG(m.cost),2) FROM Maintenance m WHERE m.device_id = d.device_id), 0) AS avg_maintenance_cost,
       TIMESTAMPDIFF(YEAR, d.install_date, CURDATE()) AS age_years
FROM Devices d
WHERE TIMESTAMPDIFF(YEAR, d.install_date, CURDATE()) > 5
   OR IFNULL((SELECT AVG(m.cost) FROM Maintenance m WHERE m.device_id = d.device_id),0) > 1000
ORDER BY age_years DESC, avg_maintenance_cost DESC
LIMIT 50;
```
- Notes: This uses subqueries per device; for many devices consider precomputing avg maintenance in a materialized view or periodic aggregate table.

---

### Anomalies detection (recent period)
- Endpoint: `GET /api/analytics/anomalies?type=AirQuality&days=7`
- Purpose: report readings > mean + 3 * stddev per-device in the recent period.
- SQL (prepared with parameters):
```sql
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
LIMIT 200;
```
- Notes: Parameters: (type, days, type, days). The query uses STDDEV_POP which requires MySQL to compute population standard deviation. Index on `(reading_type, timestamp)` helps.

---

### Maintenance trend (month-over-month)
- Endpoint: `GET /api/analytics/maintenance-trend?months=6`
- Purpose: returns monthly total maintenance cost (last N months). The backend computes percent change between months.
- SQL:
```sql
SELECT DATE_FORMAT(m.date, '%Y-%m') AS month, ROUND(SUM(m.cost),2) AS total_cost
FROM Maintenance m
GROUP BY DATE_FORMAT(m.date, '%Y-%m')
ORDER BY month DESC
LIMIT ?;
```
- Notes: parameter: months. Consider index on `Maintenance(date)` for range queries.

---

### Alerts severity breakdown
- Endpoint: `GET /api/analytics/alerts-severity`
- Purpose: counts by severity value.
- SQL:
```sql
SELECT severity, COUNT(*) AS count
FROM Alerts
GROUP BY severity
ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low'), count DESC;
```

---

### Readings distribution by zone & type
- Endpoint: `GET /api/analytics/readings-distribution`
- Purpose: averages / stddev of reading values grouped by zone and reading type.
- SQL:
```sql
SELECT z.name AS zone, r.reading_type, ROUND(AVG(r.value),2) AS avg_value, ROUND(STDDEV_POP(r.value),2) AS stddev_value
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
GROUP BY z.name, r.reading_type
ORDER BY z.name, r.reading_type;
```

---

### Dashboard summary
- Endpoint: `GET /api/analytics/dashboard-summary`
- Purpose: small set of KPIs for dashboard.
- SQL (multiple simple queries):
```sql
SELECT COUNT(*) as count FROM Devices;
SELECT COUNT(*) as count FROM Alerts WHERE resolved = 0;
SELECT COUNT(*) as count FROM Maintenance;
SELECT AVG(cost) as avg FROM Maintenance;
```
- Returned JSON aggregates these results.

---

## DEVICES (CRUD and related queries)

### Get all devices (with zone name)
- Endpoint: `GET /api/devices`
- SQL:
```sql
SELECT d.*, z.name as zone_name
FROM Devices d
LEFT JOIN Zones z ON d.zone_id = z.zone_id;
```

### Get devices by zone
- Endpoint: `GET /api/devices/zone/:zone_id`
- SQL:
```sql
SELECT * FROM Devices WHERE zone_id = ?;
```
- Params: zone_id

### Create device
- Endpoint: `POST /api/devices`
- SQL:
```sql
INSERT INTO Devices (device_id, type, zone_id, install_date, status) VALUES (?, ?, ?, ?, ?);
```
- Params: (device_id, type, zone_id, install_date, status)

### Get device by id
- Endpoint: `GET /api/devices/:id`
- SQL:
```sql
SELECT * FROM Devices WHERE device_id = ?;
```

### Delete device
- Endpoint: `DELETE /api/devices/:id`
- SQL:
```sql
DELETE FROM Devices WHERE device_id = ?;
```

---

## READINGS

### Get recent readings (all)
- Endpoint: `GET /api/readings`
- SQL:
```sql
SELECT r.*, d.type as device_type
FROM Readings r
LEFT JOIN Devices d ON r.device_id = d.device_id
ORDER BY r.timestamp DESC
LIMIT 100;
```

### Get readings by device
- Endpoint: `GET /api/readings/device/:device_id`
- SQL:
```sql
SELECT * FROM Readings WHERE device_id = ? ORDER BY timestamp DESC LIMIT 50;
```

### Create reading
- Endpoint: `POST /api/readings`
- SQL:
```sql
INSERT INTO Readings (reading_id, device_id, reading_type, value, timestamp) VALUES (?, ?, ?, ?, ?);
```

### Get reading by id
- Endpoint: `GET /api/readings/:id`
- SQL:
```sql
SELECT * FROM Readings WHERE reading_id = ?;
```

### Delete reading
- Endpoint: `DELETE /api/readings/:id`
- SQL:
```sql
DELETE FROM Readings WHERE reading_id = ?;
```

---

## ALERTS

### Get all alerts
- Endpoint: `GET /api/alerts`
- SQL:
```sql
SELECT a.*, d.type as device_type
FROM Alerts a
LEFT JOIN Devices d ON a.device_id = d.device_id
ORDER BY a.alert_time DESC
LIMIT 100;
```

### Get active alerts
- Endpoint: `GET /api/alerts/active`
- SQL:
```sql
SELECT * FROM Alerts WHERE resolved = 0 ORDER BY alert_time DESC;
```

### Create alert
- Endpoint: `POST /api/alerts`
- SQL:
```sql
INSERT INTO Alerts (alert_id, device_id, alert_type, severity, alert_time, resolved) VALUES (?, ?, ?, ?, ?, ?);
```

### Get alert by id
- Endpoint: `GET /api/alerts/:id`
- SQL:
```sql
SELECT * FROM Alerts WHERE alert_id = ?;
```

### Delete alert
- Endpoint: `DELETE /api/alerts/:id`
- SQL:
```sql
DELETE FROM Alerts WHERE alert_id = ?;
```

---

## MAINTENANCE

### Get all maintenance logs
- Endpoint: `GET /api/maintenance`
- SQL:
```sql
SELECT m.*, d.type as device_type
FROM Maintenance m
LEFT JOIN Devices d ON m.device_id = d.device_id
ORDER BY m.date DESC;
```

### Get maintenance by device
- Endpoint: `GET /api/maintenance/device/:device_id`
- SQL:
```sql
SELECT * FROM Maintenance WHERE device_id = ? ORDER BY date DESC;
```

### Create maintenance log
- Endpoint: `POST /api/maintenance`
- SQL:
```sql
INSERT INTO Maintenance (log_id, device_id, technician_name, cost, date, issue_fixed) VALUES (?, ?, ?, ?, ?, ?);
```

### Get maintenance by id
- Endpoint: `GET /api/maintenance/:id`
- SQL:
```sql
SELECT * FROM Maintenance WHERE log_id = ?;
```

### Delete maintenance log
- Endpoint: `DELETE /api/maintenance/:id`
- SQL:
```sql
DELETE FROM Maintenance WHERE log_id = ?;
```

---

## ZONES (examples and common queries)
- Get all zones:
```sql
SELECT * FROM Zones ORDER BY name;
```
- Create a zone:
```sql
INSERT INTO Zones (zone_id, name, population, avg_income) VALUES (?, ?, ?, ?);
```
- Get zone by id:
```sql
SELECT * FROM Zones WHERE zone_id = ?;
```
- Delete zone:
```sql
DELETE FROM Zones WHERE zone_id = ?;
```

---

## ADDITIONAL COMPLEX / REPORTING QUERIES (from `database/queries.sql`)
- The `database/queries.sql` file in the repo contains a larger collection of reporting queries. Highlights include:
  - Devices with alerts but no maintenance (with alert counts and zone info)
  - Monthly maintenance costs and averages by zone
  - Top 5 most expensive maintenance operations
  - Pollution trends by day (7-day window)
  - Traffic density patterns by hour and zone
  - Zone performance summary combining counts of devices, alerts, maintenance costs
  - Technician efficiency summaries
  - Device age vs maintenance correlation

See `database/queries.sql` for full SQL text and comments. That file is intended for reporting and offline analytics (not all queries are suitable to run as-is on the live API without pagination or batching).

---

## PARAMETERS, TYPES & RETURN SHAPES
- The queries use the following principal tables (simplified):
  - `Devices(device_id, type, zone_id, install_date, status)`
  - `Readings(reading_id, device_id, reading_type, value, timestamp)`
  - `Alerts(alert_id, device_id, alert_type, severity, alert_time, resolved)`
  - `Maintenance(log_id, device_id, technician_name, cost, date, issue_fixed)`
  - `Zones(zone_id, name, population, avg_income)`
- Numeric columns: `value` (FLOAT/DECIMAL), `cost` (DECIMAL), aggregates may return decimal strings depending on MySQL driver — convert in the client if necessary.

---

## PERFORMANCE NOTES & INDEX SUGGESTIONS
- Frequently-filtered columns and join keys should be indexed:
  - `Readings(reading_type, timestamp)` — helps time-windowed reading queries and anomaly detection.
  - `Readings(device_id)` — join to devices and group by device.
  - `Devices(zone_id)` — join to zones.
  - `Alerts(device_id, resolved)` — active alerts and joins.
  - `Maintenance(device_id, date)` — trends and grouping by date.
- For heavy aggregate queries consider:
  - Materialized/aggregated tables updated periodically (e.g., daily maintenance totals per zone).
  - Using summary tables or periodic ETL for historical analytics.
- Avoid full table scans on large Readings — use time-range filters and appropriate indexes.

---

## MAPPING TO BACKEND ROUTES
- Backend endpoints that use the above queries are present under `backend/routes/`:
  - `analytics.js` — analytics endpoints and dashboard summary
  - `devices.js`, `readings.js`, `alerts.js`, `maintenance.js`, `zones.js` — CRUD operations and related queries

---

## How to extend
- To add a new analytics view:
  1. Write the query here (or in `database/queries.sql` for reporting).
  2. Add the query to `backend/routes/<feature>.js`, using prepared parameters (use `?` placeholders).
  3. Add a frontend renderer in `frontend/script.js` and hook into `index.html`.
  4. Add caching if the query is expensive; use an in-memory TTL cache for dev and Redis for production.

---

If you'd like, I can:
- Export each query as a parametrized example with sample parameters and sample JSON response.
- Add recommended CREATE INDEX statements for your schema and generate a migration script.
- Add a small smoke-test script that executes each analytics endpoint and records timings.

Tell me which of the above you'd like next and I'll generate it.