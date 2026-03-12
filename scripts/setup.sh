#!/bin/bash

# Robot Delivery Simulator - Setup Script
# This script sets up the development environment

set -e

echo "🤖 Robot Delivery Simulator Setup"
echo "=================================="

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client and setup database
echo ""
echo "🗄️ Setting up database..."
npx prisma generate
npx prisma db push

# Seed database
echo ""
echo "🌱 Seeding database..."
npm run seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development servers:"
echo "   npm run dev        # Start Next.js server"
echo "   npm run websocket  # Start WebSocket server"
echo "   npm run dev:all    # Start both servers"
echo ""
echo "🔑 Demo credentials:"
echo "   Email: demo@test.ru"
echo "   Password: demo123"
echo ""
echo "📚 Documentation: https://docs.robotsimulator.dev"
