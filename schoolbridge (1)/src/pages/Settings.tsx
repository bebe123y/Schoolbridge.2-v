import React from 'react';
import { useThemeStore, ThemeType } from '../store/useThemeStore';
import { Sun, Moon, Monitor, Sparkles, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'framer-motion';

export const Settings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { role } = useAppStore();
  const navigate = useNavigate();

  const themes: { id: ThemeType; label: string; icon: any; color: string }[] = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-orange-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400' },
    { id: 'system', label: 'System', icon: Monitor, color: 'text-gray-500' },
    { id: 'glass', label: 'Glass', icon: Sparkles, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(role === 'school' ? '/school/dashboard' : '/parent/dashboard')}
            className="p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-black">Settings</h1>
        </header>

        <section className="space-y-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Appearance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`
                    group relative p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all
                    ${theme === t.id 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-transparent bg-[var(--background)] hover:border-gray-200 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <t.icon className={`w-8 h-8 ${t.color}`} />
                  <span className={`text-sm font-bold ${theme === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                    {t.label}
                  </span>
                  {theme === t.id && (
                    <motion.div 
                      layoutId="activeTheme"
                      className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-900"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Account</h2>
            <p className="text-gray-500 font-medium">Logged in as {role === 'school' ? 'School Admin' : 'Parent'}</p>
            <button className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition text-left">
              Delete Account Data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
