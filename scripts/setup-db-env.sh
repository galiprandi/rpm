#!/bin/bash

# Setup database environment variables for Vercel
# SECURITY: Never hardcode credentials. Use environment variables.

echo "🔧 Setting up database environment variables..."

# Get credentials from environment variables (NEVER hardcode!)
POSTGRES_URL="${POSTGRES_URL:-$DATABASE_URL}"
DATABASE_URL="${DATABASE_URL}"
POSTGRES_URL_NON_POOLING="${POSTGRES_URL_NON_POOLING:-$POSTGRES_URL}"

# Validate required variables
if [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: POSTGRES_URL or DATABASE_URL environment variable is required"
  echo "💡 Set the environment variable before running this script:"
  echo "   export POSTGRES_URL='postgres://user:pass@host:port/db'"
  exit 1
fi

# Create temporary files with environment variables
echo "$POSTGRES_URL" > /tmp/postgres_url.txt
echo "$DATABASE_URL" > /tmp/database_url.txt
echo "$POSTGRES_URL_NON_POOLING" > /tmp/postgres_url_non_pooling.txt

# Add environment variables to Vercel (using correct format)
echo "📝 Adding POSTGRES_URL..."
vercel env add POSTGRES_URL production < /tmp/postgres_url.txt

echo "📝 Adding DATABASE_URL..."
vercel env add DATABASE_URL production < /tmp/database_url.txt

echo "📝 Adding POSTGRES_URL_NON_POOLING..."
vercel env add POSTGRES_URL_NON_POOLING production < /tmp/postgres_url_non_pooling.txt

# Clean up temporary files
rm -f /tmp/postgres_url.txt /tmp/database_url.txt /tmp/postgres_url_non_pooling.txt

echo "✅ Environment variables configured!"

# Verify configuration
echo "🔍 Verifying configuration..."
vercel env ls
