import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { auth } from '../firebase';
import { LogOut, Layout, Users, Settings as SettingsIcon, Bell, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SchoolDashboard: React.FC = () => {
  const { user } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] hidden lg:flex flex-col glass-card rounded-none sticky top-0 h-screen">
        <div className="p-6 border-b border-[var(--border)] italic font-black text-2xl text-indigo-600">
          SchoolBridge
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: Layout, label: 'Dashboard', active: true, path: '/school/dashboard' },
            { icon: Bell, label: 'Announcements' },
            { icon: Users, label: 'Teachers' },
            { icon: SettingsIcon, label: 'Settings', path: '/settings' },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${item.active ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full pb-20 lg:pb-0">
        <header className="glass-header p-4 lg:p-6 flex justify-between items-center sticky top-0 z-10 w-full">
          <h1 className="text-xl sm:text-2xl font-black">School Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="bg-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-indigo-700 transition whitespace-nowrap">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Announcement</span><span className="sm:hidden">Post</span>
            </button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[
              { label: 'Total Announcements', value: '0' },
              { label: 'Linked Parents', value: '0' },
              { label: 'Verified Teachers', value: '1' },
            ].map((stat, i) => (
              <div key={i} className="bg-[var(--card)] p-6 rounded-3xl border border-[var(--border)] shadow-sm backdrop-blur-sm">
                <p className="text-gray-500 font-bold text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-sm p-12 text-center backdrop-blur-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">No Announcements Yet</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
              Start by posting your first school announcement to keep parents informed.
            </p>
            <button className="px-6 sm:px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition w-full sm:w-auto">
              Create My First Post
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 glass-header border-t border-[var(--border)] px-6 py-4 flex justify-between items-center z-40 rounded-t-3xl border-b-0 pb-safe">
        <button onClick={() => navigate('/school/dashboard')} className="text-indigo-600"><Layout className="w-7 h-7" /></button>
        <button className="text-gray-300 hover:text-indigo-600 transition"><Bell className="w-7 h-7" /></button>
        <button className="text-gray-300 hover:text-indigo-600 transition"><Users className="w-7 h-7" /></button>
        <button onClick={() => navigate('/settings')} className="text-gray-300 hover:text-indigo-600 transition"><SettingsIcon className="w-7 h-7" /></button>
        <button onClick={() => auth.signOut()} className="text-gray-300 hover:text-red-500 transition"><LogOut className="w-7 h-7" /></button>
      </nav>
    </div>
  );
};
