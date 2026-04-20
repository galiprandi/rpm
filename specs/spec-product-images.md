---
title: Sistema de Imágenes de Productos - GitHub + jsDelivr CDN
version: 1.0
date_created: 2026-04-20
last_updated: 2026-04-20
owner: RPM Team
tags: ["infrastructure", "design", "app"]
---

# Introduction

Esta especificación define el sistema de almacenamiento y serving de imágenes para productos, utilizando GitHub como repositorio de almacenamiento y jsDelivr como CDN global para serving. El sistema permite a los usuarios asociar una imagen opcional a cada producto, con redimensionamiento automático y configuración vía variables de entorno.

## 1. Purpose & Scope

**Purpose:** Proporcionar un sistema de imágenes de productos con costo cero, escalabilidad y control total, utilizando la infraestructura gratuita de GitHub y jsDelivr.

**Scope:**
- Upload de imágenes de productos desde el panel administrativo
- Redimensionamiento automático de imágenes
- Almacenamiento en repositorio GitHub dedicado
- Serving vía CDN global (jsDelivr)
- Serving vía BFF con fallback para productos sin imagen
- Eliminación de imágenes al reemplazarlas
- Configuración completa vía variables de entorno

**Intended Audience:** Desarrolladores del equipo RPM, administradores del sistema.

**Assumptions:**
- El repositorio de imágenes será público para permitir serving vía jsDelivr
- El GitHub token tendrá permisos de escritura en el repositorio
- Las imágenes serán predominantemente fotografías de productos (JPEG recomendado)

## 2. Definitions

| Término | Definición |
|--------|------------|
| **jsDelivr** | CDN global gratuito que sirve archivos desde repositorios GitHub públicos |
| **GitHub API** | API REST de GitHub para operaciones de upload/eliminación de archivos |
| **Sharp** | Librería de Node.js para procesamiento de imágenes (redimensionamiento) |
| **GitHub Token** | Token de autenticación de GitHub con permisos `repo` o `public_repo` |
| **Product Image** | Imagen opcional asociada a un producto, mostrada en la web pública |

## 3. Requirements, Constraints & Guidelines

### Requisitos Funcionales

- **REQ-001**: El sistema debe permitir asociar una imagen opcional a cada producto
- **REQ-002**: Las imágenes deben redimensionarse automáticamente al tamaño configurado (default 500x500px)
- **REQ-003**: Las imágenes deben almacenarse en un repositorio GitHub dedicado
- **REQ-004**: Las imágenes deben servirse vía CDN global (jsDelivr)
- **REQ-005**: El sistema debe eliminar la imagen anterior al reemplazarla
- **REQ-006**: El sistema debe permitir eliminar la imagen de un producto
- **REQ-007**: La configuración (repo, token, tamaño, calidad) debe manejarse vía variables de entorno
- **REQ-008**: El BFF debe servir un endpoint que retorne la imagen del producto o una imagen de fallback si no tiene imagen configurada

### Requisitos No Funcionales

- **PERF-001**: El serving de imágenes debe utilizar CDN global para baja latencia
- **PERF-002**: El redimensionamiento debe ocurrir en el servidor antes del upload
- **SEC-001**: El GitHub token debe almacenarse en variables de entorno, nunca en código
- **SEC-002**: Las URLs de imágenes deben ser públicas (no firmadas)
- **SCAL-001**: El sistema debe soportar hasta ~20,000 imágenes (límite GitHub Free Tier)
- **COST-001**: El sistema debe tener costo cero de infraestructura

### Constraints

- **CON-001**: Tamaño máximo por archivo: 100MB (límite GitHub)
- **CON-002**: Almacenamiento total: 1GB (límite GitHub Free Tier)
- **CON-003**: Formatos soportados: JPEG, PNG, WebP
- **CON-004**: El repositorio de imágenes debe ser público para jsDelivr
- **CON-005**: El branch de trabajo debe seguir el formato `feat/{feature-name}`

### Guidelines

