# Backend API Documentation

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

## Environment Variables (.env)

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_city_db
DB_PORT=3306
```

## API Endpoints

### Health Check
- `GET /api/health` - Server status

### Zones
- `GET /api/zones` - All zones
- `GET /api/zones/:id` - Zone by ID
- `POST /api/zones` - Create zone

### Devices
- `GET /api/devices` - All devices
- `GET /api/devices/:id` - Device by ID
- `GET /api/devices/zone/:zone_id` - Devices in zone
- `POST /api/devices` - Create device

### Readings
- `GET /api/readings` - Latest readings
- `GET /api/readings/device/:device_id` - Device readings
- `POST /api/readings` - Create reading

### Alerts
- `GET /api/alerts` - All alerts
- `GET /api/alerts/active` - Active alerts
- `POST /api/alerts` - Create alert

### Maintenance
- `GET /api/maintenance` - All logs
- `GET /api/maintenance/device/:device_id` - Device logs
- `POST /api/maintenance` - Create log

### Analytics
- `GET /api/analytics/dashboard-summary`
- `GET /api/analytics/top-polluted-zones`
- `GET /api/analytics/inactive-devices`
- `GET /api/analytics/unserviced-devices`
- `GET /api/analytics/maintenance-by-zone`
