#!/bin/bash

# Deploy Script with Database Configuration
# This script handles deployment to Vercel with database setup

echo "🚀 Starting deployment with database configuration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Build the project
echo "📦 Building project..."
pnpm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Generate Prisma client for production
echo "🔧 Generating Prisma client..."
pnpm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma client generation failed"
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

# Test production health check
echo "🏥 Testing production health check..."
sleep 5

HEALTH_CHECK=$(curl -s https://rpm-wheat.vercel.app/api/health/db)

if [[ $HEALTH_CHECK == *"healthy"* ]]; then
    echo "✅ Database health check passed"
    echo "📊 Health status: $HEALTH_CHECK"
else
    echo "⚠️  Database health check failed"
    echo "📊 Health status: $HEALTH_CHECK"
fi

echo "✅ Deployment completed!"
echo "🌐 Production URL: https://rpm-wheat.vercel.app"
echo "🏥 Health Check: https://rpm-wheat.vercel.app/api/health/db"
