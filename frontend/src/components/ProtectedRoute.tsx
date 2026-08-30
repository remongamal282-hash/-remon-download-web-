import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status);
  if (status === 'loading') return <div className="min-h-64 flex items-center justify-center">...</div>;
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}