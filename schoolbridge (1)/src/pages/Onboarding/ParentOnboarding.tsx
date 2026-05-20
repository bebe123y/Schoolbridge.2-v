import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../firebase';
import { useAppStore } from '../../store/useAppStore';
import { 
  Loader2, User, Phone, Calendar, School, 
  Camera, CheckCircle, ChevronRight, Search, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface SchoolOption {
  id: string;
  name: string;
  isVerified?: boolean;
}

export const ParentOnboarding: React.FC = () => {
  const { user, setOnboardingCompleted } = useAppStore();
  const navigate = useNavigate();

  // Step State
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSchoolList, setShowSchoolList] = useState(false);

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'schools'));
        const schoolList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          isVerified: doc.data().isVerified === true
        }));
        setSchools(schoolList);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    fetchSchools();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Max photo size is 5MB');

    setIsUploading(true);
    const storageRef = ref(storage, `parents/${user.uid}/profile_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      null, 
      (error: any) => {
        toast.error('Upload failed');
        setIsUploading(false);
      }, 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setPhotoUrl(url);
        setIsUploading(false);
        toast.success('Photo uploaded!');
        // Auto advance to next step after photo upload? 
        // User might want to change it, so maybe not. 
      }
    );
  };

  const nextStep = () => {
    if (step === 1 && !photoUrl) return toast.error('Profile photo is required');
    if (step === 2 && !fullName) return toast.error('Full name is required');
    if (step === 3 && !phone) return toast.error('Phone number is required');
    if (step === 4) {
      const ageNum = parseInt(age);
      if (!age || ageNum < 25 || ageNum > 70) return toast.error('Age must be between 25 and 70');
    }
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedSchool) return toast.error('Please select your child\'s school');

    setIsSubmitting(true);
    try {
      const parentData = {
        fullName,
        phone,
        age: parseInt(age),
        photoUrl,
        linked_school_id: selectedSchool.id,
        user_id: user?.uid,
        created_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'parents', user!.uid), parentData);
      await setDoc(doc(db, 'users', user!.uid), { onboardingCompleted: true }, { merge: true });
      
      localStorage.setItem('onboarding_complete', 'true');
      setOnboardingCompleted(true);
      toast.success('🎉 Welcome to SchoolBridge!');
      navigate('/parent/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="relative inline-block">
              <label className="block w-48 h-48 rounded-[3rem] bg-indigo-50 border-4 border-dashed border-indigo-200 overflow-hidden cursor-pointer hover:border-indigo-600 transition group relative">
                {photoUrl ? (
                  <img src={photoUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-indigo-300">
                    <Camera size={48} className="mb-2" />
                    <span className="text-xs font-black uppercase tracking-widest">Upload Photo</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                {isUploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                )}
              </label>
            </div>
            <p className="text-gray-500 font-medium">A clear profile photo helps schools identify you.</p>
          </motion.section>
        );

      case 2:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-gray-500">Full Name</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600" />
                <input 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  placeholder="Ex. John Doe"
                  className="w-full pl-16 pr-8 py-6 bg-white rounded-3xl border border-gray-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 transition text-2xl font-black"
                />
              </div>
            </div>
          </motion.section>
        );

      case 3:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-gray-500">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600" />
                <input 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  placeholder="09..."
                  className="w-full pl-16 pr-8 py-6 bg-white rounded-3xl border border-gray-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 transition text-2xl font-black"
                />
              </div>
            </div>
          </motion.section>
        );

      case 4:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <label className="text-sm font-black uppercase text-gray-500 block mb-4">Your Age</label>
              <input 
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="25"
                max="70"
                autoFocus
                className="w-48 text-center py-8 bg-white rounded-[3rem] border border-gray-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 transition text-6xl font-black mx-auto block"
              />
              <p className="text-gray-400 font-bold mt-4">Must be between 25 and 70</p>
            </div>
          </motion.section>
        );

      case 5:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <label className="text-sm font-black uppercase text-gray-500">Where does your child learn?</label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600" />
                <input 
                  value={selectedSchool ? selectedSchool.name : searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedSchool) setSelectedSchool(null);
                    setShowSchoolList(true);
                  }}
                  onFocus={() => setShowSchoolList(true)}
                  placeholder="Search for a school..."
                  className="w-full pl-16 pr-8 py-6 bg-white rounded-3xl border border-gray-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 transition text-xl font-black"
                />
              </div>

              {showSchoolList && !selectedSchool && (
                <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-64 overflow-y-auto mt-4 p-2 space-y-1">
                  {filteredSchools.length > 0 ? (
                    filteredSchools.map(school => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => {
                          setSelectedSchool(school);
                          setShowSchoolList(false);
                        }}
                        className="w-full px-6 py-5 text-left hover:bg-indigo-50 rounded-2xl flex items-center gap-4 transition group relative"
                      >
                        <div className="p-3 bg-indigo-50 group-hover:bg-white rounded-xl transition">
                          <School className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-700">{school.name}</span>
                            {school.isVerified && (
                              <CheckCircle className="w-4 h-4 text-blue-500" strokeWidth={3} />
                            )}
                          </div>
                          {school.isVerified && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verified School</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-12 text-center text-gray-400">
                      <School size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="font-black uppercase tracking-widest text-xs">No schools found</p>
                    </div>
                  )}
                </div>
              )}

              {selectedSchool && (
                <div className="mt-8 p-8 bg-indigo-600 rounded-[2.5rem] text-white flex items-center gap-6 shadow-xl shadow-indigo-100">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-60">Ready to link with</p>
                    <p className="text-2xl font-black">{selectedSchool.name}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        );

      default:
        return null;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 md:p-12 lg:p-24 font-sans relative">
      <button 
        onClick={handleSignOut}
        className="absolute top-8 right-8 flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors uppercase tracking-widest text-xs"
      >
        <LogOut size={16} /> Sign Out
      </button>

      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-12 flex justify-between items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-200'}`} 
            />
          ))}
        </div>

        <div className="mb-12">
          <span className="text-indigo-600 font-black text-sm uppercase tracking-[0.3em]">Step {step} of 5</span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-2 tracking-tight leading-tight">
            {step === 1 && "Profile Photo"}
            {step === 2 && "What's your name?"}
            {step === 3 && "Phone Number"}
            {step === 4 && "How old are you?"}
            {step === 5 && "Child's School"}
          </h1>
        </div>

        <main className="min-h-[300px]">
          {renderStep()}
        </main>

        <footer className="mt-12 sm:mt-16 flex flex-col-reverse sm:flex-row gap-4">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="px-6 sm:px-10 py-4 sm:py-5 bg-white border border-gray-200 font-black rounded-2xl sm:rounded-3xl hover:bg-gray-50 transition w-full sm:w-auto text-center"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button 
              onClick={nextStep}
              className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-3xl hover:bg-indigo-700 shadow-xl sm:shadow-2xl shadow-indigo-200 transition flex items-center justify-center gap-3 group"
            >
              Continue <ChevronRight className="group-hover:translate-x-2 transition" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-3xl hover:bg-indigo-700 shadow-xl sm:shadow-2xl shadow-indigo-200 transition flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Complete Profile"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
