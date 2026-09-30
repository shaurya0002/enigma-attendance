import React, { useState, useEffect } from 'react';
import PartyBackground from './components/PartyBackground';
import EventHeader from './components/EventHeader';
import AttendanceForm from './components/AttendanceForm';
import SubmissionModal from './components/SubmissionModal';
import AdminRecordsModal from './components/AdminRecordsModal';
import LoginScreen from './components/LoginScreen';
import { checkSession, logout } from './services/api';
import { Database, LogOut, Loader2 } from 'lucide-react';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [admin, setAdmin] = useState(null); // username when signed in
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession().then((res) => {
      if (res.ok) setAdmin(res.data.username);
      setChecking(false);
    });
  }, []);

  const handleAuthLost = () => {
    setModalOpen(false);
    setRecordsModalOpen(false);
    setAdmin(null);
  };

  const handleLogout = async () => {
    await logout();
    handleAuthLost();
  };

  const handleFormSubmit = (entry) => {
    setSubmittedData(entry);
    setModalOpen(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!admin) return <LoginScreen onLoggedIn={setAdmin} />;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8">
      {/* Background Dark Sunset Party Lights */}
      <PartyBackground />

      {/* Main Content Container - Minimal Focused Center Form Card */}
      <div className="relative z-10 w-full max-w-2xl bg-[#0d0a1c]/90 border border-indigo-700/30 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(30,15,56,0.5)] backdrop-blur-2xl my-auto">
        
        {/* Subtle sunset ambient top accent line */}
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
        
        {/* Header Section */}
        <EventHeader />

        {/* Attendance Form */}
        <AttendanceForm onSubmitSuccess={handleFormSubmit} onAuthLost={handleAuthLost} />

        {/* Footer Credit & Admin Viewer Link */}
        <div className="mt-8 pt-4 border-t border-indigo-900/30 flex items-center justify-between text-[11px] text-indigo-300/50 font-mono">
          <span>ENIGMA 2026 &copy; Attendance Portal</span>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-rose-300 hover:text-white hover:border-rose-400 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{admin}</span>
          </button>

          <button 
            onClick={() => setRecordsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/50 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>View Live Data Records</span>
          </button>
        </div>
      </div>

      {/* Payload Modal */}
      <SubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={submittedData}
        jsonBinResult={{ success: true, isMock: false }}
      />

      {/* Admin Live Records Viewer Modal */}
      <AdminRecordsModal
        isOpen={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
        onAuthLost={handleAuthLost}
      />
    </div>
  );
}
