#!/bin/bash

# Script para restaurar un backup a una base de datos
# Uso: ./scripts/restore-db.sh backup-file.sql

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Archivo de backup
BACKUP_FILE="${1}"

if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Debes especificar el archivo de backup${NC}"
    echo "Uso: ./scripts/restore-db.sh backup-file.sql"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: El archivo $BACKUP_FILE no existe${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Script de Restauración de Base de Datos${NC}"
echo ""

# Pedir DATABASE_URL
echo "Ingresa la DATABASE_URL de destino (postgresql://user:pass@host:port/dbname):"
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
echo -e "${YELLOW}📋 Información de la base de datos de destino:${NC}"
echo "  Host: ${DB_HOST}"
echo "  Port: ${DB_PORT}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo ""
echo -e "${YELLOW}📋 Archivo de backup:${NC}"
echo "  ${BACKUP_FILE}"
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  Tamaño: ${FILE_SIZE}"
echo ""

# Confirmación con advertencia
echo -e "${RED}⚠️  ADVERTENCIA: Esto SOBRESCRIBIRÁ todos los datos en ${DB_NAME}${NC}"
echo -e "${YELLOW}¿Limpiar la base de datos antes de restaurar? (recomendado) (y/N)${NC}"
read -r CLEAN_DB

if [ "$CLEAN_DB" = "y" ] || [ "$CLEAN_DB" = "Y" ]; then
    echo -e "${YELLOW}🧹 Limpiando base de datos...${NC}"
    
    if [ "$USE_DOCKER" = "true" ]; then
        # Matar conexiones activas y recrear DB en Docker
        docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1
        docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1
        docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    else
        # Matar conexiones activas y recrear DB localmente
        export PGSSLMODE="$SSLMODE"
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" > /dev/null 2>&1
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" > /dev/null 2>&1
    fi
    
    echo -e "${GREEN}✅ Base de datos limpiada${NC}"
fi

echo -e "${RED}¿Continuar con la restauración? Escribe 'CONFIRMAR' para proceder:${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "CONFIRMAR" ]; then
    echo "Cancelado"
    exit 0
fi

echo -e "${YELLOW}🔄 Restaurando backup...${NC}"

# Detectar si es Docker (localhost)
USE_DOCKER=false
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
    # Verificar si hay contenedor postgres corriendo
    if docker ps | grep -q postgres; then
        USE_DOCKER=true
        # Intentar encontrar el contenedor por nombre
        DOCKER_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
        if [ -z "$DOCKER_CONTAINER" ]; then
            DOCKER_CONTAINER=$(docker ps --format "{{.Names}}" | head -1)
        fi
    fi
fi

if [ "$USE_DOCKER" = "true" ]; then
    echo -e "${YELLOW}🐳 Usando contenedor Docker: ${DOCKER_CONTAINER}${NC}"
    docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
else
    # Configurar SSL usando variable de entorno
    export PGSSLMODE="$SSLMODE"
    
    # Restaurar usando psql local
    PGPASSWORD="$DB_PASS" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup restaurado exitosamente${NC}"
else
    echo -e "${RED}❌ Error al restaurar backup${NC}"
    exit 1
fi