- **GUD-001**: Usar JPEG con calidad 85% como formato default (balance tamaño/calidad)
- **GUD-002**: Mantener aspect ratio al redimensionar (crop si necesario)
- **GUD-003**: Usar nombres de archivo basados en Product ID para consistencia
- **GUD-004**: Guardar el SHA del commit en el producto para tracking
- **GUD-005**: Implementar reintentos para operaciones de GitHub API (rate limits)

## 4. Interfaces & Data Contracts

### Variables de Entorno

```bash
# Configuración del repositorio de imágenes
PRODUCT_IMAGES_REPO=galiprandi/rpm-product-images
PRODUCT_IMAGES_BRANCH=main

# GitHub Token (permisos: repo o public_repo)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Configuración de procesamiento de imágenes
PRODUCT_IMAGE_MAX_WIDTH=500
PRODUCT_IMAGE_MAX_HEIGHT=500
PRODUCT_IMAGE_QUALITY=85
PRODUCT_IMAGE_FORMAT=jpeg
```

### Schema Prisma

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  // ... otros campos existentes
  
  // Campos nuevos para imágenes
  imageUrl?     String?  // URL completa (jsDelivr CDN)
  imageCommit?  String?  // SHA del commit para tracking/rollback
  imageBranch?  String?  @default("main") // Branch donde se almacenó
  
  @@index([imageUrl])
}
```

### API Contract - Upload de Imagen

**Endpoint:** `POST /api/products/{id}/image`

**Request:**
```typescript
{
  file: File  // Multipart form data
}
```

**Response:**
```typescript
{
  imageUrl: string,      // https://cdn.jsdelivr.net/gh/...
  imageCommit: string,    // abc123def456...
  width: number,          // 500
  height: number,         // 500
  size: number,           // 45000 (bytes)
  format: string          // "jpeg"
}
```

### API Contract - Eliminar Imagen

**Endpoint:** `DELETE /api/products/{id}/image`

**Response:**
```typescript
{
  success: boolean,
  deletedCommit: string  // SHA del commit eliminado
}
```

### API Contract - Obtener Imagen (BFF con Fallback)

**Endpoint:** `GET /api/products/{id}/image`

**Response:**
- Si el producto tiene `imageUrl`: Redirección (307) a la URL jsDelivr
- Si el producto no tiene `imageUrl`: Imagen de fallback (SVG generado dinámicamente)

**Headers:**
```
Content-Type: image/svg+xml (para fallback)
Cache-Control: public, max-age=3600
```

**Fallback Image:**
- Formato: SVG generado dinámicamente
- Tamaño: 500x500px
- Contenido: Icono de producto placeholder con texto "Sin imagen"
- Color: Gris neutro (#e5e7eb)

### Estructura del Repositorio de Imágenes

```
rpm-product-images/
├── products/
│   ├── prod_abc123.jpg
│   ├── prod_def456.jpg
│   └── prod_ghi789.jpg
├── .gitkeep
└── README.md
```

### URL Pattern (jsDelivr)

```
https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/products/{productId}.jpg

