USE smart_city_db;

INSERT INTO Zones (zone_id, name, population, avg_income) VALUES
(1, 'East Zone', 150000, 65000.00),
(2, 'West Zone', 120000, 72000.00),
(3, 'Central Zone', 200000, 75000.00),
(4, 'North Zone', 95000, 68000.00),
(5, 'South Zone', 110000, 62000.00);

-- ============================================
-- Insert Devices
-- ============================================
INSERT INTO Devices (device_id, type, zone_id, install_date, status) VALUES
(101, 'Pollution Sensor', 1, '2023-01-15', 'Active'),
(102, 'Traffic Monitor', 1, '2023-02-20', 'Active'),
(103, 'Energy Meter', 1, '2023-03-10', 'Active'),
(104, 'Waste Sensor', 1, '2023-04-05', 'Inactive'),

(201, 'Pollution Sensor', 2, '2023-01-20', 'Active'),
(202, 'Traffic Monitor', 2, '2023-02-25', 'Active'),
(203, 'Energy Meter', 2, '2023-03-15', 'Active'),
(204, 'Water Level Sensor', 2, '2023-04-10', 'Active'),

(301, 'Pollution Sensor', 3, '2023-01-10', 'Active'),
(302, 'Traffic Monitor', 3, '2023-02-15', 'Maintenance'),
(303, 'Energy Meter', 3, '2023-03-05', 'Active'),
(304, 'Noise Meter', 3, '2023-04-01', 'Active'),

(401, 'Pollution Sensor', 4, '2023-01-25', 'Active'),
(402, 'Energy Meter', 4, '2023-02-28', 'Active'),
(403, 'Traffic Monitor', 4, '2023-03-20', 'Active'),

(501, 'Pollution Sensor', 5, '2023-02-01', 'Active'),
(502, 'Energy Meter', 5, '2023-03-01', 'Active'),
(503, 'Water Level Sensor', 5, '2023-04-15', 'Inactive');

-- ============================================
-- Insert Readings (Sensor Data)
-- ============================================
INSERT INTO Readings (reading_id, device_id, reading_type, value, timestamp) VALUES
-- East Zone readings
(1, 101, 'AirQuality', 85.5, '2024-11-08 08:00:00'),
(2, 101, 'AirQuality', 92.3, '2024-11-08 12:00:00'),
(3, 101, 'AirQuality', 78.9, '2024-11-08 16:00:00'),
(4, 102, 'TrafficDensity', 65.2, '2024-11-08 09:00:00'),
(5, 102, 'TrafficDensity', 85.4, '2024-11-08 17:00:00'),
(6, 103, 'EnergyUsage', 450.0, '2024-11-08 10:00:00'),
(7, 103, 'EnergyUsage', 520.0, '2024-11-08 14:00:00'),

-- West Zone readings
(8, 201, 'AirQuality', 72.1, '2024-11-08 08:30:00'),
(9, 201, 'AirQuality', 68.5, '2024-11-08 13:00:00'),
(10, 202, 'TrafficDensity', 55.8, '2024-11-08 09:15:00'),
(11, 203, 'EnergyUsage', 380.0, '2024-11-08 11:00:00'),
(12, 204, 'WaterLevel', 45.2, '2024-11-08 10:30:00'),

-- Central Zone readings
(13, 301, 'AirQuality', 95.7, '2024-11-08 09:00:00'),
(14, 301, 'AirQuality', 98.2, '2024-11-08 14:00:00'),
(15, 303, 'EnergyUsage', 650.0, '2024-11-08 12:00:00'),
(16, 303, 'EnergyUsage', 720.0, '2024-11-08 16:00:00'),
(17, 304, 'NoiseLevel', 72.5, '2024-11-08 11:00:00'),

-- North Zone readings
(18, 401, 'AirQuality', 65.3, '2024-11-08 08:45:00'),
(19, 402, 'EnergyUsage', 320.0, '2024-11-08 10:00:00'),
(20, 403, 'TrafficDensity', 42.1, '2024-11-08 09:30:00'),

-- South Zone readings
(21, 501, 'AirQuality', 88.6, '2024-11-08 09:15:00'),
(22, 502, 'EnergyUsage', 410.0, '2024-11-08 11:30:00'),
(23, 502, 'EnergyUsage', 480.0, '2024-11-08 15:30:00');

-- ============================================
-- Insert Alerts
-- ============================================
INSERT INTO Alerts (alert_id, device_id, alert_type, severity, alert_time, resolved) VALUES
(1, 101, 'HighPollution', 'High', '2024-11-08 12:15:00', 0),
(2, 201, 'NormalOperations', 'Low', '2024-11-07 15:00:00', 1),
(3, 301, 'CriticalPollution', 'Critical', '2024-11-08 14:30:00', 0),
(4, 302, 'DeviceMalfunction', 'High', '2024-11-08 10:00:00', 0),
(5, 304, 'HighNoise', 'Medium', '2024-11-07 11:00:00', 1),
(6, 401, 'AbnormalReading', 'Medium', '2024-11-08 08:50:00', 0),
(7, 501, 'HighPollution', 'High', '2024-11-08 09:30:00', 0),
(8, 503, 'DeviceOffline', 'Critical', '2024-11-06 14:00:00', 1);

-- ============================================
-- Insert Maintenance Logs
-- ============================================
INSERT INTO Maintenance (log_id, device_id, technician_name, cost, date, issue_fixed) VALUES
(1, 101, 'John Smith', 150.00, '2024-11-05', 'Sensor calibration'),
(2, 103, 'Sarah Johnson', 200.00, '2024-11-03', 'Battery replacement'),
(3, 201, 'Mike Davis', 120.00, '2024-11-02', 'Connection issue fixed'),
(4, 202, 'Emily Brown', 180.00, '2024-10-30', 'Camera lens cleaning'),
(5, 303, 'Robert Wilson', 250.00, '2024-11-01', 'Hardware malfunction repair'),
(6, 304, 'Jennifer Lee', 175.00, '2024-10-28', 'Microphone recalibration'),
(7, 402, 'David Martinez', 140.00, '2024-10-25', 'Power connection issue'),
(8, 501, 'Lisa Anderson', 165.00, '2024-10-22', 'Sensor drift correction'),
(9, 502, 'Thomas Clark', 200.00, '2024-10-20', 'Data transmission issue'),
(10, 504, 'Maria Garcia', 190.00, '2024-10-18', 'Device replacement');

-- ============================================
-- Insert Energy Consumption Data
-- ============================================
INSERT INTO EnergyConsumption (zone_id, consumption_kwh, record_date) VALUES
(1, 15000.00, '2024-11-08'),
(2, 12500.00, '2024-11-08'),
(3, 22000.00, '2024-11-08'),
(4, 10800.00, '2024-11-08'),
(5, 11200.00, '2024-11-08'),

(1, 14800.00, '2024-11-07'),
(2, 12200.00, '2024-11-07'),
(3, 21500.00, '2024-11-07'),
(4, 10500.00, '2024-11-07'),
(5, 11000.00, '2024-11-07');

-- ============================================
-- Verify Data
-- ============================================
SELECT 'Zones' as table_name, COUNT(*) as row_count FROM Zones
UNION ALL
SELECT 'Devices', COUNT(*) FROM Devices
UNION ALL
SELECT 'Readings', COUNT(*) FROM Readings
UNION ALL
SELECT 'Alerts', COUNT(*) FROM Alerts
UNION ALL
SELECT 'Maintenance', COUNT(*) FROM Maintenance
UNION ALL
SELECT 'EnergyConsumption', COUNT(*) FROM EnergyConsumption;
