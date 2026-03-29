# 🗺️ Plan de Implementación RPM

## Visión General

```
2024 Q3-Q4    2025 Q1        2025 Q2        2025 Q3+
   │            │              │              │
   ▼            ▼              ▼              ▼
┌──────┐    ┌──────┐       ┌──────┐       ┌──────┐
│ FASE │───▶│ FASE │──────▶│ FASE │──────▶│FASE 4│
│  1   │    │  2   │       │  3   │       │  4+  │
│MVP   │    │Taller│       │ Web  │       │Scale │
│Stock │    │      │       │      │       │      │
└──────┘    └──────┘       └──────┘       └──────┘
 4-6 sem    6-8 semanas    4-6 semanas    Contínuo
```

---

## FASE 1: MVP Stock & Ventas
### Duración: 4-6 semanas | Objetivo: Reemplazar sistema actual

#### Semana 1-2: Fundamentos
- [x] Setup proyecto, base de datos, auth con roles JWT
- [x] CRUD Productos, Categorías y Proveedores (ADMIN: full, SELLER: view)
- [x] CRUD Usuarios con gestión de roles (solo ADMIN) ⭐ NUEVO
- [ ] Control stock simple
- [x] Seed datos iniciales

**Roles Fase 1**: `ADMIN` (configuración, productos), `SELLER` (ventas, facturación)

#### Semana 3-4: Facturación AFIP
- [ ] Setup certificados AFIP Sandbox (2h)
- [ ] Integración AFIP WS con afip.js - Factura B (3 días)
- [ ] Generación comprobantes con CAE
- [ ] Impresión tickets PDF
- [ ] Libro IVA simple (export)

**Spec AFIP**: `/specs/afip-integration.md`

#### Semana 5-6: Ventas y Cierre
- [ ] Pantalla venta rápida (mostrador)
- [ ] Carrito y checkout
- [ ] Cierre de caja
- [ ] Reporte simple

#### Go-Live FASE 1
- Migración datos sistema anterior
- Capacitación equipo (1-2 días)
- Paralelo 3-5 días (solo si es necesario)
- **Sistema viejo OFF**

#### Métricas de Éxito
- 100% de ventas en nuevo sistema
- 0 errores fiscales críticos
- < 2 min por transacción

---

## 🚀 PRÓXIMO PASO INMEDIATO: Gestión de Órdenes de Trabajo (OTs)
### Duración: 2-3 semanas | Prioridad: ALTA | Branch: `feature/work-orders`

**Objetivo**: Implementar el sistema completo de órdenes de trabajo para digitalizar la operación del taller.

### Semana 1: Fundamentos OT
- [ ] Setup modelos de datos (Customer, Vehicle, WorkOrder)
- [ ] API endpoints base CRUD
- [ ] Estados de OT: `PENDING` → `CONFIRMED` → `IN_PROGRESS` → `READY` → `DELIVERED`
- [ ] UI Kanban básica

### Semana 2: Funcionalidad Core
- [ ] Crear OT desde presupuesto
- [ ] Crear OT directa (sin presupuesto)
- [ ] Asignación de técnicos
- [ ] Vista detalle de OT

### Semana 3: Checklists y Fotos
- [ ] Checklist de ingreso
- [ ] Checklist de calidad salida
- [ ] Registro fotográfico (antes/después)
- [ ] Integración con Bot (tools básicas)

**Spec**: `/specs/workshop.md`

---

## FASE 2: Gestión de Taller (Extendida)
### Duración: 6-8 semanas | Dependencia: FASE 1 estable

#### Semana 1-2: Clientes y Vehículos
- [ ] Fichas clientes
- [ ] Registro vehículos por patente
- [ ] Historial básico

**Roles Fase 2**: Agrega `TECHNICIAN` (OTs asignadas, checklists)

#### Semana 3-4: Presupuestos
- [ ] Creación presupuestos
- [ ] Aprobación/Rechazo
- [ ] Vencimiento automático

**Permisos**: SELLER crea, ADMIN aprueba/rechaza

#### Semana 5-6: Órdenes de Trabajo
- [ ] Kanban estados
- [ ] Asignación técnicos (ADMIN)
- [ ] Checklists ingreso/salida (TECHNICIAN)
- [ ] Registro fotográfico (TECHNICIAN)

#### Semana 7-8: RPM Bot (Asistente IA) ⭐ NUEVO
- [ ] Setup arquitectura LLM + Tools
- [ ] Tools básicas: `get_my_work_orders`, `update_work_order_status`
- [ ] Chat interface mobile (PWA)
- [ ] Voice-to-text integration
- [ ] Tests con técnicos (feedback loop)

**Specs**: `/specs/bot.md` + `/specs/ui-architecture.md`

#### Go-Live FASE 2
- Capacitación técnicos (desktop + mobile + bot)
- Proceso OT en paralelo 1 semana
- Ajustes flujo según feedback

---

## FASE 3: Web Pública & Turnos
### Duración: 4-6 semanas | Dependencia: FASE 1 y 2

#### Semana 1-2: Web Informativa
- [ ] Diseño y maquetación
- [ ] Home, servicios, contacto
- [ ] Galería trabajos
- [ ] SEO básico

#### Semana 3-4: Turnero
- [ ] Calendario disponible
- [ ] Formulario reserva
- [ ] Panel aprobación admin
- [ ] Notificaciones email/WhatsApp