Ejemplo:
https://cdn.jsdelivr.net/gh/galiprandi/rpm-product-images@main/products/prod_abc123.jpg
```

## 5. Acceptance Criteria

- **AC-001**: Given un producto sin imagen, When el usuario sube una imagen, Then la imagen se redimensiona a 500x500px, se sube a GitHub, se guarda la URL en DB y se puede visualizar
- **AC-002**: Given un producto con imagen, When el usuario sube una nueva imagen, Then la imagen anterior se elimina de GitHub, la nueva se redimensiona y sube, y la URL se actualiza en DB
- **AC-003**: Given un producto con imagen, When el usuario elimina la imagen, Then el archivo se elimina de GitHub y el campo imageUrl se nullifica en DB
- **AC-004**: Given las variables de entorno configuradas, When se inicia la aplicación, Then el sistema usa esas configuraciones para todas las operaciones de imágenes
- **AC-005**: Given una imagen de 2000x2000px, When se sube, Then se redimensiona a 500x500px manteniendo calidad
- **AC-006**: Given una imagen de 300x800px, When se sube, Then se redimensiona a 500x500px con crop center
- **AC-007**: Given el repositorio de imágenes en branch `feat/product-images`, When se sube una imagen, Then se usa ese branch para el commit
- **AC-008**: Given una imagen subida, When se accede a la URL jsDelivr, Then la imagen se sirve desde CDN global con baja latencia
- **AC-009**: Given un producto sin imagen, When se accede al endpoint BFF `/api/products/{id}/image`, Then se retorna una imagen de fallback SVG con texto "Sin imagen"
- **AC-010**: Given un producto con imagen, When se accede al endpoint BFF `/api/products/{id}/image`, Then se redirige (307) a la URL jsDelivr de la imagen

## 6. Test Automation Strategy

### Test Levels

- **Unit Tests**: 
  - Funciones de redimensionamiento con Sharp
  - Validación de formato y tamaño de imágenes
  - Construcción de URLs jsDelivr
  - Manejo de errores de GitHub API

- **Integration Tests**:
  - Upload real a GitHub (usando repo de test)
  - Eliminación de archivos en GitHub
  - Actualización de campos en DB
  - Manejo de rate limits de GitHub API

- **End-to-End Tests**:
  - Flujo completo: upload → redimensionamiento → GitHub → DB → serving
  - Reemplazo de imagen
  - Eliminación de imagen
  - Validación visual en web pública

### Frameworks

- **Unit**: Vitest
- **Integration**: Vitest + GitHub API (mock repo)
- **E2E**: Playwright

### Test Data Management

- Usar imágenes de prueba en `tests/fixtures/images/`
- Repo de test dedicado: `rpm-product-images-test`
- Cleanup automático después de cada test

### CI/CD Integration

- Ejecutar tests unitarios en cada PR
- Tests de integración en workflow de CI (con secrets de GitHub)
- Tests E2E en deploy a staging

### Coverage Requirements

- Mínimo 80% de cobertura para funciones de procesamiento de imágenes
- Mínimo 70% para integración con GitHub API

### Performance Testing

- Validar tiempo de redimensionamiento < 2s para imágenes 5MB
- Validar tiempo de upload a GitHub < 5s para imágenes 500KB
- Validar tiempo de respuesta CDN < 200ms

## 7. Rationale & Context

**Why GitHub + jsDelivr?**
- **Costo cero**: GitHub Free Tier + jsDelivr gratis
- **Escalabilidad**: ~20,000 imágenes suficientes para el caso de uso
- **CDN global**: jsDelivr provee serving rápido worldwide
- **Control total**: Versionado Git, rollback posible
- **Simplicidad**: Sin infra adicional (no Lambda, no S3)

**Why variables de entorno?**
- Flexibilidad para cambiar configuración sin código
- Seguridad: tokens nunca en código
- Multi-entorno: distinto repo para dev/staging/prod
- Facilita testing con configuraciones diferentes

**Why redimensionamiento en servidor?**
- Consistencia: todas las imágenes con mismo tamaño
- Ahorro de espacio: imágenes optimizadas antes de upload
- Control de calidad: parámetros centralizados

**Why 500x500px default?**
- Balance entre calidad y tamaño (~40-50KB por imagen)
- Suficiente para thumbnails y visualización en web pública
- Permite ~20,000 imágenes en 1GB

## 8. Dependencies & External Integrations

### External Systems

- **EXT-001**: GitHub - Almacenamiento de imágenes y versionado
  - Integration type: REST API
  - Required: GitHub token con permisos `repo` o `public_repo`
  - SLA: 99.9% (GitHub uptime)

### Third-Party Services

- **SVC-001**: jsDelivr - CDN global para serving
  - Required capabilities: Serving de archivos desde GitHub repos
  - SLA: 99.9% (jsDelivr uptime)
  - Cost: $0

### Infrastructure Dependencies

- **INF-001**: GitHub Free Tier
  - Requirements: 1GB storage, 100MB/file max
  - Constraints: Public repo required for jsDelivr

### Data Dependencies

- **DAT-001**: Productos en base de datos
  - Format: Prisma PostgreSQL
  - Access: Via Prisma Client
  - Required: Product ID para nombrar archivo

### Technology Platform Dependencies

- **PLT-001**: Node.js runtime
  - Version: >= 18
  - Required: Sharp library para procesamiento de imágenes

- **PLT-002**: Next.js
  - Version: 15.x
  - Required: API routes para upload/eliminación

### Compliance Dependencies

- **COM-001**: GitHub Terms of Service
  - Impact: Respetar límites de storage y rate limits
  - Required: No exceder 1GB storage, 100MB/file

## 9. Examples & Edge Cases

### Example 1: Upload Exitoso

```typescript
// Request
POST /api/products/prod_abc123/image
Content-Type: multipart/form-data

