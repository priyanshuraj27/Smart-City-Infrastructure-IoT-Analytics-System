USE smart_city_db;
-- ============================================
-- Query 1: Find high-pollution zones (last 30 days)
-- ============================================
SELECT 
    z.zone_id,
    z.name AS zone_name,
    z.population,
    AVG(r.value) AS avg_pollution_level,
    MAX(r.value) AS max_pollution,
    MIN(r.value) AS min_pollution,
    COUNT(r.reading_id) AS reading_count
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE r.reading_type = 'AirQuality' 
  AND r.timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY z.zone_id, z.name, z.population
ORDER BY avg_pollution_level DESC
LIMIT 5;

-- ============================================
-- Query 2: Devices with alerts but no maintenance
-- ============================================
SELECT 
    d.device_id,
    d.type,
    d.status,
    z.name AS zone_name,
    COUNT(DISTINCT a.alert_id) AS alert_count
FROM Devices d
JOIN Alerts a ON d.device_id = a.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE d.device_id NOT IN (
    SELECT DISTINCT device_id FROM Maintenance
)
GROUP BY d.device_id, d.type, d.status, z.name
ORDER BY alert_count DESC;

-- ============================================
-- Query 3: Devices marked as 'Inactive'
-- ============================================
SELECT 
    d.device_id,
    d.type,
    z.name AS zone_name,
    d.install_date,
    d.status,
    COUNT(a.alert_id) AS total_alerts,
    COUNT(m.log_id) AS maintenance_count
FROM Devices d
LEFT JOIN Zones z ON d.zone_id = z.zone_id
LEFT JOIN Alerts a ON d.device_id = a.device_id
LEFT JOIN Maintenance m ON d.device_id = m.device_id
WHERE d.status = 'Inactive'
GROUP BY d.device_id, d.type, z.name, d.install_date, d.status;

-- ============================================
-- Query 4: Top 5 most expensive maintenance operations
-- ============================================
SELECT 
    m.log_id,
    m.device_id,
    d.type,
    z.name AS zone_name,
    m.technician_name,
    m.issue_fixed,
    m.cost,
    m.date
FROM Maintenance m
JOIN Devices d ON m.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
ORDER BY m.cost DESC
LIMIT 5;

-- ============================================
-- Query 5: Monthly maintenance costs by zone
-- ============================================
SELECT 
    z.name AS zone,
    MONTH(m.date) AS month,
    YEAR(m.date) AS year,
    COUNT(m.log_id) AS maintenance_count,
    SUM(m.cost) AS total_cost,
    AVG(m.cost) AS avg_cost
FROM Maintenance m
JOIN Devices d ON m.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
GROUP BY z.name, MONTH(m.date), YEAR(m.date)
ORDER BY total_cost DESC;

-- ============================================
-- Query 6: Active vs Inactive devices by zone
-- ============================================
SELECT 
    z.name AS zone_name,
    d.type AS device_type,
    SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) AS active_count,
    SUM(CASE WHEN d.status = 'Inactive' THEN 1 ELSE 0 END) AS inactive_count,
    SUM(CASE WHEN d.status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance_count,
    COUNT(*) AS total_devices
FROM Devices d
JOIN Zones z ON d.zone_id = z.zone_id
GROUP BY z.name, d.type
ORDER BY z.name;

-- ============================================
-- Query 7: Alert severity distribution
-- ============================================
SELECT 
    severity,
    COUNT(*) AS alert_count,
    SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) AS resolved,
    SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) AS unresolved,
    ROUND((SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) AS resolution_rate
FROM Alerts
GROUP BY severity
ORDER BY alert_count DESC;

-- ============================================
-- Query 8: Energy consumption trends by zone
-- ============================================
SELECT 
    z.name AS zone_name,
    record_date,
    consumption_kwh,
    LAG(consumption_kwh) OVER (PARTITION BY z.zone_id ORDER BY record_date) AS prev_day_consumption,
    ROUND(((consumption_kwh - LAG(consumption_kwh) OVER (PARTITION BY z.zone_id ORDER BY record_date)) 
           / LAG(consumption_kwh) OVER (PARTITION BY z.zone_id ORDER BY record_date)) * 100, 2) AS consumption_change_percent
FROM EnergyConsumption ec
JOIN Zones z ON ec.zone_id = z.zone_id
ORDER BY z.name, record_date DESC;

-- ============================================
-- Query 9: Zone performance summary
-- ============================================
SELECT 
    z.zone_id,
    z.name AS zone_name,
    z.population,
    COUNT(DISTINCT d.device_id) AS total_devices,
    SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) AS active_devices,
    ROUND((SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) / COUNT(DISTINCT d.device_id)) * 100, 2) AS active_percentage,
    COUNT(DISTINCT a.alert_id) AS total_alerts,
    COUNT(DISTINCT m.log_id) AS maintenance_logs,
    SUM(m.cost) AS total_maintenance_cost
FROM Zones z
LEFT JOIN Devices d ON z.zone_id = d.zone_id
LEFT JOIN Alerts a ON d.device_id = a.device_id
LEFT JOIN Maintenance m ON d.device_id = m.device_id
GROUP BY z.zone_id, z.name, z.population
ORDER BY total_devices DESC;

-- ============================================
-- Query 10: Recent critical alerts (unresolved)
-- ============================================
SELECT 
    a.alert_id,
    a.device_id,
    d.type AS device_type,
    z.name AS zone_name,
    a.alert_type,
    a.severity,
    a.alert_time,
    ROUND(DATEDIFF(NOW(), a.alert_time) * 24, 1) AS hours_since_alert,
    CASE 
        WHEN DATEDIFF(NOW(), a.alert_time) > 7 THEN 'CRITICAL - OVERDUE'
        WHEN DATEDIFF(NOW(), a.alert_time) > 3 THEN 'WARNING - DELAYED'
        ELSE 'Normal'
    END AS urgency_level
