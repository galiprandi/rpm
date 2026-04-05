# 🌐 Arquitectura de UI: Sitio Público

## 📍 Ubicación

**Toda la UI del sitio público está en: `/app/(public)/**` o `/app/page.tsx`**

Consultar esta especificación ANTES de crear o modificar cualquier página del sitio público (marketing, landing, catálogo, etc.)

---

## Principio Fundamental

**Sitio Público = Marketing + Catálogo + Conversiones | Visual impactante | Simple y rápido**

El sitio público está optimizado para:
- **Audiencia**: Clientes potenciales, visitantes, buscadores de accesorios
- **Dispositivo**: Multi-device (mobile-first)
- **Sesión**: Breve (encontrar info rápido)
- **Objetivo**: Mostrar productos, servicios, generar leads/ventas

---

## Estructura de Rutas Públicas

```
/                          → Landing page / Home
├── /productos             → Catálogo público de productos
├── /servicios            → Servicios de instalación
├── /taller              → Info de taller (Fase 2)
├── /nosotros            → Quiénes somos, historia
├── /contacto            → Formulario de contacto
└── /sucursales          → Ubicaciones y horarios
```

---

## Características de Diseño Público

| Aspecto | Implementación |
|---------|----------------|
| **Layout** | Single column, hero sections, scroll vertical |
| **Navegación** | Header fijo, menú hamburguesa en mobile |
| **Formularios** | Mínimos (solo datos esenciales), CTA claros |
| **Productos** | Grid visual, fotos grandes, precios destacados |
| **Imágenes** | Hero banners, fotos de productos, galería trabajos |
| **Colores** | Esquema vibrante (primarios), CTAs contrastantes |
| **Tipografía** | Títulos grandes, lectura scaneable |
| **CTAs** | Botones prominentes, colores de acción |

---

## Diferencias Clave: Admin vs Público

| Aspecto | Admin (`/adm`) | Público (`/`) |
|---------|----------------|---------------|
| **Foco** | Funcionalidad, datos | Visual, conversión |
| **Usuario** | Staff interno | Clientes potenciales |
| **Tiempo** | Prolongado | Rápido |
| **Colores** | Neutros profesionales | Vibrantes, de marca |
| **Bordes** | `ring-slate-300` (gris 50%) | Según diseño de marca |
| **Formularios** | Completos, validación compleja | Mínimos, simples |
| **Tablas** | Densas, muchos datos | No usar (cards visuales) |
| **Sidebar** | Sí, persistente | No (header simple) |

---

## Componentes Públicos Específicos

### Hero Section

```typescript
// app/page.tsx - Hero principal
<section className="relative h-[600px] flex items-center">
  <Image src="/hero-banner.jpg" fill className="object-cover" />
  <div className="relative z-10 container mx-auto px-4">
    <h1 className="text-4xl md:text-6xl font-bold text-white">
      Accesorios para tu vehículo
    </h1>
    <p className="mt-4 text-xl text-white/90">
      Instalación profesional de luces LED, barras, estética y más
    </p>
    <Button className="mt-8 bg-primary text-white px-8 py-4 text-lg">
      Ver Productos
    </Button>
  </div>
</section>
```

### Product Card (Catálogo)

```typescript
// components/public/ProductCard.tsx
<Card className="overflow-hidden">
  <div className="relative h-48">
    <Image src={product.image} fill className="object-cover" />
  </div>
  <CardContent className="p-4">
    <h3 className="text-lg font-semibold">{product.name}</h3>
    <p className="text-sm text-muted-foreground">{product.category}</p>
    <div className="mt-2 flex items-center justify-between">
      <span className="text-xl font-bold">${product.replacementCost}</span>
      <Button size="sm">Ver más</Button>
    </div>
  </CardContent>
</Card>
```

### Feature Section

```typescript
// Sección de características/servicios
<section className="py-16 bg-slate-50">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center">Nuestros Servicios</h2>
    <div className="mt-8 grid md:grid-cols-3 gap-8">
      {services.map(service => (
        <div key={service.id} className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <service.icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="mt-4 text-xl font-semibold">{service.title}</h3>
          <p className="mt-2 text-muted-foreground">{service.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## Layout Público

### Estructura Base

```typescript
// app/(public)/layout.tsx
<PublicLayout>
  <PublicHeader />
  <main>{children}</main>
  <PublicFooter />
</PublicLayout>
```

### Header Público

- **Logo**: RPM Accesorios (izquierda)
- **Navegación**: Productos, Servicios, Taller, Contacto
- **CTA**: "Whatsapp" o "Llamar" (botón destacado)
- **Mobile**: Menú hamburguesa

### Footer Público

- **Columnas**: Productos, Servicios, Contacto, Redes
- **Info**: Dirección, teléfono, horarios
- **Legal**: Copyright, términos

---

## Formularios Públicos

### Contacto Simple

```typescript
// Solo campos esenciales
<form className="space-y-4">
  <Input placeholder="Nombre" required />
  <Input type="email" placeholder="Email" required />
  <Input placeholder="Teléfono" />
  <Textarea placeholder="¿En qué podemos ayudarte?" rows={4} />
  <Button className="w-full">Enviar Consulta</Button>
</form>
```

### Reglas Formularios Públicos

1. **Máximo 5 campos** (nombre, email, teléfono, mensaje, opcional)
2. **Sin validación compleja** (solo required básico)
3. **Feedback inmediato** (toast de confirmación)
4. **CTA claro** ("Enviar", "Consultar", "Llamar ahora")
5. **Alternativas** (WhatsApp, teléfono, email directo)

---

## Catálogo Público

### Grid de Productos

```typescript
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

### Filtros Simples

- Categoría (dropdown)
- Rango de precio (slider o botones)
- **NO** filtros complejos como en admin

---

## SEO y Performance

### Metadatos por Página

```typescript
export const metadata = {
  title: 'Accesorios para Vehículos | RPM Accesorios',
  description: 'Instalación profesional de luces LED, barras, estética automotriz.',
  keywords: ['accesorios vehículos', 'luces LED', 'instalación'],
};
```

### Imágenes

- **Formato**: WebP con fallback
- **Tamaño**: Optimizadas (lazy loading)
- **Alt text**: Descriptivo para SEO

---

## Mobile-First Público

### Breakpoints

- **Mobile**: < 768px (diseño principal)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Específico

- Touch targets mínimos 44px
- Navegación simplificada
- Formularios optimizados para touch
- Click-to-call en teléfonos

---

## Conversiones

### CTAs Principales

1. **"Ver Productos"** (hero)
2. **"Consultar por WhatsApp"** (flotante)
3. **"Llamar Ahora"** (header sticky)
4. **"Agendar Instalación"** (servicios)

### Tracking

- Google Analytics 4
- Facebook Pixel (si aplica)
- Conversiones: clicks a WhatsApp, formularios enviados

---

## Vinculación con Otras Specs

- `/specs/ui-architecture.md` - Índice de arquitectura UI
- `/specs/ui-architecture-adm.md` - Diseño de interfaz admin
- `/specs/inventory-sales.md` - Datos de productos para catálogo

---

**Estado**: ✅ Definido  
**Última actualización**: 2026-03-28
