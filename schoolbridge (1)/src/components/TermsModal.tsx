import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface TermsModalProps {
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  const [errorMsg, setErrorMsg] = useState("");

  const handleAccept = () => {
    localStorage.setItem('schoolbridge_terms_accepted', 'true');
    localStorage.setItem('terms_accepted', 'true'); // For legacy support
    onAccept();
  };

  const handleDecline = () => {
    setErrorMsg("You must accept to use SchoolBridge");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto font-sans">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[var(--card)] w-full max-w-3xl rounded-[2rem] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 sm:p-10 bg-indigo-600 text-white shrink-0">
          <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">Privacy & Policy</h2>
          <p className="text-indigo-100 text-lg font-medium">Please review and accept our policies to continue to SchoolBridge.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 text-[var(--foreground)] bg-[var(--background)]">
          <section>
            <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">1. Terms of Service</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              By using SchoolBridge, you agree to our terms of connecting schools and parents. You agree not to post harmful content, spam, or misleading information. We reserve the right to suspend accounts that violate these guidelines.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">2. Privacy Policy</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Your privacy is important to us. We store your school information, photos, and contact details securely. We do not sell your data to third parties. Your data is used solely for the functionality of the communication platform between parents and schools.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">3. Data Security</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              We use standard encryption to protect your information. As a user, you are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>
        </div>

        <div className="p-6 sm:p-8 border-t border-[var(--border)] flex flex-col gap-4 bg-[var(--card)] shrink-0">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold border border-red-100 dark:border-red-900/30"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </motion.div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDecline}
              className="flex-1 py-4 px-6 bg-[var(--background)] text-[var(--foreground)] border-2 border-[var(--border)] font-black rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition uppercase tracking-widest text-sm"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="flex-[2] py-4 px-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 dark:shadow-none uppercase tracking-widest text-sm"
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
