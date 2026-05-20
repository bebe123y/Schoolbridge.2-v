import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { auth } from '../firebase';
import { LogOut, Home, Search, Bookmark, User, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ParentDashboard: React.FC = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile Top Nav */}
      <header className="fixed top-0 inset-x-0 glass-header p-4 flex justify-between items-center z-40">
        <div className="font-black text-xl text-indigo-600">SchoolBridge</div>
        <div className="flex items-center gap-4">
          <Bell className="w-6 h-6 text-gray-400" />
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Main Feed Content */}
      <main className="max-w-2xl mx-auto pt-20 pb-24 px-4 min-h-screen bg-[var(--background)] md:border-x border-[var(--border)]">
        <div className="space-y-12">
          {/* Feed Mockup */}
          <div className="glass-card p-20 text-center rounded-[3rem]">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-black mb-2">Welcome to your feed</h2>
            <p className="text-gray-400 font-medium">When your school posts announcements, you'll see them here.</p>
          </div>
        </div>
      </main>

      {/* Bottom Tab Bar (Mobile) */}
      <nav className="fixed bottom-0 inset-x-0 glass-header border-t border-[var(--border)] px-6 py-4 flex justify-between items-center z-40 rounded-t-3xl border-b-0">
        <button className="text-indigo-600"><Home className="w-7 h-7" /></button>
        <button className="text-gray-300 hover:text-indigo-600 transition"><Search className="w-7 h-7" /></button>
        <button className="text-gray-300 hover:text-indigo-600 transition"><Bookmark className="w-7 h-7" /></button>
        <button onClick={() => navigate('/settings')} className="text-gray-300 hover:text-indigo-600 transition"><SettingsIcon className="w-7 h-7" /></button>
        <button onClick={() => auth.signOut()} className="text-gray-300 hover:text-red-500 transition"><LogOut className="w-7 h-7" /></button>
      </nav>
    </div>
  );
};
