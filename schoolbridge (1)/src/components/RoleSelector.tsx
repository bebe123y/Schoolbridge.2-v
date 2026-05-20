import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const RoleSelector: React.FC = () => {
  const { user, role, setRole, onboardingCompleted } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (role) {
      if (onboardingCompleted) {
        navigate(role === 'school' ? '/school/dashboard' : '/parent/dashboard', { replace: true });
      } else {
        navigate(role === 'school' ? '/onboarding/school' : '/onboarding/parent', { replace: true });
      }
    }
  }, [role, onboardingCompleted, navigate]);

  const handleSelectRole = async (role: 'school' | 'parent') => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        role,
        roleSelectedAt: serverTimestamp(),
        onboardingCompleted: false
      }, { merge: true });
      
      setRole(role);
      const path = role === 'school' ? '/onboarding/school' : '/onboarding/parent';
      navigate(path, { replace: true });
    } catch (err) {
      console.error('Role save failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-xl text-center">
        <h2 className="text-4xl font-black text-gray-900 mb-4">Choose Your Path</h2>
        <p className="text-xl text-gray-600 mb-12">How will you be using SchoolBridge today?</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectRole('school')}
            disabled={isSubmitting}
            className="p-10 rounded-3xl border-4 border-indigo-100 hover:border-indigo-600 transition-colors bg-indigo-50/50 flex flex-col items-center group"
          >
            <span className="text-6xl mb-6 group-hover:scale-110 transition">🏫</span>
            <span className="text-2xl font-black text-indigo-700">School Admin</span>
            <span className="text-sm text-indigo-600 mt-2 opacity-70 font-medium">Manage your institution</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectRole('parent')}
            disabled={isSubmitting}
            className="p-10 rounded-3xl border-4 border-emerald-100 hover:border-emerald-600 transition-colors bg-emerald-50/50 flex flex-col items-center group"
          >
            <span className="text-6xl mb-6 group-hover:scale-110 transition">👪</span>
            <span className="text-2xl font-black text-emerald-700">Parent / Guardian</span>
            <span className="text-sm text-emerald-600 mt-2 opacity-70 font-medium">Connect with your kids</span>
          </motion.button>
        </div>
        
        {isSubmitting && (
          <div className="mt-8 text-indigo-600 font-bold animate-pulse">
            Setting up your profile...
          </div>
        )}
      </div>
    </div>
  );
};
