# 📓 Journal — Sofía 🌐

## 📋 BACKLOG
- [ ] Optimizar imágenes de la galería "Nosotros" para mejorar el LCP.

## ✅ DONE
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

## 2026-07-16 - Next.js Public Page Architecture Standard
**Learning:** En Next.js, utilizar `useSearchParams` en páginas estáticas de forma desprotegida provoca de-optimización en el build e hidrataciones fallidas en producción. El estándar robusto de arquitectura de páginas públicas consiste en definir un archivo de página de servidor (como `app/nosotros/page.tsx`) que define los metadatos estáticos estables para motores de búsqueda (SEO) y renderiza el cliente interactivo real (como `AboutClient.tsx`) envuelto en un boundary de `<Suspense>`. Esto permite un excelente rendimiento de LCP y total compatibilidad con deep-linking (ej: `?project=iluminacion-2012`).
**Action:** Seguir sistemáticamente la estructura de página de servidor + `<Suspense>` + Client Component para todas las rutas con interacciones dinámicas.

## 2026-07-15 - Accesibilidad Proactiva y Estabilidad de Builds
**Learning:** Mantener la accesibilidad (A11y) no es solo agregar labels, sino asegurar que elementos interactivos que no tienen texto (icon-only buttons) sean identificables por lectores de pantalla y proporcionen feedback visual claro mediante tooltips. Descubrimos que el build de Next.js genera advertencias si no se define `metadataBase` en el layout raíz cuando se usan imágenes sociales, lo cual es crítico para la resolución de URLs absolutas. Además, para evitar advertencias de renderizado en React (setState en el cuerpo de un effect), el patrón de usar un flag `cancelled` y envolver el update en una microtarea (`Promise.resolve()`) asegura una hidratación limpia de estados derivados de la URL.
**Action:** Implementar sistemáticamente tooltips en icon-buttons y asegurar que `metadataBase` esté siempre configurado en el layout principal.

## 2026-07-14 - Micro-interacciones y Tactilidad con Framer Motion
**Learning:** Incorporar `framer-motion` permite elevar la percepción de calidad del sitio mediante micro-interacciones que responden al toque (`whileTap`) y al cursor (`whileHover`). Las animaciones de entrada escalonadas (`staggerChildren`) guían el ojo del usuario y hacen que la carga de contenido se sienta deliberada y fluida. Es importante usar `as const` en configuraciones de `ease` personalizadas (como curvas de Bezier) para que TypeScript las reconozca correctamente dentro de las variantes de Motion. Además, reforzamos la importancia del patrón `asChild` para mantener la validez semántica del HTML al anidar elementos interactivos.
**Action:** Utilizar `framer-motion` para componentes de catálogo y landing pages donde la "experiencia de marca" sea prioritaria.

## 2026-07-13 - SEO, Semántica HTML y Estandarización Visual
**Learning:** Mejorar el SEO no solo implica meta-tags básicos, sino configurar correctamente `openGraph` y `twitter` en el layout raíz para asegurar previews atractivas en redes sociales. Al usar componentes UI complejos (como Shadcn Buttons) dentro de links, es imperativo usar la prop `asChild` para evitar anidamiento de botones dentro de anchors, lo cual es inválido en HTML y causa advertencias de hidratación en Next.js. La consistencia en la tipografía financiera (`font-mono`) ayuda a separar visualmente los datos técnicos de la narrativa de marketing.
**Action:** Aplicar `asChild` sistemáticamente en botones que actúen como links y mantener `metadataBase` configurado para resolver rutas de imágenes sociales.

## 2026-07-12 - Deep-Linking de Servicios y Estabilidad de Componentes Shared
**Learning:** Extender el patrón de "Deep-Linking" a los servicios permite una navegación mucho más fluida desde el buscador global y la Home. Al implementar esto, descubrimos que componentes críticos compartidos como `DataTable` tenían errores de redeclaración de variables que bloqueaban el build de producción. Es vital mantener la pureza de los componentes UI y evitar shadowing de variables de estado (como `rowSelection`) para asegurar la estabilidad del sistema completo, no solo del área pública.
**Action:** Aplicar siempre el patrón de sufijo (ej: `rowSelectionValue`) when handling controlled vs internal states and verify production builds (`pnpm build`) for any changes in components under `components/ui/*`.
