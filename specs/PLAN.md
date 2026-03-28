# 📋 Plan de Acción - RPM Accesorios

**Estado**: Definición completada | **Fase actual**: Pre-implementación Fase 1  
**Última actualización**: 2026-03-28

---

## 🎯 Visión del Sistema

Sistema integral para gestión de taller de accesorios vehiculares con:
- **Desktop** (`/adm/*`): Administración completa, mostrador, reportes
- **Mobile PWA** (`/m/*`): Taller optimizado, chatbot "Ger" para operaciones
- **Ger (Multi-Agente)**: Asistente IA con un agente por rol (técnico, vendedor, admin)

---

## ✅ DEFINIDO - Especificaciones Completadas

### 1. Arquitectura de UI
| Spec | Estado | Ubicación |
|------|--------|-----------|
| Arquitectura Desktop/Mobile | ✅ | `/specs/ui-architecture.md` |
| Navegación y componentes mobile | ✅ | Incluido en spec |
| PWA configuración | ✅ | Incluido en spec |

### 2. Sistema de Autenticación y Roles
| Componente | Estado | Ubicación |
|-------------|--------|-----------|
| Auth con NextAuth.js v5 | ✅ | `/specs/auth.md` |
| Roles DB-driven (UserRole) | ✅ | `/prisma/schema.prisma` + `/specs/auth.md` |
| Prisma Studio para CRUD roles | ✅ | Definido en auth.md |
| Flujo async role retrieval | ✅ | `/specs/auth.md` callbacks |

### 3. Ger - Sistema Multi-Agente
| Componente | Estado | Ubicación |
|-------------|--------|-----------|
| Arquitectura multi-agente | ✅ | `/specs/bot.md` |
| Nombre e identidad (Ger) | ✅ | `/specs/bot.md` |
| Comportamiento esperado | ✅ | `/specs/bot.md` |
| Prompts compuestos (.md) | ✅ | `/specs/bot.md` |
| **Formato de presentación** | ✅ | `/specs/ger-formatting.md` |
| Tools por rol | ✅ | `/specs/bot.md` |
| Implementación con Vercel AI SDK | ✅ | `/specs/bot.md` |

### 4. Dominios de Negocio
| Dominio | Spec | API Endpoints | Estado |
|---------|------|---------------|--------|
| Stock & Ventas | `/specs/inventory-sales.md` | ✅ Definidos | ✅ |
| Taller (OTs) | `/specs/workshop.md` | ✅ Definidos | ✅ |
| Web Pública | `/specs/public-web.md` | ✅ Definidos | ✅ |
| AFIP Facturación | `/specs/afip-integration.md` | ✅ Estrategia | ✅ |

### 5. Arquitectura Técnica Base
| Componente | Spec | Estado |
|------------|------|--------|
| API REST | `/specs/api.md` | ✅ |
| Data Architecture | `/specs/data-architecture.md` | ✅ |
| Database/Prisma | `/specs/database.md` | ✅ |
| Core/Infra | `/specs/core.md` | ✅ |
| System Spec | `/specs/SYSTEM_SPEC.md` | ✅ |

### 6. Roadmap
| Componente | Estado | Ubicación |
|-------------|--------|-----------|
| Fases de implementación | ✅ | `/specs/implementation-roadmap.md` |
| Ger en Fase 2 | ✅ | Actualizado en roadmap |
| Estimaciones y equipo | ✅ | Incluido |

---

## 🚧 EN PROGRESO / PENDIENTE DE DEFINIR

| Tarea | Prioridad | Bloqueado por | Notas |
|-------|-----------|---------------|-------|
| Seed script UserRole | Media | - | Crear roles iniciales (ADMIN, SELLER, TECHNICIAN, CASHIER) |
| Flujo de migración datos | Baja | Fase 1 estable | Definir cuando se acerque go-live |
| Detalle de UI components | Baja | Inicio implementación | Shadcn/ui + diseño específico |
| Test strategy E2E | Baja | Fase 1 funcional | Playwright tests |
| Video tutoriales | Baja | Cada fase | Loom/YouTube unlisted |

---

## 📅 Roadmap Ejecutivo

```
FASE 1: MVP Stock & Ventas (4-6 semanas)
├── Semana 1-2: Auth + Roles DB + Productos básicos
├── Semana 3-4: AFIP sandbox + Facturación
└── Semana 5-6: Caja + Reportes simples

FASE 2: Taller + Ger (6-8 semanas) ⭐ INCLUYE BOT
├── Semana 1-2: Clientes + Vehículos + Presupuestos
├── Semana 3-4: OTs + Checklists + Fotos
├── Semana 5-6: Agenda interna
└── Semana 7-8: GER - Setup LLM + Tools + Chat mobile ⭐

FASE 3: Web Pública (4-6 semanas)
├── Web informativa + SEO
├── Turnos online
└── Consulta por patente

FASE 4+: Mejoras Contínuas
├── Mes 4-6: Ger Phase 2 (rich cards, notificaciones proactivas)
└── Escalabilidad según necesidad
```

---

## 🚀 Próximos Pasos Inmediatos (Para empezar Fase 1)

### Semana 1 - Checklist de Inicio

- [ ] **Database**: Verificar conexión Prisma + PostgreSQL
- [ ] **Auth**: Configurar NextAuth.js v5 con Google OAuth
- [ ] **UserRole**: Crear tabla y seed inicial de roles
- [ ] **Producto**: Modelo Prisma + CRUD básico
- [ ] **Layout Desktop**: Sidebar + estructura `/adm/*`

### Dependencias Externas
- [ ] **AFIP**: Confirmar requisitos WS facturación (contador)
- [ ] **Google OAuth**: Crear credentials en Google Cloud Console
- [ ] **OpenAI**: Crear cuenta + API key (para Ger en Fase 2)

---

## 📚 Referencias Rápidas

| Necesitas... | Ve a... |
|-------------|---------|
| Entender el negocio | `/specs/business-domain.md` |
| Ver arquitectura técnica | `/specs/core.md` + `/specs/api.md` |
| Implementar auth | `/specs/auth.md` + `/prisma/schema.prisma` |
| Entender Ger (bot) | `/specs/bot.md` (arquitectura multi-agente) |
| Ver flujo mobile | `/specs/ui-architecture.md` |
| Plan de implementación | `/specs/implementation-roadmap.md` |
| Modelos de datos | `/specs/data-architecture.md` |

---

## 📊 Métricas de Definición

| Métrica | Valor |
|---------|-------|
| Specs creadas/actualizadas | 11+ |
| Archivos de prompts Ger definidos | 6 (base + 3 roles) |
| Tools por rol definidas | 5-8 por rol |
| Fases de roadmap | 4 |
| Dominios de negocio cubiertos | 4 |

---

**Próxima revisión**: Al inicio de implementación Fase 1  
**Responsable**: Tech Lead (a definir)
