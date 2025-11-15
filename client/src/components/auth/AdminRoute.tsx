import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading } = useAuthStore();

  return (
    <ProtectedRoute>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-saffron-500"></div>
        </div>
      ) : user?.role === 'admin' || user?.role === 'restaurant_manager' ? (
        <>{children}</>
      ) : (
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
};

