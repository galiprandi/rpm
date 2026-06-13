#!/bin/bash

# Script para hacer backup de una base de datos
# Uso: ./scripts/backup-db.sh [output-file.sql]

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Archivo de salida (default: /tmp/backup-YYYY-MM-DD-HH-MM-SS.sql)
OUTPUT_FILE="${1:-/tmp/backup-$(date +%Y-%m-%d-%H-%M-%S).sql}"

echo -e "${YELLOW}📦 Script de Backup de Base de Datos${NC}"
echo ""

# Pedir DATABASE_URL
echo "Ingresa la DATABASE_URL (postgresql://user:pass@host:port/dbname):"
read -r DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL es requerida${NC}"
    exit 1
fi

# Extraer componentes de la URL usando Python para mejor parsing
PARSED=$(python3 -c "
from urllib.parse import urlparse, parse_qs
import sys

url = sys.argv[1]
parsed = urlparse(url)

# Si no tiene puerto, usar default 5432
port = parsed.port if parsed.port else 5432

# Extraer query params
params = parse_qs(parsed.query)
sslmode = params.get('sslmode', ['disable'])[0]

print(f'{parsed.hostname}|{port}|{parsed.path.lstrip(\"/\")}|{parsed.username}|{parsed.password}|{sslmode}')
" "$DATABASE_URL")

DB_HOST=$(echo "$PARSED" | cut -d'|' -f1)
DB_PORT=$(echo "$PARSED" | cut -d'|' -f2)
DB_NAME=$(echo "$PARSED" | cut -d'|' -f3)
DB_USER=$(echo "$PARSED" | cut -d'|' -f4)
DB_PASS=$(echo "$PARSED" | cut -d'|' -f5)
SSLMODE=$(echo "$PARSED" | cut -d'|' -f6)

echo ""
echo -e "${YELLOW}📋 Información de la base de datos:${NC}"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""

# Verificar si el archivo ya existe
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}⚠️  El archivo ${OUTPUT_FILE} ya existe${NC}"
    echo -e "${YELLOW}¿Sobrescribir? (y/N)${NC}"
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "Cancelado"
        exit 0
    fi
fi

echo -e "${YELLOW}🔄 Haciendo backup...${NC}"

# Configurar SSL usando variable de entorno
export PGSSLMODE="$SSLMODE"

# Hacer el backup usando pg_dump
PGPASSWORD="$DB_PASS" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=plain \
    > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup completado: ${OUTPUT_FILE} (${FILE_SIZE})${NC}"
else
    echo -e "${RED}❌ Error al hacer backup${NC}"
    rm -f "$OUTPUT_FILE"
    exit 1
fi
