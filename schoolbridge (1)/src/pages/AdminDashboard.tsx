import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Shield, CheckCircle, XCircle, Search, Layout, Settings as SettingsIcon, LogOut, FileText, Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SchoolProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  isVerified: boolean;
  status: 'pending' | 'verified' | 'rejected';
  created_at: any;
  photos: string[];
  description: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [selectedSchool, setSelectedSchool] = useState<SchoolProfile | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData: SchoolProfile[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        schoolsData.push({
          id: doc.id,
          name: data.name || data.schoolName || 'Unknown School',
          email: data.email || 'N/A', // Email is usually in 'users', maybe not in 'schools'
          phone: data.phone_numbers?.[0] || data.phone || 'N/A',
          location: data.location?.address || data.location || 'N/A',
          isVerified: !!data.isVerified,
          status: data.isVerified ? 'verified' : (data.verificationStatus || 'pending'),
          created_at: data.created_at,
          photos: data.photoUrls || data.photos || [],
          description: data.description || 'No description provided.',
        });
      });
      
      // Sort manually
      schoolsData.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0; // Simple sort
      });

      setSchools(schoolsData);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySchool = async (schoolId: string, status: 'verified' | 'rejected') => {
    try {
      setIsActionLoading(true);
      const schoolRef = doc(db, 'schools', schoolId);
      await updateDoc(schoolRef, {
        isVerified: status === 'verified',
        verificationStatus: status
      });
      
      setSchools(schools.map(s => 
        s.id === schoolId 
          ? { ...s, isVerified: status === 'verified', status }
          : s
      ));
      
      toast.success(`School ${status} successfully`);
      setSelectedSchool(null);
    } catch (error) {
      console.error('Error verifying school:', error);
      toast.error(`Failed to manually mark school as ${status}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter || (filter === 'verified' && s.isVerified);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col lg:flex-row font-sans text-[var(--foreground)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-[var(--border)] flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl leading-tight">Admin</h1>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Portal</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition">
            <Layout size={20} />
            School Verification
          </button>
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <button 
            onClick={() => auth.signOut()} 
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <header className="p-6 lg:px-10 lg:py-8 border-b border-[var(--border)] sticky top-0 bg-[var(--background)]/80 backdrop-blur-xl z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
             <h1 className="text-3xl font-black tracking-tight">School Directory</h1>
             <p className="text-gray-500 font-medium">Review and verify school accounts</p>
          </div>
          
          <div className="relative w-full sm:w-auto mt-2 sm:mt-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schools..."
              className="w-full sm:w-80 pl-12 pr-4 py-3 bg-[var(--card)] rounded-2xl border border-[var(--border)] outline-none focus:ring-2 ring-indigo-600 transition"
            />
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {/* Filters */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Schools' },
              { id: 'pending', label: 'Pending Verification' },
              { id: 'verified', label: 'Verified' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition ${
                  filter === f.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
                    : 'bg-[var(--card)] text-gray-500 border border-[var(--border)] hover:border-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
              <p className="font-bold">Loading schools...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-20 bg-[var(--card)] rounded-[2rem] border border-[var(--border)] shadow-sm">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-2">No schools found</h3>
              <p className="text-gray-500 font-medium">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredSchools.map((school) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={school.id} 
                    className="bg-[var(--card)] rounded-[2rem] border border-[var(--border)] shadow-sm overflow-hidden flex flex-col group cursor-pointer hover:border-indigo-600 transition"
                    onClick={() => setSelectedSchool(school)}
                  >
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center text-white
                          ${school.isVerified ? 'bg-green-500' : school.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'}
                        `}>
                          {school.isVerified ? <CheckCircle size={24} /> : school.status === 'rejected' ? <XCircle size={24} /> : <FileText size={24} />}
                        </div>
                        <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${
                          school.isVerified 
                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20' 
                            : school.status === 'rejected'
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                        }`}>
                          {school.isVerified ? 'Verified' : school.status}
                        </span>
                      </div>
                      
                      <h3 className="font-black text-xl mb-1 line-clamp-1 group-hover:text-indigo-600 transition">{school.name}</h3>
                      <p className="text-gray-500 text-sm font-medium mb-4">{school.email}</p>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400 w-16">Phone</span>
                          <span className="font-medium text-[var(--foreground)]">{school.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-400 w-16">Location</span>
                          <span className="font-medium text-[var(--foreground)] truncate">{school.location}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
              onClick={() => !isActionLoading && setSelectedSchool(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--card)] w-full max-w-2xl rounded-[2.5rem] border border-[var(--border)] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-[var(--border)] flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black tracking-tight">{selectedSchool.name}</h2>
                    {selectedSchool.isVerified && (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full">
                        <CheckCircle size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg ${
                     selectedSchool.isVerified 
                       ? 'bg-green-50 text-green-600 dark:bg-green-900/20' 
                       : selectedSchool.status === 'rejected'
                       ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                       : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                   }`}>
                     Status: {selectedSchool.isVerified ? 'Verified' : selectedSchool.status}
                   </span>
                </div>
                <button 
                  onClick={() => !isActionLoading && setSelectedSchool(null)}
                  className="w-10 h-10 flex items-center justify-center bg-[var(--background)] rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <XCircle size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <section>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Contact Information</h3>
                  <div className="bg-[var(--background)] p-5 rounded-2xl space-y-3">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-500 w-20">Email</span>
                      <span className="font-medium text-[var(--foreground)]">{selectedSchool.email}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-500 w-20">Phone</span>
                      <span className="font-medium text-[var(--foreground)]">{selectedSchool.phone}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-500 w-20">Location</span>
                      <span className="font-medium text-[var(--foreground)]">{selectedSchool.location}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Description</h3>
                  <p className="text-[var(--foreground)] font-medium leading-relaxed bg-[var(--background)] p-5 rounded-2xl">
                    {selectedSchool.description}
                  </p>
                </section>

                {selectedSchool.photos && selectedSchool.photos.length > 0 && (
                  <section>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedSchool.photos.map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-[var(--border)]">
                          <img src={photo} alt="School" className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border)] flex gap-4 bg-[var(--background)]">
                {selectedSchool.isVerified ? (
                  <button 
                    onClick={() => handleVerifySchool(selectedSchool.id, 'rejected')}
                    disabled={isActionLoading}
                    className="flex-1 py-4 px-6 bg-[var(--card)] border border-red-200 dark:border-red-900/30 text-red-600 font-black rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition uppercase tracking-widest text-sm disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Revoke Verification'}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleVerifySchool(selectedSchool.id, 'rejected')}
                      disabled={isActionLoading}
                      className="flex-1 py-4 px-6 bg-[var(--card)] border py-4 border-[var(--border)] text-gray-600 dark:text-gray-300 font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition uppercase tracking-widest text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleVerifySchool(selectedSchool.id, 'verified')}
                      disabled={isActionLoading}
                      className="flex-[2] py-4 px-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition uppercase tracking-widest text-sm disabled:opacity-50"
                    >
                      {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify School'}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
