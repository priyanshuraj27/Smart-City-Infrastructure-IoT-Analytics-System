#!/bin/bash

# Smart City Backend Setup Script

echo "🚀 Installing Smart City Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your MySQL credentials"
fi

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Update backend/.env with your MySQL credentials"
echo "   2. Ensure MySQL database is running"
echo "   3. Run: npm start"
echo ""
echo "🌐 Backend will be available at: http://localhost:5000"
echo "📊 API Health Check: http://localhost:5000/api/health"
