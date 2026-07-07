# 📓 Journal — Sofía 🌐

## 📋 BACKLOG
- [ ] Crear un botón flotante de WhatsApp persistente en todas las páginas públicas.
- [ ] Mejorar la visualización de detalles de productos (modal o página dedicada).

## ✅ DONE
- [x] 2026-07-04 — Centralización de configuración pública y mejora de conversión (PR #sofia/public/conversion-boost)
- [x] 2026-07-05 — Implementación de sección de Testimonios en la Home (PR #sofia/public/testimonials-section)
- [x] 2026-07-06 — Integración de mapa interactivo y filtros de catálogo (PR #sofia/public/contact-map-and-filters)

## 🧠 LEARNINGS
## 2026-07-06 - Mapa Interactivo y UX de Catálogo
**Learning:** Integrar un mapa interactivo mejora drásticamente la utilidad de la página de contacto para negocios locales. Aplicar filtros CSS (`grayscale`, `invert`) a iframes de Google Maps permite mantener una estética oscura coherente sin depender de APIs pagas o pesadas. En el catálogo, la búsqueda en tiempo real y el filtrado por categorías reducen la carga cognitiva del usuario al explorar productos técnicos.
**Action:** Usar el patrón de filtros CSS para otros elementos externos integrados y priorizar el filtrado "zero-latency" en el cliente para listas de tamaño moderado.

## 2026-07-04 - Centralización y Conversión WhatsApp
**Learning:** Centralizar la configuración de contacto (WhatsApp, RRSS, dirección) facilita el mantenimiento y asegura consistencia en toda la web pública. Integrar el formulario de contacto directamente con WhatsApp aumenta la tasa de respuesta inmediata para negocios de servicios locales.
**Action:** Mantener `lib/config/public-site.ts` como fuente de verdad para toda la UI pública y seguir el patrón de redirección con contexto (nombre/email) para otros puntos de contacto.

## 2026-07-05 - Prueba Social (Social Proof)
**Learning:** En el sector de servicios automotrices de alta gama, la confianza es el factor decisivo. Agregar testimonios reales con modelos de vehículos específicos ayuda a los clientes potenciales a visualizar el resultado en sus propios autos y reduce la fricción en la toma de decisiones.
**Action:** Asegurar que las secciones de prueba social sean visualmente coherentes con el diseño "high-end" del sitio para mantener la percepción de exclusividad.
