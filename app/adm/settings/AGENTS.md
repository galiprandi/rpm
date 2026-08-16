# AGENTS.md - Settings Domain

## Domain Overview

Configuración global de la aplicación incluyendo tema visual, parámetros de negocio (márgenes), y configuración fiscal AFIP con subida de certificados.

## Related Specifications

- **@[specs/spec-price-lists.md]** - Configuración de margen mínimo global para alertas
- **@[specs/ui-architecture-adm.md]** - Definición de temas y paleta de colores
- **@[specs/features/afip-integration.md]** - Integración AFIP y comprobantes fiscales

## Key Components

- `page.tsx` - Configuración general con cards por sección (server component, lee settings + certStatus)
- `SettingsClient.tsx` - Client component con estado de settings y certificado
- `SettingItem` - Componente reutilizable para items de configuración
- `ThemeSelector` - Selector de tema visual

## Architecture

- **Tipo**: Configuración (sin CRUD tradicional)
- **Secciones**: Apariencia (tema), Listas de Precios (márgenes), Fiscal (AFIP), Finanzas (link), Seguridad (link)
- **Datos**: Guardados en tabla `Setting` (key-value)
- **Validaciones**: Rangos específicos por tipo de configuración

## Configuración Fiscal (AFIP)

### Settings guardados en DB (tabla `setting`)

- `AFIP_CUIT` - CUIT del emisor (11 dígitos)
- `AFIP_PUNTO_VENTA` - Punto de venta habilitado
- `AFIP_RESPONSABLE` - RI | MONOTRIBUTO | EXENTO
- `AFIP_PRODUCTION` - true/false (homologación vs producción)

### Certificado (.p12) cifrado en DB

- `AFIP_CERT_DATA` - Certificado cifrado (AES-256-GCM, base64)
- `AFIP_CERT_IV` - Vector de inicialización (base64)
- `AFIP_CERT_AUTH_TAG` - Auth tag de GCM (base64)
- `AFIP_CERT_PASS_DATA` - Password del cert cifrado (base64)
- `AFIP_CERT_PASS_IV` / `AFIP_CERT_PASS_AUTH_TAG` - Vectores del password
- `AFIP_CERT_UPLOADED_AT` - Timestamp de última subida
- `AFIP_CERT_EXPIRES_AT` - Fecha de vencimiento (notAfter) extraída con node-forge al subir

### Master key (env var, no en DB)

- `AFIP_CERT_MASTER_KEY` - 32 bytes en base64. Requerida para cifrar/descifrar. Si no está, el sistema opera en modo mock

### Health check (`getCertHealth()`)

Devuelve `{ state, uploadedAt, expiresAt, detail }` con 5 estados:
- `ready` - cert descifrable + no vencido → AFIP real
- `missing` - no hay cert en DB → mock
- `no-master-key` - falta env var → mock
- `expired` - vencido (notAfter en el pasado) → mock
- `invalid` - corrupto o master key rotada → mock

### Endpoints

- `GET/PUT /api/settings` - Settings generales (margen, CUIT, PV, responsable, producción)
- `GET/POST/DELETE /api/afip/certificate` - Upload/eliminar/consultar certificado (admin only). GET devuelve el health state granular
- `POST /api/afip/test-connection` - Test de conexión con AFIP (usa mock o real según health)

### UI de certificado (estados granulares)

- **ready** (emerald): "Certificado configurado" + fecha subida + vencimiento. Si faltan ≤30 días, amber con countdown
- **expired** (red): "Certificado vencido" + detalle + botón "Renovar certificado"
- **invalid** (red): "Certificado inválido o corrupto" + botones "Reemplazar" / "Eliminar"
- **no-master-key** (amber): "Modo simulación (sin master key)" + botón upload deshabilitado
- **missing** (amber): "Sin certificado" + botón "Subir certificado"
- Form de subida: input file (.p12/.pfx) + input password + botón "Confirmar"
- **Nunca expone** el contenido del certificado ni el password en la UI

## Development Notes

- Usa `SettingItem` para consistencia visual
- Configuración de margen mínimo impacta alertas en listas de precios
- Selector de tema para personalización visual
- Validaciones en frontend (rango 0-100 para márgenes, 11 dígitos para CUIT)
- API REST para guardar/recuperar configuraciones
- No usa `CrudAdmin` - es una página de configuración específica
- `SettingsClient` recibe `initialCertStatus` desde el server component para evitar flash de estado
