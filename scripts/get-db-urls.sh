#!/bin/bash

# Get Database URLs from Vercel Postgres
# Este script obtiene las URLs de la base de datos y las configura

echo "🔍 Getting database URLs from Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not installed"
    echo "💡 Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Vercel"
    echo "💡 Login with: vercel login"
    exit 1
fi

# Try to get database info
echo "📋 Checking Vercel Postgres databases..."

# Method 1: Check if postgres is already connected
if vercel env ls | grep -q "POSTGRES_URL"; then
    echo "✅ Database variables already exist"
    vercel env ls | grep POSTGRES
    exit 0
fi

# Method 2: Try to get database info from project
echo "🔍 Looking for connected databases..."

# Check if we can get database info
DB_INFO=$(vercel postgres ls 2>/dev/null || echo "")

if [ -n "$DB_INFO" ]; then
    echo "✅ Found database connection"
    echo "📋 Database info:"
    echo "$DB_INFO"
    
    # Try to create environment variables automatically
    echo "🔧 Creating environment variables..."
    
    # This might work if the database is connected to the project
    vercel env pull .env.production 2>/dev/null || {
        echo "⚠️  Could not auto-create variables"
        echo "💡 Please create them manually in Vercel Dashboard"
        echo ""
        echo "🌐 Dashboard: https://vercel.com/dashboard"
        echo "📋 Steps:"
        echo "   1. Select your project 'rpm'"
        echo "   2. Go to Settings → Environment Variables"
        echo "   3. Add these variables:"
        echo "      - POSTGRES_URL"
        echo "      - DATABASE_URL"
        echo "      - POSTGRES_PRISMA_URL"
        echo "      - POSTGRES_URL_NON_POOLING"
    }
else
    echo "❌ No database connection found"
    echo ""
    echo "💡 Options:"
    echo "   1. Create a new database: vercel postgres create"
    echo "   2. Connect existing database in Vercel Dashboard"
    echo "   3. Set variables manually in Dashboard"
    echo ""
    echo "🌐 Dashboard: https://vercel.com/dashboard"
fi

echo ""
echo "🔍 After setting variables, verify with:"
echo "   vercel env ls"
echo "   curl https://rpm-wheat.vercel.app/api/health/db"
