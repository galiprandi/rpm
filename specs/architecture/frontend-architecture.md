# Arquitectura Frontend y UI

## 1. Stack Tecnológico
- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS (sin dependencias complejas de UI si no es necesario)
- **Componentes Base**: Radix UI / Shadcn UI (cuando aplica)
- **Estado Visual**: React Hooks y Context API

## 2. Estructura de Diseño (Layouts)
El frontend se divide en dos áreas principales:

### Admin Dashboard (`/adm/*`)
- **Layout**: Sidebar colapsable (Desktop-first) con navegación lateral.
- **Header**: Barra superior con breadcrumbs y acciones rápidas.
- **Acceso**: Requiere autenticación.
- **Componentes Comunes**: Tablas de datos (CrudAdmin), formularios, modales y tarjetas de métricas.

### Web Pública y Mobile PWA (`/`, `/m/*`)
- **Layout**: Mobile-first, centrado en el cliente o el técnico del taller.
- **Interacciones**: Chatbot flotante o vistas simplificadas de escaneo de QR y reportes.

## 3. Patrones de UI y Componentes
- **Separación Lógica/UI**: Los componentes visuales (Botones, Inputs) no realizan llamadas a la API. Se alimentan por props.
- **Lógica en Page**: Los componentes `page.tsx` actúan como controladores de vista (Server Components donde es posible) que inyectan la data a los Client Components.
- **Formularios**: Validaciones estrictas antes de enviar (ej. react-hook-form + zod).
- **Feedback Visual**: Uso intensivo de Toasts para éxito/error y Skeletons para estados de carga en vez de simples spinners, mejorando la UX percibida.

## 4. Testing de UI (Storybook & Playwright)
- Obligatorio mantener actualizadas las historias de **Storybook** para componentes complejos.
- Los cambios estructurales requieren validación visual local y ejecución de E2E tests si aplican.
