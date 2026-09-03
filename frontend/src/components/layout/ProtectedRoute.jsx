import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-300 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl brand-gradient-bg flex items-center justify-center shadow-glow-md animate-pulse-subtle">
            <span className="font-display font-black text-2xl text-white tracking-wider">C</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          <span>Synchronizing CircleChat engine...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