#### Semana 5-6: Consulta Clientes
- [ ] Consulta por patente
- [ ] Historial resumido
- [ ] Descarga facturas

#### Go-Live FASE 3
- Lanzamiento web
- Publicidad local (redes)
- Monitoreo conversiones

---

## FASE 4+: Mejoras Contínuas
### Post-lanzamiento: Iteraciones mensuales

#### Mes 1-3: Estabilización
- Bug fixes prioridad alta
- Optimizaciones performance
- Ajustes UX según feedback

#### Mes 4-6: Quick Wins + RPM Bot Avanzado
- Importación masiva Excel
- Reportes avanzados
- **RPM Bot Phase 2**:
  - Rich cards (fotos, QR codes)
  - Proactive notifications
  - Tools para vendedores (consultas stock, ventas)

**Costos adicionales Bot**: ~$10-20/mes (OpenAI API)  
**Spec Bot**: `/specs/bot.md`

#### Mes 7-12: Escalabilidad
- Multi-sucursal (si aplica)
- CRM avanzado
- Marketing automatizado

---

## Estructura de Equipo Sugerida

### FASE 1-2 (MVP + Taller)
| Rol | Dedicación | Responsabilidad |
|-----|------------|-----------------|
| **Tech Lead** | Full-time | Arquitectura, code reviews |
| **Full-stack Dev** | Full-time | Frontend, backend |
| **DevOps/QA** | Part-time | Deploy, tests básicos |

### FASE 3+ (Web + Escalabilidad)
| Rol | Dedicación | Responsabilidad |
|-----|------------|-----------------|
| **Tech Lead** | Full-time | Continuidad |
| **Full-stack Dev (2)** | Full-time | Features nuevas |
| **Frontend Especialista** | Part-time | UX/UI avanzado |
| **QA Automatizado** | Part-time | Tests E2E |

---

## Presupuesto Estimado

### FASE 1: USD $4,000 - $6,000
- Desarrollo: 4-6 semanas × 2 devs
- Infra: Vercel + DB (~$50/mes)
- AFIP: Consultor/contador para WS
- Extras: Lector códigos de barras

### FASE 2: USD $6,000 - $9,000
- Desarrollo: 6-8 semanas × 2 devs
- Almacenamiento fotos: ~$20/mes
- Notificaciones SMS: ~$30/mes

### FASE 3: USD $4,000 - $6,000
- Desarrollo: 4-6 semanas × 2 devs
- Hosting web: incluido Vercel
- WhatsApp API: ~$50/mes

### Mantenimiento Mensual Post-Go-Live: USD $500 - $1,000
- Soporte y bugs
- Mejoras menores
- Infra y servicios

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **AFIP cambia WS** | Media | Alto | Abstraer capa fiscal, monitoreo cambios |
| **Resistencia equipo** | Alta | Medio | Capacitación, paralelo opcional, champions |
| **Datos migración** | Media | Alto | Backup, validación, rollback plan |
| **Performance** | Baja | Medio | Tests carga, optimización progresiva |
| **Scope creep** | Alta | Medio | Documento de prioridades, gate de cambios |

---

## Checkpoints de Decisión

### Checkpoint Post-FASE 1 (Semana 6)
- ✅ ¿Sistema reemplaza al anterior sin problemas?
- ✅ ¿Equipo adoptó el sistema?
- ✅ ¿Facturación AFIP funcionando 100%?
- **Si NO**: 2 semanas adicionales de estabilización antes de FASE 2

### Checkpoint Post-FASE 2 (Semana 14)
- ✅ ¿OTs fluyen sin fricción?
- ✅ ¿Tiempos de entrega mejoraron?
- ✅ ¿Tasa de re-trabajos aceptable?
- **Si NO**: Revisar UX del taller, simplificar flujos

### Checkpoint Post-FASE 3 (Semana 20)
- ✅ ¿Hay tráfico web significativo?
- ✅ ¿Turnos online se convierten en ventas?
- **Si NO**: Revisar marketing, SEO, UX de reservas

---

## Documentación del Proceso

Cada fase genera:
1. **Especificación técnica** (`/specs/`)
2. **Manual de usuario** (`/docs/user-guide/`)
3. **Video tutoriales** (Loom/YouTube unlisted)
4. **Changelog** (`/docs/CHANGELOG.md`)

---

## Medición de Éxito Global

| Indicador | Línea Base | 6 Meses | 12 Meses |
|-----------|-----------|---------|----------|
| **Tiempo atención cliente** | ? min | -30% | -50% |
| **Errores de facturación** | ? % | < 1% | < 0.5% |
| **Stock desactualizado** | Frecuente | Raro | Nunca |
| **Satisfacción cliente** | ? / 10 | +1 punto | +2 puntos |
| **Ingresos** | Base | +10% | +25% |
| **Costos operativos** | Base | -10% | -20% |

---

## Próximos Pasos Inmediatos

1. **Aprobar prioridades**: ¿Coincide el orden de fases con necesidad del negocio?
2. **Definir equipo**: ¿Internal o external? ¿Recursos disponibles?
3. **Detallar FASE 1**: Desglosar historias de usuario semana 1-2
4. **Revisar AFIP**: Confirmar requisitos actuales WS facturación
5. **Auditar sistema actual**: ¿Qué datos migrar? ¿Qué procesos criticar?
