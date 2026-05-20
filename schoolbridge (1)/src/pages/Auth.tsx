import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') as 'school' | 'parent' | null;
  
  const [isSignUp, setIsSignUp] = useState(!!initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (isSignUp && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.name) {
          await updateProfile(user, { displayName: formData.name });
        }
        
        // Save initial role if specified
        if (initialRole) {
          await setDoc(doc(db, 'users', user.uid), {
            role: initialRole,
            email: user.email,
            onboardingCompleted: false,
            createdAt: serverTimestamp()
          }, { merge: true });
        }
        
        toast.success(`Welcome to SchoolBridge!${initialRole ? ` (Joining as ${initialRole})` : ''}`);
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Signed in successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google');
    } catch (error: any) {
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-6 shadow-xl shadow-indigo-100 rotate-3">
             <span className="text-white text-4xl font-black">SB</span>
          </div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">SchoolBridge</h1>
          <p className="text-gray-500 font-medium">Connecting educational communities</p>
        </div>

        <div className="bg-[var(--card)] p-1 rounded-2xl border border-[var(--border)] flex mb-8">
          <button 
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3 font-bold rounded-xl transition ${!isSignUp ? 'bg-[var(--background)] shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3 font-bold rounded-xl transition ${isSignUp ? 'bg-[var(--background)] shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {isSignUp && (
              <motion.div 
                key="name"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--border)] focus:border-indigo-600 outline-none rounded-2xl transition shadow-sm font-medium"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--border)] focus:border-indigo-600 outline-none rounded-2xl transition shadow-sm font-medium"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--border)] focus:border-indigo-600 outline-none rounded-2xl transition shadow-sm font-medium"
            />
          </div>

          {isSignUp && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-[var(--card)] border border-[var(--border)] focus:border-indigo-600 outline-none rounded-2xl transition shadow-sm font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 group shadow-lg shadow-indigo-100"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </>
            )}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-gray-400 font-medium">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span>OR</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
        >
          <Chrome className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};
