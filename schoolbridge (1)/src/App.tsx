import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAppStore } from './store/useAppStore';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider } from './components/ThemeProvider';
import { TermsModal } from './components/TermsModal';
import { RoleSelector } from './components/RoleSelector';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { SchoolOnboarding } from './pages/Onboarding/SchoolOnboarding';
import { ParentOnboarding } from './pages/Onboarding/ParentOnboarding';
import { SchoolDashboard } from './pages/SchoolDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Settings } from './pages/Settings';
import { Toaster } from 'react-hot-toast';
import { AIAssistant } from './components/AIAssistant';

export const App: React.FC = () => {
  const { 
    setUser, 
    setRole, 
    setOnboardingCompleted,
    setLoading, 
    setInitialized, 
    setTermsAccepted,
    termsAccepted,
    isInitialized,
    onboardingCompleted,
    user,
    role
  } = useAppStore();

  useEffect(() => {
    // 1. Check local storage for Terms Acceptance First
    const localTerms = localStorage.getItem('terms_accepted') === 'true' || localStorage.getItem('schoolbridge_terms_accepted') === 'true';
    if (localTerms) {
      setTermsAccepted(true);
    }

    // 2. Setup Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setUser(fbUser);
        try {
          const docRef = await getDoc(doc(db, 'users', fbUser.uid));
          if (docRef.exists()) {
            const data = docRef.data();
            setRole(data.role || null);
            
            // Override with local storage if possible (faster/sync fallback)
            const localOnboardingDone = 
              localStorage.getItem('onboarding_completed') === 'true' || 
              localStorage.getItem('onboarding_complete') === 'true' ||
              localStorage.getItem('schoolbridge_onboarding_done') === 'true' ||
              localStorage.getItem('school_onboarding_done') === 'true';
            
            setOnboardingCompleted(data.onboardingCompleted || localOnboardingDone);

            // Keep Firebase synced with terms if present
            if (data.terms?.accepted || data.termsAccepted) {
              setTermsAccepted(true);
              localStorage.setItem('schoolbridge_terms_accepted', 'true');
            }
          } else {
            setRole(null);
            setOnboardingCompleted(false);
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
          // If we fail to fetch, make sure we don't block forever
          setRole(null);
          setOnboardingCompleted(false);
        }
      } else {
        setUser(null);
        setRole(null);
        setOnboardingCompleted(false);
      }
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []); // Empty array prevents infinite useEffect loops

  const [showTerms, setShowTerms] = React.useState(() => {
    return localStorage.getItem('schoolbridge_terms_accepted') !== 'true';
  });

  // Step 1: Force Terms Acceptance First
  if (showTerms) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <TermsModal onAccept={() => {
            setShowTerms(false);
            setTermsAccepted(true);
          }} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Step 2: Wait for Firebase Auth to initialize before proceeding
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-gray-500">Loading SchoolBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <Toaster position="top-right" />
          <AIAssistant />

          <Routes>
            {/* Landing Page - New Entry Point */}
            <Route path="/" element={
              (!user || !onboardingCompleted) ? <Landing /> : (
                role === 'admin' ? <Navigate to="/admin/dashboard" replace /> :
                role === 'school' ? <Navigate to="/school/dashboard" replace /> :
                <Navigate to="/parent/dashboard" replace />
              )
            } />

            {/* Auth Page */}
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
            
            {/* Role Selector */}
            <Route path="/role-select" element={
              user ? <RoleSelector /> : <Navigate to="/auth" replace />
            } />
            
            {/* Onboarding - Step 4 */}
            <Route path="/onboarding/school" element={
              <ProtectedRoute allowedRole="school">
                <SchoolOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/onboarding/parent" element={
              <ProtectedRoute allowedRole="parent">
                <ParentOnboarding />
              </ProtectedRoute>
            } />

            {/* Dashboards - Step 5 */}
            <Route path="/school/dashboard" element={
              <ProtectedRoute allowedRole="school">
                <SchoolDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent/dashboard" element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Other protected routes */}
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
