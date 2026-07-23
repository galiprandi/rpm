# 📓 Journal — Sofía 🌐

## 📋 BACKLOG

## ✅ DONE
- [x] 2026-07-23 — Multi-step success/pending flow en el formulario de contacto para evitar bloqueadores de popups (PR #sofia/public/contact-flow-ux)
- [x] 2026-07-22 — Widget interactivo de WhatsApp en la web pública con Sofi como asistente virtual (PR #sofia/public/whatsapp-widget)
- [x] 2026-07-20 — Optimización de LCP con Next.js Image y mejora del hito 2011 en Nosotros (PR #sofia/public/lcp-image-optimization)
- [x] 2026-07-19 — Integración de imágenes optimizadas para servicios y estandarización de animaciones en testimonios (PR #sofia/public/services-images-and-testimonials-animation)
- [x] 2026-07-16 — Galería de Excelencia interactiva con soporte para Deep-Linking y Lightbox (PR #sofia/public/nosotros-gallery-improvement)
- [x] 2026-07-15 — Refinado de animaciones, accesibilidad y estabilidad de SEO (PR #sofia/public/polish-and-accessibility)
- [x] 2026-07-14 — Micro-interacciones con Framer Motion y correcciones semánticas (PR #sofia/public/tactile-feedback)
- [x] 2026-07-13 — Estandarización de precios, mejoras de SEO y CTA de alto impacto (PR #sofia/public/polish-and-seo)
- [x] 2026-07-12 — Vista Rápida de Servicios y Deep-Linking en Catálogo de Servicios (PR #sofia/public/service-quick-view)
- [x] 2026-07-11 — Implementación de Buscador Global y Deep-Linking de productos (PR #sofia/public/global-search-and-deeplink)
- [x] 2026-07-10 — Unificación de Vista Rápida de productos y mejora de UX en Home (PR #sofia/public/unified-product-quick-view)
- [x] 2026-07-09 — Indicadores de navegación activa y mejora narrativa en Servicios (PR #sofia/public/header-active-and-services-depth)
- [x] 2026-07-08 — Sección de Productos Destacados en la Home y centralización de datos (PR #sofia/public/featured-products-section)
- [x] 2026-07-04 — Centralización de configuración pública y mejora de conversión (PR #sofia/public/conversion-boost)
- [x] 2026-07-05 — Implementación de sección de Testimonios en la Home (PR #sofia/public/testimonials-section)
- [x] 2026-07-06 — Integración de mapa interactivo y filtros de catálogo (PR #sofia/public/contact-map-and-filters)
- [x] 2026-07-07 — Vista rápida de productos con modal y conversión contextual (PR #sofia/public/product-quick-view)

## 🧠 LEARNINGS

## 2026-07-23 - Redirección Asíncrona y Bloqueadores de Ventanas Emergentes (Popup Blockers)
**Learning:** El uso de `window.open` dentro de callbacks asíncronos (como promesas o temporizadores) suele ser bloqueado por los navegadores modernos para prevenir popups no solicitados. Para asegurar una experiencia de redirección infalible a servicios externos como WhatsApp sin fricciones ni bloqueos, el patrón óptimo consiste en implementar un flujo con estado intermedio (ej: "Mensaje Preparado") que ofrezca al usuario un botón de acción directa (disparador síncrono). Esto elimina por completo el riesgo de bloqueo del navegador, proporciona feedback de carga elegante, y permite un reset sencillo para enviar nuevos mensajes.
**Action:** Aplicar este patrón de flujo de redirección manual/asistido en todos los formularios públicos que enlacen de forma externa tras procesamiento o carga local.

## 2026-07-22 - Conversión Contextual y Chat de WhatsApp
**Learning:** Reemplazar el botón flotante estático de WhatsApp por un widget de chat interactivo que personifica una asistente de atención al cliente ("Sofi") eleva de forma extraordinaria la conversión y la cercanía de la marca. Ofrecer chips interactivos con consultas pre-escritas (como coordinar turnos, cotizar iluminación LED, detailing/PPF o equipamiento off-road) elimina la "fricción de la hoja en blanco", incentivando al usuario a iniciar la interacción de forma lúdica. Además, asegurar accesibilidad total (tecla ESC para cerrar, enfoque inteligente y clic fuera) garantiza que el widget no obstaculice la navegación.
**Action:** Mantener un estándar de micro-UX humanizado y accesible en todas las integraciones flotantes y de contacto del sitio web público.

## 2026-07-20 - Optimización LCP de Imágenes y Configuración de Host Remoto
**Learning:** Al optimizar imágenes de fondo en secciones complejas como hitos/milestones en la página Nosotros, usar el componente `<Image>` de Next.js con `fill`, responsive `sizes` and un contenedor relativo con opacidad controlada (`opacity-10`) permite una lectura impecable del texto sobre fondos oscuros. Asimismo, si la base de datos contiene URLs externas (como `cdn.jsdelivr.net`), es indispensable registrarlas en `next.config.ts` bajo `remotePatterns` para evitar que la compilación de desarrollo o producción de Next.js falle en tiempo de ejecución.
**Action:** Asegurar que todo host externo de recursos de imagen esté declarado en el archivo de configuración de Next.js y validar la visualización mediante emulación móvil y desktop en Playwright.
