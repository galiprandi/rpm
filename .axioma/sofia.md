# 📓 Journal — Sofía 🌐

## 📋 BACKLOG
- [ ] Agregar micro-interacciones (framer-motion) a las tarjetas de servicios para mejorar el feedback táctil.
- [ ] Optimizar imágenes de la galería "Nosotros" para mejorar el LCP.

## ✅ DONE
- [x] 2026-07-11 — Implementación de Buscador Global y Deep-Linking de productos (PR #sofia/public/global-search-and-deeplink)
- [x] 2026-07-10 — Unificación de Vista Rápida de productos y mejora de UX en Home (PR #sofia/public/unified-product-quick-view)
- [x] 2026-07-09 — Indicadores de navegación activa y mejora narrativa en Servicios (PR #sofia/public/header-active-and-services-depth)
- [x] 2026-07-08 — Sección de Productos Destacados en la Home y centralización de datos (PR #sofia/public/featured-products-section)
- [x] 2026-07-04 — Centralización de configuración pública y mejora de conversión (PR #sofia/public/conversion-boost)
- [x] 2026-07-05 — Implementación de sección de Testimonios en la Home (PR #sofia/public/testimonials-section)
- [x] 2026-07-06 — Integración de mapa interactivo y filtros de catálogo (PR #sofia/public/contact-map-and-filters)
- [x] 2026-07-07 — Vista rápida de productos con modal y conversión contextual (PR #sofia/public/product-quick-view)

## 🧠 LEARNINGS

## 2026-07-11 - Buscador Global y Deep-Linking en Next.js
**Learning:** Implementar un buscador global que conecte diferentes tipos de entidades (Productos y Servicios) requiere una arquitectura de datos centralizada en `lib/constants`. El patrón de "deep-linking" mediante parámetros de búsqueda (URLSearchParams) permite que los resultados de búsqueda no solo naveguen a una página, sino que activen estados específicos de la UI (como abrir un modal de detalle) de forma declarativa. Es CRÍTICO envolver componentes que usan `useSearchParams` en un boundary de `<Suspense />` para evitar problemas de hidratación y des-optimización de rutas estáticas en Next.js.
**Action:** Usar siempre `Suspense` para páginas con filtros o modales activados por URL y mantener las constantes de marketing como única fuente de verdad para el buscador.

## 2026-07-09 - Navegación Contextual y Narrativa de Servicios
**Learning:** Los usuarios necesitan feedback visual constante sobre su ubicación en el sitio; resaltar el link activo en el header mejora la orientación espacial y la facilidad de navegación. En páginas de servicios, pasar de una simple lista a una "metodología de trabajo" (Proceso de Excelencia) transforma la percepción del usuario de "qué venden" a "cómo trabajan", elevando la confianza percibida. Una página de servicios sin un CTA final claro es una oportunidad de conversión perdida; el cierre debe ser tan fuerte como el inicio.
**Action:** Asegurar que todas las páginas de aterrizaje principales terminen con una sección de conversión de alto impacto y que la navegación global sea siempre reactiva al contexto del usuario.

## 2026-07-08 - Centralización de Datos de Marketing
**Learning:** Centralizar los datos de productos destacados en `lib/constants/featured-products.ts` permite mantener la consistencia entre la Home y el Catálogo sin duplicar código. Esto facilita actualizaciones rápidas de stock o precios que se reflejan instantáneamente en toda la web pública. La sección de "Productos Destacados" en la Home sirve como un "teaser" efectivo que reduce la fricción hacia el catálogo completo.
**Action:** Seguir este patrón para "Servicios Destacados" o "Promociones" para asegurar una fuente única de verdad en elementos de marketing.

## 2026-07-07 - Patrón de Vista Rápida (Quick View)
**Learning:** En catálogos de productos técnicos o estéticos, permitir al usuario profundizar sin perder el contexto de la lista principal (vía modales) aumenta significativamente el tiempo de sesión y la probabilidad de conversión. Un overlay de "ojo" o "vista rápida" al hacer hover es un patrón estándar que los usuarios premium esperan. La conversión debe ser siempre contextual: el mensaje de WhatsApp debe incluir el nombre exacto del producto que el usuario está viendo.
**Action:** Implementar modales de detalle similares para servicios complejos en el futuro para mantener la navegación "single-page" en áreas de catálogo.

## 2026-07-06 - Mapa Interactivo y UX de Catálogo
**Learning:** Integrar un mapa interactivo mejora drásticamente la utilidad de la página de contacto para negocios locales. Aplicar filtros CSS (`grayscale`, `invert`) a iframes de Google Maps permite mantener una estética oscura coherente sin depender de APIs pagas o pesadas. En el catálogo, la búsqueda en tiempo real y el filtrado por categorías reducen la carga cognitiva del usuario al explorar productos técnicos.
**Action:** Usar el patrón de filtros CSS para otros elementos externos integrados y priorizar el filtrado "zero-latency" en el cliente para listas de tamaño moderado.

## 2026-07-04 - Centralización y Conversión WhatsApp
**Learning:** Centralizar la configuración de contacto (WhatsApp, RRSS, dirección) facilita el mantenimiento y asegura consistencia en toda la web pública. Integrar el formulario de contacto directamente con WhatsApp aumenta la tasa de respuesta inmediata para negocios de servicios locales.
**Action:** Mantener `lib/config/public-site.ts` como fuente de verdad para toda la UI pública y seguir el patrón de redirección con contexto (nombre/email) para otros puntos de contacto.

## 2026-07-05 - Prueba Social (Social Proof)
**Learning:** En el sector de servicios automotrices de alta gama, la confianza es el factor decisivo. Agregar testimonios reales con modelos de vehículos específicos ayuda a los clientes potenciales a visualizar el resultado en sus propios autos y reduce la fricción en la toma de decisiones.
**Action:** Asegurar que las secciones de prueba social sean visualmente coherentes con el diseño "high-end" del sitio para mantener la percepción de exclusividad.
