# UI Components Architecture

## Overview

Sistema de componentes modular y separado por área funcional, utilizando TailwindCSS para estilos y shadcn/ui como base, con Storybook para documentación y testing visual.

## Stack Tecnológico

### UI Core
- **Styling**: TailwindCSS 4
- **Component Library**: shadcn/ui
- **Documentation**: Storybook v7
- **Visual Testing**: Chromatic
- **Icons**: Lucide React
- **Animations**: Framer Motion (opcional)

### Development Tools
- **Type Safety**: TypeScript strict mode
- **Linting**: ESLint + Prettier
- **Component Testing**: Storybook + Vitest
- **Visual Regression**: Chromatic

## Component Architecture

### Directory Structure
```
components/
├── public/                  # Componentes para ruta /
│   ├── layout/             # Layouts públicos
│   ├── sections/           # Secciones del home
│   └── ui/                 # UI específicos públicos
├── admin/                  # Componentes para ruta /adm
│   ├── layout/             # Layouts admin
│   ├── dashboard/          # Dashboard components
│   ├── forms/              # Formularios admin
│   └── ui/                 # UI específicos admin
├── shared/                 # Componentes comunes
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── forms/              # Form components genéricos
│   ├── feedback/           # Toasts, modals, etc.
│   └── providers/          # Context providers
└── lib/                    # Utilidades y configuración
    ├── ui/                 # Configuración UI base
    └── utils/              # Helper functions
```

### Separation Principles
```typescript
// Estricta separación por área
// ✅ Correcto
import { PublicHeader } from '@/components/public/layout';
import { AdminSidebar } from '@/components/admin/layout';
import { Button } from '@/components/shared/ui';

// ❌ Incorrecto - mezclar áreas
import { AdminButton } from '@/components/admin/ui'; // en componente público
import { PublicCard } from '@/components/public/ui';   // en componente admin
```

## TailwindCSS Configuration

### Base Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### CSS Variables
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## shadcn/ui Integration

### Base Components Setup
```bash
# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Install base components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add table
```

### Component Configuration
```typescript
// components/shared/ui/button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

## Public Components

### Home Page Structure
```typescript
// components/public/layout/PublicLayout.tsx
import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        {children}
      </div>
    </div>
  );
}
```

### Development Message Component
```typescript
// components/public/sections/DevelopmentMessage.tsx
export function DevelopmentMessage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl md:text-6xl font-light tracking-wide">
        RPM
        <span className="block text-2xl md:text-3xl mt-2 text-gray-400">
          Accesorios
        </span>
      </h1>
      
      <div className="space-y-4">
        <p className="text-lg md:text-xl text-gray-300">
          En desarrollo
        </p>
        <p className="text-sm md:text-base text-gray-500 max-w-md mx-auto">
          Estamos trabajando para traerte la mejor experiencia en accesorios.
        </p>
      </div>
      
      <div className="pt-8">
        <div className="inline-flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">
            Próximamente disponible
          </span>
        </div>
      </div>
    </div>
  );
}
```

## Admin Components

### Admin Dashboard Layout
```typescript
// components/admin/layout/AdminLayout.tsx
import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
```

### Admin Sidebar
```typescript
// components/admin/layout/AdminSidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings,
  LogOut 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/adm', icon: LayoutDashboard },
  { name: 'Productos', href: '/adm/products', icon: Package },
  { name: 'Usuarios', href: '/adm/users', icon: Users },
  { name: 'Configuración', href: '/adm/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground">
          RPM Admin
        </h2>
      </div>
      
      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <button className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
```

### Admin Dashboard Cards
```typescript
// components/admin/dashboard/DashboardCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 mt-2">
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs último mes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Shared Components

### Toast Provider
```typescript
// components/shared/feedback/ToastProvider.tsx
import { Toaster } from '@/components/shared/ui/toaster';

export function ToastProvider() {
  return <Toaster />;
}
```

### Loading Spinner
```typescript
// components/shared/ui/loading-spinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}
```

## Storybook Configuration

### Storybook Setup
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Story Example
```typescript
// components/shared/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Shared/UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};
```

## Testing Strategy

### Component Tests
```typescript
// components/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/shared/ui/button';

describe('Button Component', () => {
  test('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  test('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    screen.getByRole('button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Visual Tests with Chromatic
```bash
# Install Chromatic CLI
npm install -D chromatic

# Run visual tests
npx chromatic --project-token=your-token

# CI integration
npx chromatic --exit-zero-on-changes
```

## Performance Optimization

### Component Optimization
```typescript
// Memoized expensive components
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }: Props) => {
  // Expensive rendering logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

### Bundle Optimization
```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Client-side only
});
```

## Vinculación con Otras Especificaciones

### Dependencias
- **core.md**: Requiere configuración de TailwindCSS
- **auth.md**: Utiliza componentes para login/logout
- **realtime.md**: Componentes reactivos a eventos socket
- **api.md**: Componentes que consumen API routes

### Especificaciones Relacionadas
- `/specs/SYSTEM_SPEC.md` - Configuración de build y assets

## Tests y Documentación Relacionados

### Tests Unitarios
- `components.test.ts` - Validación de componentes base
- `storybook.test.ts` - Tests de stories
- `visual.test.ts` - Tests de regresión visual

### Documentación Técnica
- `docs/components-guide.md` - Guía de uso de componentes
- `docs/storybook-setup.md` - Configuración de Storybook
- `docs/design-system.md` - Sistema de diseño

### Vinculación Activa
- **Última actualización**: 2025-03-25
- **Estado tests**: 🟢 Todos pasando
- **Cobertura**: 85% (objetivo >90%)

## Maintenance

### Regular Tasks
- **Component Updates**: Revisión y actualización de componentes
- **Storybook**: Mantener documentación actualizada
- **Visual Tests**: Ejecutar tests de regresión visual
- **Performance**: Monitoreo de bundle size

### Component Versioning
- **Semantic Versioning**: Versionar cambios breaking/non-breaking
- **Changelog**: Documentar cambios significativos
- **Deprecation**: Comunicar cambios deprecated

### Design System Evolution
- **Token Updates**: Actualización de design tokens
- **Component Deprecation**: Reemplazo gradual de componentes viejos
- **New Components**: Adición basada en necesidades reales