FROM Alerts a
JOIN Devices d ON a.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE a.resolved = 0 AND a.severity IN ('High', 'Critical')
ORDER BY a.alert_time ASC;

-- ============================================
-- Query 11: Maintenance efficiency by technician
-- ============================================
SELECT 
    m.technician_name,
    COUNT(m.log_id) AS jobs_completed,
    SUM(m.cost) AS total_cost,
    AVG(m.cost) AS avg_cost_per_job,
    MIN(m.cost) AS cheapest_job,
    MAX(m.cost) AS most_expensive_job,
    COUNT(DISTINCT m.device_id) AS unique_devices_serviced
FROM Maintenance m
GROUP BY m.technician_name
ORDER BY jobs_completed DESC;

-- ============================================
-- Query 12: Device age and maintenance correlation
-- ============================================
SELECT 
    d.device_id,
    d.type,
    z.name AS zone_name,
    d.install_date,
    DATEDIFF(CURDATE(), d.install_date) AS days_in_operation,
    ROUND(DATEDIFF(CURDATE(), d.install_date) / 365, 1) AS years_in_operation,
    COUNT(m.log_id) AS maintenance_count,
    SUM(m.cost) AS total_maintenance_cost,
    CASE 
        WHEN COUNT(m.log_id) > 3 THEN 'High Maintenance'
        WHEN COUNT(m.log_id) > 1 THEN 'Medium Maintenance'
        ELSE 'Low Maintenance'
    END AS maintenance_category
FROM Devices d
LEFT JOIN Zones z ON d.zone_id = z.zone_id
LEFT JOIN Maintenance m ON d.device_id = m.device_id
GROUP BY d.device_id, d.type, z.name, d.install_date
ORDER BY maintenance_count DESC;

-- ============================================
-- Query 13: Pollution trends over time (last 7 days)
-- ============================================
SELECT 
    DATE(r.timestamp) AS reading_date,
    d.zone_id,
    z.name AS zone_name,
    ROUND(AVG(r.value), 2) AS avg_pollution,
    MAX(r.value) AS peak_pollution,
    COUNT(r.reading_id) AS reading_count
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE r.reading_type = 'AirQuality' 
  AND r.timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(r.timestamp), d.zone_id, z.name
ORDER BY reading_date DESC, avg_pollution DESC;

-- ============================================
-- Query 14: Traffic density patterns by hour
-- ============================================
SELECT 
    HOUR(r.timestamp) AS hour_of_day,
    z.name AS zone_name,
    AVG(r.value) AS avg_traffic_density,
    MAX(r.value) AS peak_traffic,
    COUNT(r.reading_id) AS reading_count
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id AND d.type = 'Traffic Monitor'
JOIN Zones z ON d.zone_id = z.zone_id
WHERE r.reading_type = 'TrafficDensity'
  AND r.timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY HOUR(r.timestamp), z.name
ORDER BY hour_of_day, zone_name;

-- ============================================
-- Query 15: Statistical summary dashboard
-- ============================================
SELECT 
    'Total Zones' AS metric, COUNT(DISTINCT zone_id) AS value FROM Zones
UNION ALL
SELECT 'Total Devices', COUNT(*) FROM Devices
UNION ALL
SELECT 'Active Devices', SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) FROM Devices
UNION ALL
SELECT 'Inactive Devices', SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) FROM Devices
UNION ALL
SELECT 'Total Alerts', COUNT(*) FROM Alerts
UNION ALL
SELECT 'Unresolved Alerts', SUM(CASE WHEN resolved = 0 THEN 1 ELSE 0 END) FROM Alerts
UNION ALL
SELECT 'Total Maintenance Operations', COUNT(*) FROM Maintenance
UNION ALL
SELECT 'Total Maintenance Cost ($)', ROUND(SUM(cost), 2) FROM Maintenance;

-- ============================================
-- Additional Performance Queries
-- ============================================

-- Query 16: Devices needing maintenance (high alert frequency)
SELECT 
    d.device_id,
    d.type,
    z.name AS zone_name,
    COUNT(a.alert_id) AS alerts_last_30_days,
    COUNT(m.log_id) AS maintenance_in_last_6_months,
    DATEDIFF(CURDATE(), MAX(m.date)) AS days_since_last_maintenance
FROM Devices d
LEFT JOIN Zones z ON d.zone_id = z.zone_id
LEFT JOIN Alerts a ON d.device_id = a.device_id AND a.alert_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
LEFT JOIN Maintenance m ON d.device_id = m.device_id AND m.date >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
GROUP BY d.device_id, d.type, z.name
HAVING alerts_last_30_days > 2
ORDER BY alerts_last_30_days DESC;

-- Query 17: Zone compliance metrics
SELECT 
    z.zone_id,
    z.name AS zone_name,
    ROUND(AVG(r.value), 2) AS avg_air_quality,
    MAX(CASE WHEN r.value > 90 THEN 1 ELSE 0 END) AS critical_pollution_incidents,
    COUNT(DISTINCT a.alert_id) AS alert_incidents,
    DATEDIFF(CURDATE(), MAX(m.date)) AS days_since_zone_maintenance
FROM Zones z
LEFT JOIN Devices d ON z.zone_id = d.zone_id
LEFT JOIN Readings r ON d.device_id = r.device_id AND r.reading_type = 'AirQuality'
LEFT JOIN Alerts a ON d.device_id = a.device_id
LEFT JOIN Maintenance m ON d.device_id = m.device_id
GROUP BY z.zone_id, z.name
ORDER BY avg_air_quality DESC;
