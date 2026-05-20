import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { School, Users, ArrowRight, Languages, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, role, setRole, onboardingCompleted } = useAppStore();

  const handleRoleChoice = async (choice: 'school' | 'parent') => {
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          role: choice,
          onboardingCompleted: false
        }, { merge: true });
        setRole(choice);
        navigate(`/onboarding/${choice}`);
      } catch (err) {
        toast.error('Failed to set role');
      }
    } else {
      navigate(`/auth?role=${choice}`);
    }
  };

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* High-contrast navigation */}
      <nav className="p-4 md:p-8 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-4 md:gap-0">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300 shadow-xl shadow-indigo-200">
            SB
          </div>
          <span className="text-3xl font-black tracking-tight text-slate-900">SchoolBridge</span>
        </div>
        <div className="flex items-center flex-wrap justify-center gap-4 md:gap-8">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <Languages size={18} className="text-slate-400" />
            <select 
              onChange={(e) => toggleLanguage(e.target.value)}
              value={i18n.language}
              className="bg-transparent text-sm font-black text-slate-600 outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
              <option value="om">Oromifa</option>
            </select>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              {onboardingCompleted && (
                <button 
                  onClick={() => navigate(role === 'school' ? '/school/dashboard' : '/parent/dashboard')}
                  className="text-indigo-600 font-bold hover:underline transition-colors uppercase tracking-widest text-sm"
                >
                  Dashboard
                </button>
              )}
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-500 font-bold hover:text-red-600 transition-colors uppercase tracking-widest text-sm"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="text-slate-600 font-bold hover:text-indigo-600 transition-colors uppercase tracking-widest text-sm whitespace-nowrap"
            >
              {t('auth.sign_in')}
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col items-center flex-1 w-full shrink-0 relative z-10 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-20"
        >
          <div className="inline-block px-4 py-1.5 mb-6 bg-indigo-50 border border-indigo-100 rounded-full">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">{t('landing.tagline')}</span>
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 mb-6 md:mb-8 tracking-tighter leading-[1.1] md:leading-[0.95]">
            {t('landing.title').split(' ').slice(0, 2).join(' ')} <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
              {t('landing.title').split(' ').slice(2).join(' ')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-4">
            {t('landing.description')}
          </p>
        </motion.div>

        {/* The Choice Section - Priority #1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-5xl">
          {/* School Entry */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex h-full w-full"
          >
            <button
              onClick={() => handleRoleChoice('school')}
              className="group w-full h-full p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] bg-white border-2 border-slate-100 hover:border-indigo-600 transition-all duration-500 text-left shadow-xl hover:shadow-2xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-start"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white mb-6 sm:mb-10 shadow-lg sm:shadow-2xl shadow-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <School className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 sm:mb-4 tracking-tight">{t('landing.im_a_school')}</h3>
                <p className="text-slate-500 font-medium text-base sm:text-lg mb-6 sm:mb-10 leading-relaxed">
                  {t('landing.school_desc')}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 text-indigo-600 font-black text-lg sm:text-xl mt-auto">
                  {t('landing.register_school')} <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 sm:group-hover:translate-x-3 transition-transform duration-300" />
                </div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl sm:blur-3xl"></div>
            </button>
          </motion.div>

          {/* Parent Entry */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex h-full w-full"
          >
            <button
              onClick={() => handleRoleChoice('parent')}
              className="group w-full h-full p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] bg-white border-2 border-slate-100 hover:border-emerald-600 transition-all duration-500 text-left shadow-xl hover:shadow-2xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-start"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-600 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white mb-6 sm:mb-10 shadow-lg sm:shadow-2xl shadow-emerald-200 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 sm:mb-4 tracking-tight">{t('landing.im_a_parent')}</h3>
                <p className="text-slate-500 font-medium text-base sm:text-lg mb-6 sm:mb-10 leading-relaxed">
                  {t('landing.parent_desc')}
                </p>
                <div className="flex items-center gap-2 sm:gap-3 text-emerald-600 font-black text-lg sm:text-xl mt-auto">
                  {t('landing.join_parent')} <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 sm:group-hover:translate-x-3 transition-transform duration-300" />
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl sm:blur-3xl"></div>
            </button>
          </motion.div>
        </div>
      </main>

      {/* Visual Accent */}
      <div className="fixed bottom-0 left-0 right-0 h-1.5 flex transition-opacity duration-1000">
        <div className="flex-1 bg-indigo-600"></div>
        <div className="flex-1 bg-emerald-600"></div>
      </div>
    </div>
  );
};
