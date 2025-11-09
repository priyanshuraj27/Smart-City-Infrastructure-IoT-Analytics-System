-- ============================================
-- Smart City Infrastructure & IoT Analytics System
-- Database Setup
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS smart_city_db;
USE smart_city_db;

-- ============================================
-- Table: Zones
-- ============================================
CREATE TABLE Zones (
    zone_id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    population INT,
    avg_income DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: Devices
-- ============================================
CREATE TABLE Devices (
    device_id INT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    zone_id INT NOT NULL,
    install_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES Zones(zone_id) ON DELETE CASCADE,
    INDEX idx_zone (zone_id),
    INDEX idx_status (status)
);

-- ============================================
-- Table: Readings
-- Description: Sensor readings from devices
-- ============================================
CREATE TABLE Readings (
    reading_id INT PRIMARY KEY,
    device_id INT NOT NULL,
    reading_type VARCHAR(50) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE CASCADE,
    INDEX idx_device (device_id),
    INDEX idx_type (reading_type),
    INDEX idx_timestamp (timestamp)
);

-- ============================================
-- Table: Alerts
-- Description: Alerts triggered when readings exceed thresholds
-- ============================================
CREATE TABLE Alerts (
    alert_id INT PRIMARY KEY,
    device_id INT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL DEFAULT 'Medium',
    alert_time DATETIME NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_time DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE CASCADE,
    INDEX idx_device (device_id),
    INDEX idx_resolved (resolved),
    INDEX idx_severity (severity)
);

-- ============================================
-- Table: Maintenance
-- Description: Maintenance activity logs
-- ============================================
CREATE TABLE Maintenance (
    log_id INT PRIMARY KEY,
    device_id INT NOT NULL,
    technician_name VARCHAR(50) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    issue_fixed VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE CASCADE,
    INDEX idx_device (device_id),
    INDEX idx_date (date),
    INDEX idx_technician (technician_name)
);

-- ============================================
-- Table: EnergyConsumption (Optional)
-- Description: Track city power usage by zone
-- ============================================
CREATE TABLE EnergyConsumption (
    record_id INT PRIMARY KEY AUTO_INCREMENT,
    zone_id INT NOT NULL,
    consumption_kwh DECIMAL(10, 2) NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (zone_id) REFERENCES Zones(zone_id) ON DELETE CASCADE,
    INDEX idx_zone (zone_id),
    INDEX idx_date (record_date)
);

-- ============================================
-- Views for Analytics
-- ============================================

-- View: Current Device Status
CREATE VIEW device_status_summary AS
SELECT 
    status,
    COUNT(*) as device_count,
    ROUND((COUNT(*) / (SELECT COUNT(*) FROM Devices)) * 100, 2) as percentage
FROM Devices
GROUP BY status;

-- View: Alert Statistics
CREATE VIEW alert_statistics AS
SELECT 
    severity,
    resolved,
    COUNT(*) as alert_count,
    AVG(DATEDIFF(resolved_time, alert_time)) as avg_resolution_days
FROM Alerts
GROUP BY severity, resolved;

-- View: Zone Performance
CREATE VIEW zone_performance AS
SELECT 
    z.zone_id,
    z.name,
    z.population,
    COUNT(DISTINCT d.device_id) as total_devices,
    SUM(CASE WHEN d.status = 'Active' THEN 1 ELSE 0 END) as active_devices,
    COUNT(DISTINCT a.alert_id) as total_alerts,
    SUM(m.cost) as total_maintenance_cost
FROM Zones z
LEFT JOIN Devices d ON z.zone_id = d.zone_id
LEFT JOIN Alerts a ON d.device_id = a.device_id
LEFT JOIN Maintenance m ON d.device_id = m.device_id
GROUP BY z.zone_id, z.name, z.population;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Optimize common queries
CREATE INDEX idx_readings_device_timestamp ON Readings(device_id, timestamp);
CREATE INDEX idx_alerts_device_resolved ON Alerts(device_id, resolved);
CREATE INDEX idx_maintenance_device_date ON Maintenance(device_id, date);

-- ============================================
-- Display all tables created
-- ============================================
SHOW TABLES;
SHOW VIEWS;
