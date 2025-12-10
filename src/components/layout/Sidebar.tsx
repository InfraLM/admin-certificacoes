import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  UserPlus,
  FileBarChart,
  Activity,
  LogOut,
  CalendarDays
} from 'lucide-react';

// Navegação para Admin
const adminNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Alunos', href: '/students', icon: Users },
  { name: 'Turmas', href: '/schedule', icon: Calendar },
  { name: 'Financeiro', href: '/financial', icon: DollarSign },
  { name: 'Onboarding', href: '/onboarding', icon: UserPlus },
  { name: 'Relatórios', href: '/reports', icon: FileBarChart },
];

// Navegação para Comercial
const comercialNavigation = [
  { name: 'Cadastrar Aluno', href: '/cadastro', icon: UserPlus },
  { name: 'Ver Turmas', href: '/turmas', icon: CalendarDays },
];

// Navegação para CX
const cxNavigation = [
  { name: 'Onboarding', href: '/onboarding', icon: UserPlus },
  { name: 'Ver Turmas', href: '/turmas', icon: CalendarDays },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  let navigation = adminNavigation;
  let roleLabel = 'Administrador';
  let userName = 'Administrador Principal';

  if (user?.role === 'comercial') {
    navigation = comercialNavigation;
    roleLabel = 'Comercial';
    userName = 'Equipe Comercial';
  } else if (user?.role === 'cx') {
    navigation = cxNavigation;
    roleLabel = 'Customer Experience';
    userName = 'Equipe CX';
  } else if (user?.role === 'admin') {
    // Explicit admin case to be safe, though default covers it
    roleLabel = 'Administrador';
    userName = 'Administrador Principal';
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Certificações Internacionais</span>
            <span className="text-xs text-sidebar-foreground/60">Gestão</span>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs text-sidebar-foreground/70">Logado como</p>
              <p className="text-sm font-medium text-sidebar-foreground capitalize">{userName}</p>
              <p className="text-xs text-sidebar-primary mt-1">{roleLabel}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer with Logout */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">
              Sistema de Gestão
            </p>
            <p className="text-xs font-medium text-sidebar-foreground">
              Versão 1.5.1
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
