import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'school' | 'parent' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, role, onboardingCompleted, isLoading } = useAppStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white transition-colors duration-300 dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!role) {
    return <Navigate to="/role-select" replace />;
  }

  if (role === 'admin') {
    if (allowedRole && role !== allowedRole) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <>{children}</>;
  }

  // Redirect to onboarding if not completed
  if (!onboardingCompleted && !location.pathname.includes('/onboarding')) {
    return <Navigate to={role === 'school' ? '/onboarding/school' : '/onboarding/parent'} replace />;
  }

  // Prevent going to onboarding if already completed
  if (onboardingCompleted && location.pathname.includes('/onboarding')) {
    return <Navigate to={role === 'school' ? '/school/dashboard' : '/parent/dashboard'} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === 'school' ? '/school/dashboard' : '/parent/dashboard'} replace />;
  }

  return <>{children}</>;
};
