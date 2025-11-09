# 🚀 Quick Start Guide - Smart City System

## ⚡ 5-Minute Setup

### Step 1: Prerequisites Check
```bash
# Verify Node.js installation
node --version        # Should be v14+
npm --version         # Should be v6+

# Verify MySQL is running
mysql --version       # Should be v5.7+
```

### Step 2: Database Setup (2 minutes)
```bash
# Open MySQL client
mysql -u root -p

# Run in MySQL:
source database/create_tables.sql
source database/insert_data.sql

# Verify
USE smart_city_db;
SHOW TABLES;           # Should show 6 tables
SELECT COUNT(*) FROM Devices;  # Should show 17
```

### Step 3: Backend Setup (2 minutes)
```bash
cd backend

# Windows
setup.bat

# Mac/Linux
chmod +x setup.sh
./setup.sh

# Manual installation
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
```

### Step 4: Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start
# ✅ Server running at http://localhost:5000

# Terminal 2 - Frontend
cd frontend
python -m http.server 8000
# OR use VS Code Live Server
# ✅ Open http://localhost:8000 in browser
```

### Step 5: Verify Everything Works
```bash
# Check Backend Health
curl http://localhost:5000/api/health

# Open Dashboard
# http://localhost:8000

# Check data loads
# Click Dashboard → should see 17 total devices
```

---

## 📊 Testing the System

### Add Test Data via Frontend
1. Navigate to **Devices** tab
2. Click **+ Add Device**
3. Enter:
   - Device ID: 999
   - Type: Test Sensor
   - Zone ID: 1
   - Install Date: 2024-11-09
   - Status: Active
4. Click **Add Device**

### Query Database
```sql
-- Verify new device
SELECT * FROM Devices WHERE device_id = 999;

-- Run analytics query
SELECT z.name, AVG(r.value) AS avg_pollution
FROM Readings r
JOIN Devices d ON r.device_id = d.device_id
JOIN Zones z ON d.zone_id = z.zone_id
WHERE r.reading_type = 'AirQuality'
GROUP BY z.name
ORDER BY avg_pollution DESC;
```

---

## 🔧 Common Issues & Solutions

### Issue: "Connection refused" on http://localhost:5000
**Solution**: 
- Check if backend is running: `npm start` in backend folder
- Check if port 5000 is available: `lsof -i :5000` (Mac/Linux)

### Issue: "Connection error" to MySQL
**Solution**:
- Verify MySQL is running
- Check .env credentials match your MySQL setup
- Ensure smart_city_db database exists: `SHOW DATABASES;`

### Issue: Frontend not loading data
**Solution**:
- Check browser console (F12) for errors
- Verify backend API is responding: `curl http://localhost:5000/api/zones`
- Check CORS is enabled (already configured in server.js)

### Issue: "npm command not found"
**Solution**:
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

---

## 📁 File Organization

```
project/
├── database/
│   ├── create_tables.sql    ← Run first
│   ├── insert_data.sql      ← Run second
│   └── queries.sql          ← For analytics
├── backend/
│   ├── server.js            ← Start: npm start
│   ├── package.json
│   └── routes/
├── frontend/
│   ├── index.html           ← Open in browser
│   ├── styles.css
│   └── script.js
└── README.md                ← Full documentation
```

---

## 🎯 Key Endpoints to Test

```bash
# Zones
curl http://localhost:5000/api/zones

# Devices
curl http://localhost:5000/api/devices

# Dashboard Summary
curl http://localhost:5000/api/analytics/dashboard-summary

# Alerts
curl http://localhost:5000/api/alerts/active

# Pollution Analysis
curl http://localhost:5000/api/analytics/top-polluted-zones
```

---

## 📊 Dashboard Usage

1. **Dashboard Tab**: View KPIs and charts
2. **Zones Tab**: Manage city zones
3. **Devices Tab**: View and add devices
4. **Readings Tab**: Log sensor readings
5. **Alerts Tab**: Create and manage alerts
6. **Maintenance Tab**: Track maintenance history
7. **Analytics Tab**: View advanced insights

---

## 🚀 Next Steps

✅ Complete setup following this guide  
📝 Review the main README.md for full documentation  
🧪 Test API endpoints using curl or Postman  
🎨 Customize frontend styling as needed  
📈 Run analytics queries from database/queries.sql  
🔧 Extend with your own features  

---

## 💡 Pro Tips

- Use Postman for API testing: https://www.postman.com/
- Use DBeaver for database management: https://dbeaver.io/
- Use VS Code Live Server for quick frontend development
- Monitor backend with `npm install -g nodemon` + `nodemon server.js`

---

**Questions?** Check the full README.md or GitHub Issues!