file: [binary image data]

// Response
{
  "imageUrl": "https://cdn.jsdelivr.net/gh/galiprandi/rpm-product-images@main/products/prod_abc123.jpg",
  "imageCommit": "abc123def456789...",
  "width": 500,
  "height": 500,
  "size": 45000,
  "format": "jpeg"
}
```

### Example 2: Reemplazo de Imagen

```typescript
// 1. Upload inicial
POST /api/products/prod_abc123/image
→ imageUrl: ".../prod_abc123.jpg"
→ imageCommit: "sha1"

// 2. Reemplazo
POST /api/products/prod_abc123/image
→ Elimina: "prod_abc123.jpg" (commit sha1)
→ Sube: "prod_abc123.jpg" (nuevo)
→ imageUrl: ".../prod_abc123.jpg" (misma URL, nuevo contenido)
→ imageCommit: "sha2"
```

### Edge Case 1: Imagen muy grande

```typescript
// Input: 10MB, 4000x4000px
// Procesamiento:
// 1. Redimensionar a 500x500px
// 2. Comprimir JPEG calidad 85%
// 3. Resultado: ~45KB
// 4. Upload a GitHub
```

### Edge Case 2: Rate limit de GitHub API

```typescript
// GitHub API rate limit: 5000 requests/hour
// Estrategia:
// 1. Implementar retry con exponential backoff
// 2. Cache de resultados cuando sea posible
// 3. Bulk operations para migraciones
```

### Edge Case 3: Formato no soportado

```typescript
// Input: file.bmp (no soportado)
// Respuesta:
{
  "error": "UNSUPPORTED_FORMAT",
  "message": "Formato BMP no soportado. Use JPEG, PNG o WebP.",
  "supportedFormats": ["jpeg", "png", "webp"]
}
```

### Edge Case 4: Repo no existe

```typescript
// PRODUCT_IMAGES_REPO=inexistente/repo
// Respuesta:
{
  "error": "REPO_NOT_FOUND",
  "message": "El repositorio configurado no existe o no tienes acceso."
}
```

### Example 3: Endpoint BFF con Fallback

```typescript
// Request
GET /api/products/prod_abc123/image

// Caso 1: Producto con imagen
// Response: 307 Redirect
Location: https://cdn.jsdelivr.net/gh/galiprandi/rpm-product-images@main/products/prod_abc123.jpg

// Caso 2: Producto sin imagen
// Response: 200 OK
Content-Type: image/svg+xml
Cache-Control: public, max-age=3600

[SVG data: 500x500px placeholder con texto "Sin imagen"]
```

## 10. Validation Criteria

- **VAL-001**: Las imágenes redimensionadas mantienen aspect ratio o crop center
- **VAL-002**: El tamaño de las imágenes redimensionadas no excede el configurado
- **VAL-003**: Las URLs jsDelivr son accesibles públicamente
- **VAL-004**: El SHA del commit se guarda correctamente en DB
- **VAL-005**: Las imágenes eliminadas no quedan huérfanas en GitHub
- **VAL-006**: Las variables de entorno se validan al inicio de la app
- **VAL-007**: El sistema maneja rate limits de GitHub API con retries
- **VAL-008**: El sistema soporta hasta 20,000 imágenes sin exceder 1GB

## 11. Related Specifications / Further Reading

- [Database Schema](./SYSTEM_SPEC.md) - Schema de Prisma
- [API Documentation](./api.md) - Endpoints de la API
- [Components Specification](./components.md) - Componentes UI
- [GitHub REST API](https://docs.github.com/en/rest)
- [jsDelivr Documentation](https://www.jsdelivr.com/)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
