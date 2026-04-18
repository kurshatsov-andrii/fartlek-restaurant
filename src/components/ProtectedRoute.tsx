import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, canAccessZone } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface Props {
  zone: 'waiter' | 'kitchen' | 'admin';
  children: ReactNode;
}

export const ProtectedRoute = ({ zone, children }: Props) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to={`/auth?redirect=/${zone}`} replace />;
  if (!canAccessZone(zone, roles)) return <Navigate to="/" replace />;

  return <>{children}</>;
};
