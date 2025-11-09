@echo off
REM Smart City Backend Setup Script for Windows

echo.
echo 🚀 Installing Smart City Backend...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

echo ✅ npm version:
npm --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please update .env with your MySQL credentials
)

echo.
echo ✅ Backend setup complete!
echo.
echo 📌 Next steps:
echo    1. Update backend\.env with your MySQL credentials
echo    2. Ensure MySQL database is running
echo    3. Run: npm start
echo.
echo 🌐 Backend will be available at: http://localhost:5000
echo 📊 API Health Check: http://localhost:5000/api/health
echo.
pause
