import React, { useState, useEffect } from 'react';
import PartyBackground from './components/PartyBackground';
import EventHeader from './components/EventHeader';
import AttendanceForm from './components/AttendanceForm';
import SubmissionModal from './components/SubmissionModal';
import AdminRecordsModal from './components/AdminRecordsModal';
import LoginScreen from './components/LoginScreen';
import { checkSession, logout } from './services/api';
import { Database, LogOut, Loader2, BookOpen } from 'lucide-react';

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [adminUser, setAdminUser] = useState(null); // { username, department, role, name, departmentName }
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession().then((res) => {
      if (res.ok && res.data?.authenticated) {
        setAdminUser({
          username: res.data.username,
          department: res.data.department || 'all',
          role: res.data.role || 'master_admin',
          name: res.data.name || res.data.username,
          departmentName: res.data.departmentName || 'All Departments',
        });
      }
      setChecking(false);
    });
  }, []);

  const handleAuthLost = () => {
    setModalOpen(false);
    setRecordsModalOpen(false);
    setAdminUser(null);
  };

  const handleLoggedIn = (userData) => {
    if (userData && typeof userData === 'object') {
      setAdminUser({
        username: userData.username,
        department: userData.department || 'all',
        role: userData.role || 'master_admin',
        name: userData.name || userData.username,
        departmentName: userData.departmentName || 'All Departments',
      });
    } else {
      setAdminUser({
        username: String(userData),
        department: 'all',
        role: 'master_admin',
        name: String(userData),
        departmentName: 'All Departments',
      });
    }
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
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#a51c30] animate-spin" />
      </div>
    );
  }

  if (!adminUser) return <LoginScreen onLoggedIn={handleLoggedIn} />;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between pb-8">
      {/* Background Academic Lighting */}
      <PartyBackground />

      {/* Top Academic Navigation Bar */}
      <header className="relative z-20 w-full bg-[#a51c30] text-white border-b-2 border-[#c59b27] shadow-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Crest + Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-9 bg-[#801424] border border-[#c59b27] rounded-b text-[#f5e6be] flex flex-col items-center justify-center font-serif text-[7.5px] font-bold leading-none shadow-sm">
              <span>EN</span>
              <span className="my-0.5">IG</span>
              <span>MA</span>
            </div>
            <div>
              <span className="font-serif font-bold text-sm md:text-base tracking-wider uppercase block">
                ENIGMA 2026
              </span>
              <span className="text-[10px] text-[#f5e6be] font-serif italic block -mt-0.5">
                Official Duty & Attendance Registry
              </span>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setRecordsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#801424] border border-[#c59b27]/60 text-[#f5e6be] hover:bg-white hover:text-[#a51c30] transition-all text-xs font-serif font-bold cursor-pointer shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Official Ledger</span>
            </button>

            {/* Officer Identification Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-serif font-bold text-xs text-white leading-tight">
                  {adminUser.name}
                </span>
                <span className="text-[9.5px] font-sans font-semibold text-[#f5e6be] tracking-wider uppercase">
                  {adminUser.department === 'all'
                    ? (adminUser.role === 'super_admin' ? 'Super User (All Depts)' : 'Master Admin')
                    : `${adminUser.departmentName || adminUser.department} Admin`}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-stone-200 hover:text-white transition-all text-xs font-serif cursor-pointer border border-white/10"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="sm:hidden font-sans text-[11px] font-semibold">{adminUser.username}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Container - Center Academic Form Card */}
      <div className="relative z-10 w-full max-w-2xl bg-white border border-[#a51c30]/25 rounded-3xl p-6 md:p-8 shadow-xl my-6 mx-auto">
        
        {/* Crimson accent top line */}
        <div className="absolute -top-px left-8 right-8 h-1 bg-[#a51c30]" />
        
        {/* Header Section */}
        <EventHeader />

        {/* Attendance Form */}
        <AttendanceForm
          currentAdmin={adminUser}
          onSubmitSuccess={handleFormSubmit}
          onAuthLost={handleAuthLost}
        />

        {/* Footer Credit & Admin Viewer Link */}
        <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 font-serif">
          <span>ENIGMA 2026 &copy; Official Attendance & Duty Portal</span>
          
          <button 
            onClick={() => setRecordsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#faf9f6] border border-stone-300 text-[#a51c30] hover:bg-[#a51c30] hover:text-white transition-all cursor-pointer font-bold"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View Live Data Records</span>
          </button>
        </div>
      </div>

      {/* Payload Modal */}
      <SubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        formData={submittedData}
      />

      {/* Admin Live Records Viewer Modal */}
      <AdminRecordsModal
        isOpen={recordsModalOpen}
        onClose={() => setRecordsModalOpen(false)}
        onAuthLost={handleAuthLost}
        currentAdmin={adminUser}
      />
    </div>
  );
}
