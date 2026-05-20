import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { sendEmailVerification, onAuthStateChanged, reload } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../firebase';
import { useAppStore } from '../../store/useAppStore';
import { 
  Loader2, Plus, Trash2, CheckCircle, XCircle, Upload, 
  MapPin, Mail, Phone, User, Info, Link as LinkIcon, 
  ChevronRight, Camera, X, AlertCircle, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Teacher {
  id: string;
  name: string;
  role: string;
  subject: string;
  gradeLevel: string;
  experience: string;
}

interface PhotoItem {
  id: string;
  previewUrl: string;
  finalUrl?: string;
  progress: number;
  isError?: boolean;
}

export const SchoolOnboarding: React.FC = () => {
  const { user, setOnboardingCompleted } = useAppStore();
  const navigate = useNavigate();

  // Performance Logging
  useEffect(() => {
    console.log('Step 3: Component mount started', new Date().toISOString());
    const timer = setTimeout(() => {
      console.log('Step 4: Form rendered fully', new Date().toISOString());
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Form State
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [telegram, setTelegram] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Photos State
  const [schoolPhotos, setSchoolPhotos] = useState<PhotoItem[]>([]);
  const [principal, setPrincipal] = useState({ name: '', phone: '', email: '', photo: '' });
  const [director, setDirector] = useState({ name: '', phone: '', email: '', photo: '' });

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, 'id'>>({
    name: '', role: '', subject: '', gradeLevel: '', experience: ''
  });

  // UI & Auth State
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Paragraph Count logic
  const paragraphs = description.split('\n').filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  useEffect(() => {
    if (!auth.currentUser) return;
    
    setIsEmailVerified(auth.currentUser.emailVerified);
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setIsEmailVerified(u.emailVerified);
    });
    
    const checkStatus = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          setIsEmailVerified(true);
          // Auto advance from step 3 if verified
          if (step === 3) setStep(4);
        }
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(checkStatus);
    };
  }, [step]);

  const validatePhone = (phone: string) => {
    const ethioRegex = /^(?:\+251|0)[1-9]\d{8}$/;
    return ethioRegex.test(phone.replace(/\s/g, ''));
  };

  const nextStep = () => {
    if (step === 1 && !name) return toast.error('School name is required');
    if (step === 2) {
      if (schoolPhotos.length === 0) return toast.error('Add at least one school photo');
      if (!validatePhone(phone1)) return toast.error('Valid primary phone number required');
    }
    if (step === 3 && !isEmailVerified) return toast.error('Please verify your email first');
    if (step === 4 && telegram && !telegram.startsWith('http')) return toast.error('Provide a valid Telegram URL');
    if (step === 5) {
      if (paragraphCount < 2 || paragraphCount > 7) return toast.error('Provide 2-7 paragraphs of description');
    }
    if (step === 6 && !location) return toast.error('Location is required');
    if (step === 7) {
      if (!principal.name || !principal.photo || !director.name || !director.photo) {
        return toast.error('Principal and Director details with photos are required');
      }
    }
    if (step === 8 && teachers.length === 0) return toast.error('Add at least one teacher staff');

    if (step < 9) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Used for principal/director single photos
  const handleFileUpload = (file: File, type: string, onComplete: (url: string) => void) => {
    if (!user) return;
    const fileId = Math.random().toString(36).substring(7);
    const storageRef = ref(storage, `schools/${user.uid}/${type}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      }, 
      (error: any) => {
        toast.error('Upload failed');
        console.error('Upload error:', error);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onComplete(downloadURL);
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      }
    );
  };

  // Modern school photo gallery logic
  const handlePhotoUpload = (file: File, id: string) => {
    if (!user) return;
    const storageRef = ref(storage, `schools/${user.uid}/gallery/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setSchoolPhotos(prev => prev.map(p => p.id === id ? { ...p, progress, isError: false } : p));
      }, 
      (error: any) => {
        toast.error('Gallery upload failed');
        setSchoolPhotos(prev => prev.map(p => p.id === id ? { ...p, isError: true } : p));
      }, 
      async () => {
        const finalUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setSchoolPhotos(prev => prev.map(p => p.id === id ? { ...p, finalUrl, progress: 100, isError: false } : p));
      }
    );
  };

  const addSchoolPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      const id = Math.random().toString(36).substring(7);
      const previewUrl = URL.createObjectURL(file);
      setSchoolPhotos(prev => [...prev, { id, previewUrl, progress: 0 }]);
      handlePhotoUpload(file, id);
    });
    e.target.value = '';
  };

  const handleAddTeacher = () => {
    if (!newTeacher.name || !newTeacher.role || !newTeacher.subject) {
      toast.error('Please fill teacher basic info');
      return;
    }
    setTeachers(prev => [...prev, { ...newTeacher, id: Date.now().toString() }]);
    setNewTeacher({ name: '', role: '', subject: '', gradeLevel: '', experience: '' });
    setShowTeacherForm(false);
  };

  const handleSendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        toast.success('Verification email sent!');
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const schoolData = {
        name,
        phone_numbers: [phone1, phone2].filter(Boolean),
        telegram_link: telegram,
        description,
        location: { address: location },
        principal,
        director,
        teachers,
        photoUrls: schoolPhotos.filter(p => p.finalUrl).map(p => p.finalUrl),
        verified_badge: true,
        user_id: user?.uid,
        created_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'schools', user!.uid), schoolData);
      await setDoc(doc(db, 'users', user!.uid), { onboardingCompleted: true }, { merge: true });
      
      localStorage.setItem('onboarding_complete', 'true');
      localStorage.setItem('schoolbridge_onboarding_done', 'true');
      setOnboardingCompleted(true);
      
      toast.success('🎉 Welcome to SchoolBridge!');
      navigate('/school/dashboard', { replace: true });
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-gray-500">School Name</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder="Ex. Sunshine Academy"
                className="w-full p-6 bg-white rounded-3xl border border-gray-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 transition text-2xl font-black"
              />
            </div>
          </motion.section>
        );

      case 2:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <label className="text-sm font-black uppercase text-gray-500">School Photos (Max 10MB each)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {schoolPhotos.map(photo => (
                  <div key={photo.id} className="aspect-square rounded-2xl overflow-hidden relative border border-gray-100 group">
                    <img src={photo.previewUrl} className="w-full h-full object-cover" />
                    {photo.progress < 100 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="text-white animate-spin" />
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setSchoolPhotos(prev => prev.filter(p => p.id !== photo.id))}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-600 transition">
                  <input type="file" multiple className="hidden" accept="image/*" onChange={addSchoolPhoto} />
                  <Camera className="text-gray-400 mb-2" />
                  <span className="text-xs font-bold text-gray-400">Add Photo</span>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black uppercase text-gray-500">Phone Numbers (Max 2)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="Primary (+251...)"
                  className="p-4 bg-white rounded-2xl border border-gray-100 outline-none focus:ring-2 ring-indigo-600"
                />
                <input 
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="Secondary (Optional)"
                  className="p-4 bg-white rounded-2xl border border-gray-100 outline-none focus:ring-2 ring-indigo-600"
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
            className="text-center space-y-8 py-12"
          >
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white shadow-xl ${isEmailVerified ? 'bg-green-500' : 'bg-orange-500'}`}>
              {isEmailVerified ? <CheckCircle size={40} /> : <Mail size={40} />}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{isEmailVerified ? 'Email Verified' : 'Check Your Inbox'}</h3>
              <p className="text-gray-500 font-medium">We sent a verification link to <span className="font-bold text-indigo-600">{user?.email}</span></p>
            </div>
            {!isEmailVerified && (
              <button 
                type="button"
                onClick={handleSendVerification}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition"
              >
                Resend Verification Email
              </button>
            )}
            <p className="text-sm text-gray-400 italic">Looking for verification... once verified, we'll automatically move to the next step.</p>
          </motion.section>
        );

      case 4:
        return (
          <motion.section 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-black uppercase text-gray-500">Telegram Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/yourschool"
                  className="w-full pl-12 pr-4 py-6 bg-white rounded-3xl border border-gray-100 outline-none focus:ring-2 ring-indigo-600 transition font-medium"
                />
              </div>
              <p className="text-xs text-gray-400 font-bold mt-2">Connect with parents via your official Telegram channel</p>
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
              <div className="flex justify-between items-end">
                <label className="text-sm font-black uppercase text-gray-500">School Description</label>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${paragraphCount >= 2 && paragraphCount <= 7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {paragraphCount} PARAGRAPHS
                </span>
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                placeholder="Vision, history, achievements... separate by new lines for paragraphs."
                className="w-full p-8 bg-white rounded-[2rem] border border-gray-100 outline-none focus:ring-4 ring-indigo-50 transition font-medium leading-relaxed resize-none"
              />
              <p className="text-xs text-gray-400 font-bold">Goal: 2 to 7 paragraphs for a professional profile.</p>
            </div>
          </motion.section>
        );

      case 6:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <label className="text-sm font-black uppercase text-gray-500">School Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" />
                <input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter physical address / search..."
                  className="w-full pl-12 pr-4 py-6 bg-white rounded-3xl border border-gray-100 outline-none focus:ring-2 ring-indigo-600 transition font-black"
                />
              </div>
              <div className="aspect-video bg-indigo-50 rounded-3xl border-2 border-indigo-100 flex flex-col items-center justify-center text-indigo-300">
                <MapPin size={48} className="mb-4 opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest opacity-50">Interactive Map Component</p>
              </div>
            </div>
          </motion.section>
        );

      case 7:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Principal Card */}
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-xl mb-6">Principal Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <label className="w-24 h-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden group">
                      {principal.photo ? <img src={principal.photo} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'principal', (url) => setPrincipal(p => ({...p, photo: url })))} />
                    </label>
                  </div>
                  <input placeholder="Full Name" value={principal.name} onChange={(e) => setPrincipal(p => ({...p, name: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  <input placeholder="Phone" value={principal.phone} onChange={(e) => setPrincipal(p => ({...p, phone: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  <input placeholder="Email" value={principal.email} onChange={(e) => setPrincipal(p => ({...p, email: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                </div>
              </div>

              {/* Director Card */}
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h3 className="font-black text-xl mb-6">Director Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <label className="w-24 h-24 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden group">
                      {director.photo ? <img src={director.photo} className="w-full h-full object-cover" /> : <Camera className="text-gray-300" />}
                      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'director', (url) => setDirector(p => ({...p, photo: url })))} />
                    </label>
                  </div>
                  <input placeholder="Full Name" value={director.name} onChange={(e) => setDirector(p => ({...p, name: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  <input placeholder="Phone" value={director.phone} onChange={(e) => setDirector(p => ({...p, phone: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  <input placeholder="Email" value={director.email} onChange={(e) => setDirector(p => ({...p, email: e.target.value}))} className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                </div>
              </div>
            </div>
          </motion.section>
        );

      case 8:
        return (
          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black">Teaching Staff</h2>
              <button 
                type="button"
                onClick={() => setShowTeacherForm(true)}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg"
              >
                Add Teacher
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teachers.map(t => (
                <div key={t.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm relative group">
                  <button 
                    onClick={() => setTeachers(prev => prev.filter(x => x.id !== t.id))}
                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                  <h4 className="font-black text-lg">{t.name}</h4>
                  <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{t.role}</p>
                  <div className="mt-4 text-sm text-gray-500 font-medium">
                    {t.subject} • {t.gradeLevel}
                  </div>
                </div>
              ))}
            </div>

            {showTeacherForm && (
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-indigo-600 space-y-4">
                <input placeholder="Full Name" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full p-4 rounded-xl border border-gray-200 outline-none" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="Role" value={newTeacher.role} onChange={e => setNewTeacher({...newTeacher, role: e.target.value})} className="p-4 rounded-xl border border-gray-200 outline-none" />
                  <input placeholder="Subject" value={newTeacher.subject} onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})} className="p-4 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="Grade" value={newTeacher.gradeLevel} onChange={e => setNewTeacher({...newTeacher, gradeLevel: e.target.value})} className="p-4 rounded-xl border border-gray-200 outline-none" />
                  <input placeholder="Exp" value={newTeacher.experience} onChange={e => setNewTeacher({...newTeacher, experience: e.target.value})} className="p-4 rounded-xl border border-gray-200 outline-none" />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleAddTeacher} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl">Save Teacher</button>
                  <button onClick={() => setShowTeacherForm(false)} className="px-8 py-4 bg-white font-black rounded-xl border border-gray-200">Cancel</button>
                </div>
              </div>
            )}
          </motion.section>
        );

      case 9:
        return (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="bg-indigo-600 p-8 rounded-[3rem] text-white text-center">
              <CheckCircle size={64} className="mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-black mb-2">Review Everything</h2>
              <p className="font-medium opacity-80 text-lg">You're one click away from joining SchoolBridge</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Core Info</h4>
                <p className="text-2xl font-black text-slate-900">{name}</p>
                <div className="mt-4 space-y-2 text-slate-500 font-medium">
                  <p className="flex items-center gap-2"><Phone size={16} /> {phone1}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} /> {location}</p>
                </div>
              </div>
              <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-black text-indigo-600">{teachers.length}</p>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-tighter">Verified Teachers</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Golden Verification</h4>
              <div className="flex items-center gap-4 text-emerald-600 font-black">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <span>Your school is eligible for the Golden Verification Badge</span>
              </div>
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 md:p-12 lg:p-20 font-sans relative">
      <button 
        onClick={handleSignOut}
        className="absolute top-8 right-8 flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold transition-colors uppercase tracking-widest text-xs"
      >
        <LogOut size={16} /> Sign Out
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-12 flex justify-between items-center gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-gray-200'}`} 
            />
          ))}
        </div>

        <div className="mb-12">
          <span className="text-indigo-600 font-black text-sm uppercase tracking-[0.3em]">Step {step} of 9</span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 mt-2 tracking-tight leading-tight">
            {step === 1 && "What's the School Name?"}
            {step === 2 && "Photos & Contact Info"}
            {step === 3 && "Email Verification"}
            {step === 4 && "Telegram Presence"}
            {step === 5 && "Tell us about the school"}
            {step === 6 && "Where are you located?"}
            {step === 7 && "Leadership Team"}
            {step === 8 && "Teaching Staff List"}
            {step === 9 && "Final Review"}
          </h1>
        </div>

        <main className="min-h-[400px]">
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
          {step < 9 ? (
             <button 
              onClick={nextStep}
              className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-3xl hover:bg-indigo-700 shadow-xl sm:shadow-2xl shadow-indigo-200 transition flex items-center justify-center gap-3 group"
            >
              Continue <ChevronRight className="group-hover:translate-x-2 transition" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white font-black rounded-2xl sm:rounded-3xl hover:bg-indigo-700 shadow-xl sm:shadow-2xl shadow-indigo-200 transition flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm and Launch School"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

const Users = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
