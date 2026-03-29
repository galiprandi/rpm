import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutDashboard, Package, Users, Settings, LogOut } from 'lucide-react';

const meta: Meta = {
  title: 'Adm/AdminSidebar',
  component: () => null, // Mock component
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    // Mock pathname for Storybook
    const pathname = '/adm';
    const navigation = [
      { name: 'Dashboard', href: '/adm', icon: LayoutDashboard },
      { name: 'Productos', href: '/adm/products', icon: Package },
      { name: 'Usuarios', href: '/adm/users', icon: Users },
      { name: 'Configuración', href: '/adm/settings', icon: Settings },
    ];

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
              <a
                key={item.name}
                href="#"
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <a
            href="#"
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </a>
        </div>
      </div>
    );
  },
};
