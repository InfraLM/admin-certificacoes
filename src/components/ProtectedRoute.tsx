import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    console.log('🔒 [ProtectedRoute] Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Se há roles permitidas e o usuário não tem permissão
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    console.log('🚫 [ProtectedRoute] Acesso negado para role:', user.role);
    // Redireciona para a página inicial do role do usuário
    if (user.role === 'comercial') {
      return <Navigate to="/cadastro" replace />;
    }
    if (user.role === 'cx') {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
