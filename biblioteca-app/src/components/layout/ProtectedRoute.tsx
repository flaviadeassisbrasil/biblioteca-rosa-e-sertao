import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cerrado-light">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cerrado border-t-transparent rounded-full animate-spin" />
          <p className="text-cerrado font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};
