# Frontend Documentation

## Quick Start

```bash
# Using Python HTTP server
python -m http.server 8000

# Or use VS Code Live Server extension
# Or any other HTTP server
```

Open browser: `http://localhost:8000`

## Features

### Dashboard
- Real-time KPI cards
- Interactive charts
- Data refresh button

### Data Management
- Add Zones
- Add Devices
- Add Readings
- Create Alerts
- Log Maintenance

### Analytics
- Pollution trends
- Maintenance costs
- Device status
- Zone performance

### Responsive Design
- Desktop optimized
- Tablet compatible
- Mobile friendly

## Configuration

Update the API URL in `script.js` if backend is on different host:

```javascript
const API_URL = 'http://localhost:5000/api';
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies (CDN)

- Chart.js 3.x (for charting)
- Vanilla JavaScript (no framework)

## Performance

- Lazy loading for large datasets
- Client-side filtering
- Optimized API calls
- Responsive images
