# Plan de Verificación de Seguridad - Debug Auth Bypass

## Objetivo
Validar que el sistema de Debug Auth permite bypass de autenticación en desarrollo sin introducir brechas de seguridad en producción.

## Alcance
- Endpoint API: `/api/auth/debug`
- Helper de Playwright: `tests/playwright/helpers/auth.ts`
- Middleware de sesión: `lib/auth-server.ts`
- Configuración: `auth.ts`

## Matriz de Pruebas

### 1. Pruebas de Seguridad (Críticas)

#### 1.1. Isolación de Entornos
| ID | Prueba | Criterio de Éxito | Prioridad |
|----|--------|-------------------|-----------|
| SEC-01 | Endpoint rechaza requests en NODE_ENV=production | HTTP 403 Forbidden | P0 |
| SEC-02 | Endpoint rechaza requests sin DEBUG_AUTH_ENABLED=true | HTTP 403 Forbidden | P0 |
| SEC-03 | Debug session no accesible en build de producción | Redirect a login | P0 |
| SEC-04 | Variables de debug no expuestas al cliente | No en NEXT_PUBLIC_* | P1 |

#### 1.2. Protección de Cookies
| ID | Prueba | Criterio de Éxito | Prioridad |
|----|--------|-------------------|-----------|
| SEC-05 | Cookie es HttpOnly | httpOnly: true | P0 |
| SEC-06 | Cookie tiene SameSite protection | sameSite: 'lax' | P1 |
| SEC-07 | Cookie no es Secure en dev (localhost) | secure: false | P1 |
| SEC-08 | Cookie tiene path restringido | path: '/' | P1 |

#### 1.3. Validación de Roles
| ID | Prueba | Criterio de Éxito | Prioridad |
|----|--------|-------------------|-----------|
| SEC-09 | USER no puede acceder a /adm | Redirect a / | P0 |
| SEC-10 | STAFF puede acceder a /adm limitado | HTTP 200 | P0 |
| SEC-11 | ADMIN puede acceder a /adm completo | HTTP 200 | P0 |
| SEC-12 | Rol inválido retorna error | HTTP 400 Bad Request | P1 |

### 2. Pruebas Funcionales

#### 2.1. API Debug
| ID | Prueba | Método | Expected | Prioridad |
|----|--------|--------|----------|-----------|
| FUNC-01 | Crear sesión ADMIN | POST | 200 + cookie | P0 |
| FUNC-02 | Crear sesión STAFF | POST | 200 + cookie | P0 |
| FUNC-03 | Crear sesión USER | POST | 200 + cookie | P0 |
| FUNC-04 | Limpiar sesión | DELETE | 200 + cookie borrada | P0 |
| FUNC-05 | Verificar estado de sesión | GET | 200 + user info | P1 |

#### 2.2. Integración Playwright
| ID | Prueba | Helper | Expected | Prioridad |
|----|--------|--------|----------|-----------|
| FUNC-06 | Login como ADMIN | loginAs() | Sesión creada | P0 |
| FUNC-07 | Login como STAFF | loginAs() | Sesión creada | P0 |
| FUNC-08 | Login como USER | loginAs() | Sesión creada | P0 |
| FUNC-09 | Logout limpia sesión | logout() | Cookie borrada | P0 |
| FUNC-10 | Cambio de rol en runtime | loginAs() x2 | Nueva sesión | P1 |

### 3. Pruebas de Penetración

#### 3.1. Ataques de Fuerza Bruta
| ID | Prueba | Payload | Expected | Prioridad |
|----|--------|---------|----------|-----------|
| PENT-01 | Rol inexistente | { role: 'HACKER' } | 400 | P1 |
| PENT-02 | SQL Injection en rol | { role: "'; DROP TABLE--" } | 400 | P1 |
| PENT-03 | XSS en campo rol | { role: '<script>alert(1)</script>' } | 400 | P1 |
| PENT-04 | Null byte injection | { role: 'ADMIN\x00' } | 400 | P1 |

#### 3.2. Manipulación de Cookies
| ID | Prueba | Acción | Expected | Prioridad |
|----|--------|--------|----------|-----------|
| PENT-05 | Cookie modificada manualmente | Alterar JSON | Sesión inválida | P1 |
| PENT-06 | Cookie de otro dominio | Cross-domain | Rechazada | P1 |
| PENT-07 | Cookie sin HttpOnly | JavaScript access | No accesible | P1 |
| PENT-08 | Cookie expirada | Max-Age: 0 | Rechazada | P1 |

#### 3.3. Escalación de Privilegios
| ID | Prueba | Secuencia | Expected | Prioridad |
|----|--------|-----------|----------|-----------|
| PENT-09 | USER intenta acceder a /adm/users | Login USER → GET | Redirect / | P0 |
| PENT-10 | Cambio de rol sin re-autenticación | USER → ADMIN directo | Sesión nueva | P1 |
| PENT-11 | Session fixation | Cookie fija | Nueva sesión | P1 |

## Checklist de Validación

### Pre-requisitos
- [ ] Servidor corriendo en puerto 3000
- [ ] `.env.local` con DEBUG_AUTH_ENABLED=true
- [ ] Base de datos inicializada
- [ ] Playwright configurado

### Ejecución de Pruebas
- [ ] SEC-01 a SEC-04: Entorno
- [ ] SEC-05 a SEC-08: Cookies
- [ ] SEC-09 a SEC-12: Roles
- [ ] FUNC-01 a FUNC-05: API
- [ ] FUNC-06 a FUNC-10: Playwright
- [ ] PENT-01 a PENT-11: Seguridad

### Certificación
- [ ] Ninguna prueba de seguridad P0 falló
- [ ] No hay fuga de datos de sesión
- [ ] Producción NO afectada
- [ ] Documentación actualizada

## Herramientas
- Playwright MCP para pruebas E2E
- Browser DevTools para inspección de cookies
- curl/httpie para pruebas de API
- Lighthouse para auditoría de seguridad
