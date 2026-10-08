import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Hash, 
  Phone,
  GraduationCap, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Send, 
  RotateCcw,
  Info,
  CheckCircle,
  Loader2,
  BookOpen,
  Search,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { EVENT_TEAMS, ACADEMIC_YEARS, STANDARD_LECTURES, getVisibleTeams } from '../config/teams';
import { addLog, listStudents, addStudent } from '../services/api';
import { filterRoster, registerStudentLocally } from '../data/studentsData';

export default function AttendanceForm({ onSubmitSuccess, onAuthLost, currentAdmin }) {
  const isMaster = !currentAdmin || currentAdmin.department === 'all' || currentAdmin.role === 'master_admin' || currentAdmin.role === 'super_admin';
  const visibleTeams = getVisibleTeams(isMaster);
  const defaultDept = !isMaster && currentAdmin?.department ? currentAdmin.department : (visibleTeams[0]?.id || 'decor');

  // Department Selection State (Master Admin can select, Sub Admin is locked)
  const [masterSelectedTeam, setMasterSelectedTeam] = useState(defaultDept);
  const selectedTeam = isMaster ? masterSelectedTeam : (currentAdmin?.department || defaultDept);
  const effectiveTeam = selectedTeam;

  // Student Candidates & Search Filtration State
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateList, setCandidateList] = useState(() => 
    filterRoster({ department: defaultDept, search: '' })
  );
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [manualAddSuccess, setManualAddSuccess] = useState('');

  // Student Identity Fields
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [year, setYear] = useState('2nd Year');
  const [studentClass, setStudentClass] = useState('General');
  
  // Date and Lectures Tracker State
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [selectedLectures, setSelectedLectures] = useState([1, 2]);
  const [extraAttendance, setExtraAttendance] = useState(0); // +1 or +2 extra attendance
  const [customNote, setCustomNote] = useState('');

  // UI & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Fetch candidates from database whenever department or search changes
  const fetchCandidates = useCallback(async (dept, search) => {
    // 1. Instantly display candidates from embedded roster + localStorage
    const localMatches = filterRoster({ department: dept, search });
    setCandidateList(localMatches);

    // 2. Query backend API for live database candidates (merged / refreshed)
    setIsSearching(true);
    try {
      const res = await listStudents({ department: dept, search });
      if (res.status === 401) return onAuthLost?.();
      if (res.ok && Array.isArray(res.data?.students)) {
        // Merge server and local roster to prevent overwriting freshly added local candidates
        const mergedMap = new Map();
        localMatches.forEach((s) => mergedMap.set(`${s.rollNumber}_${s.department}`, s));
        res.data.students.forEach((s) => mergedMap.set(`${s.rollNumber}_${s.department}`, s));
        setCandidateList(Array.from(mergedMap.values()));
      }
    } catch (err) {
      console.warn('[attendance form] API roster fetch failed, using embedded roster:', err);
    } finally {
      setIsSearching(false);
    }
  }, [onAuthLost]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(async () => {
      if (ignore) return;
      await fetchCandidates(effectiveTeam, candidateSearch);
    });
    return () => {
      ignore = true;
    };
  }, [effectiveTeam, candidateSearch, fetchCandidates]);

  // When department switches (Master Admin only), reset candidate selection and show new dept candidates
  const handleDepartmentChange = (deptId) => {
    if (!isMaster) return; // Prevent department changing for department admins
    setMasterSelectedTeam(deptId);
    setSelectedCandidate(null);
    setCandidateSearch('');
    setCandidateList(filterRoster({ department: deptId, search: '' }));
    setStudentName('');
    setRollNumber('');
    setContactNumber('');
    setManualEntryMode(false);
    setManualAddSuccess('');
    setErrors({});
  };

  // Select a student from database search results
  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setStudentName(candidate.name || '');
    setRollNumber(candidate.rollNumber || '');
    setContactNumber(candidate.contact || '');
    setYear(candidate.year || '2nd Year');
    setStudentClass(candidate.classBatch || 'General');
    setErrors((prev) => ({ ...prev, studentName: undefined, rollNumber: undefined }));
    setManualEntryMode(false);
  };

  const handleClearSelectedCandidate = () => {
    setSelectedCandidate(null);
    setStudentName('');
    setRollNumber('');
    setContactNumber('');
    setManualEntryMode(false);
    setManualAddSuccess('');
  };

  // Explicitly register manually entered student into current department roster
  const handleRegisterManualStudent = async () => {
    const newErrors = {};
    if (!studentName.trim()) newErrors.studentName = 'Candidate name is required';
    if (!rollNumber.trim()) newErrors.rollNumber = 'University roll number is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    setIsRegisteringStudent(true);
    setErrors((prev) => ({ ...prev, studentName: undefined, rollNumber: undefined }));

    const cleanRoll = rollNumber.trim().toUpperCase();
    const candidatePayload = {
      id: `CUSTOM_${Date.now()}`,
      name: studentName.trim(),
      rollNumber: cleanRoll,
      contact: contactNumber.trim(),
      year: year || '2nd Year',
      classBatch: studentClass || 'General',
      department: effectiveTeam,
    };

    // 1. Save locally to localStorage so it's instantly available in search & offline
    registerStudentLocally(candidatePayload);

    // 2. Select this candidate immediately so they see the Verified Candidate card
    handleSelectCandidate(candidatePayload);

    // 3. Update candidateList in current state immediately
    setCandidateList((prev) => [
      candidatePayload,
      ...prev.filter((c) => !(c.rollNumber === cleanRoll && (c.department || effectiveTeam) === effectiveTeam)),
    ]);

    // 4. Save to backend database
    try {
      await addStudent(candidatePayload);
    } catch (err) {
      console.warn('[attendance form] Server student persist notice:', err);
    } finally {
      setIsRegisteringStudent(false);
      setManualEntryMode(false);
      const deptObj = EVENT_TEAMS.find((t) => t.id === effectiveTeam) || EVENT_TEAMS[0];
      setManualAddSuccess(`${candidatePayload.name} (${cleanRoll}) is now added to ${deptObj.name} roster!`);
      setTimeout(() => setManualAddSuccess(''), 5000);
    }
  };

  // Toggle lecture selection
  const toggleLecture = (lectureId) => {
    if (selectedLectures.includes(lectureId)) {
      setSelectedLectures(selectedLectures.filter((id) => id !== lectureId));
    } else {
      setSelectedLectures([...selectedLectures, lectureId].sort((a, b) => a - b));
    }
  };

  const handleReset = () => {
    setSelectedCandidate(null);
    setCandidateSearch('');
    setStudentName('');
    setRollNumber('');
    setContactNumber('');
    setYear('2nd Year');
    setStudentClass('General');
    setSelectedLectures([]);
    setExtraAttendance(0);
    setCustomNote('');
    setErrors({});
    setManualEntryMode(false);
    setManualAddSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!studentName.trim()) newErrors.studentName = 'Please select or enter the student name';
    if (!rollNumber.trim()) newErrors.rollNumber = 'University roll number is required';
    if (!effectiveTeam) newErrors.selectedTeam = 'Please select a duty department';
    if (selectedLectures.length === 0 && extraAttendance === 0) {
      newErrors.selectedLectures = 'Select at least one lecture or add extra attendance (+1/+2)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitError('');

    const cleanRoll = rollNumber.trim().toUpperCase();

    // ALWAYS ensure student is permanently added into this department's roster
    const candidateData = {
      id: selectedCandidate?.id || `CUSTOM_${Date.now()}`,
      name: studentName.trim(),
      rollNumber: cleanRoll,
      contact: contactNumber.trim(),
      year: year || '2nd Year',
      classBatch: studentClass || 'General',
      department: effectiveTeam,
    };

    registerStudentLocally(candidateData);
    addStudent(candidateData).catch((err) =>
      console.warn('[attendance form] Sync student roster warning:', err)
    );

    // Update candidate list in state so they are permanently visible in that department
    setCandidateList((prev) => {
      const filtered = prev.filter(
        (c) => !(c.rollNumber === cleanRoll && (c.department || effectiveTeam) === effectiveTeam)
      );
      return [candidateData, ...filtered];
    });

    const res = await addLog({
      name: studentName.trim(),
      rollNumber: cleanRoll,
      contact: contactNumber.trim(),
      year,
      classBatch: studentClass,
      teamId: effectiveTeam,
      date: attendanceDate,
      lectures: selectedLectures,
      extraAttendance,
      remarks: customNote,
    });
    setIsSubmitting(false);

    if (res.status === 401) return onAuthLost?.();
    if (!res.ok) return setSubmitError(res.data?.error || 'Could not save record. Try again.');

    onSubmitSuccess(res.data.entry);
  };

  const totalEffectivePeriods = selectedLectures.length + extraAttendance;
  const currentDeptObj = EVENT_TEAMS.find((t) => t.id === effectiveTeam) || {
    id: effectiveTeam,
    name: currentAdmin?.departmentName || effectiveTeam,
    description: 'Department operations and assignments.',
    badge: 'Duty',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      
      {/* SECTION 1: Department Selection First */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#a51c30]/15">
          <div className="flex items-center gap-2 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
            <Users className="w-4 h-4 text-[#a51c30]" />
            <span>I. Appointed Duty Committee</span>
          </div>
          <span className="text-[11px] text-stone-500 font-serif italic">
            {isMaster ? 'Master Control: Choose department' : 'Designated Department (Locked)'}
          </span>
        </div>

        {!isMaster ? (
          <div className="p-4 rounded-xl bg-[#faf9f6] border-2 border-[#a51c30]/30 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-serif font-bold text-base text-[#a51c30]">
                  {currentDeptObj.name} Department
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-[#a51c30]/10 text-[#a51c30] border border-[#a51c30]/20 uppercase">
                  {currentDeptObj.badge}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-sans">
                {currentDeptObj.description}
              </p>
              <p className="text-[11px] text-stone-500 font-serif italic mt-1.5">
                Appointed Officer: <strong className="text-stone-800 font-sans">{currentAdmin?.name || currentAdmin?.username}</strong> &bull; Showing only candidates registered under {currentDeptObj.name}.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-600 font-sans mb-3">
              Master Admin Control: Select any official ENIGMA committee to filter and search candidates registered for duty.
            </p>

            {/* Scrollable Team Selector */}
            <div className="max-h-52 overflow-y-auto pr-1 space-y-2 custom-scrollbar rounded-xl">
              {visibleTeams.map((team) => {
                const isSelected = effectiveTeam === team.id;
                return (
                  <div
                    key={team.id}
                    onClick={() => handleDepartmentChange(team.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#a51c30] text-white border-[#c59b27] shadow-sm'
                        : 'bg-[#faf9f6] border-stone-200 hover:border-[#a51c30]/60 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-[#c59b27] bg-[#c59b27] text-[#1e1e1e]' : 'border-stone-400 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-serif font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {team.name}
                          </h4>
                          {team.restricted && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                              isSelected ? 'bg-[#c59b27] text-stone-900' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              Core
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-sans ${isSelected ? 'text-stone-200' : 'text-stone-500'}`}>
                          {team.description}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase tracking-wider flex-shrink-0 ${
                      isSelected ? 'bg-[#7f1322] text-[#f5e6be] border border-[#c59b27]/40' : 'bg-[#a51c30]/10 text-[#a51c30] border border-[#a51c30]/20'
                    }`}>
                      {team.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* SECTION 2: Student Identity - Database Search Filtration */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#a51c30]/15">
          <div className="flex items-center gap-2 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
            <User className="w-4 h-4 text-[#a51c30]" />
            <span>II. Student Candidate Identity</span>
          </div>
          <span className="text-xs font-serif italic text-stone-600">
            Pool: <strong className="text-[#a51c30]">{currentDeptObj.name}</strong>
          </span>
        </div>

        {/* Selected Candidate Verified Card */}
        {selectedCandidate ? (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-400 text-stone-900 mb-4 transition-all animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                  {selectedCandidate.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-serif font-bold text-stone-900">
                      {selectedCandidate.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800 flex items-center gap-1 font-sans">
                      <CheckCircle className="w-3 h-3 text-emerald-700" />
                      Verified Candidate
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 mt-1 font-sans">
                    <span className="font-mono text-stone-800 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-stone-400" />
                      Roll: <strong>{selectedCandidate.rollNumber}</strong>
                    </span>
                    {selectedCandidate.contact && (
                      <span className="flex items-center gap-1 text-stone-800">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {selectedCandidate.contact}
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-serif text-stone-700">
                      <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                      {selectedCandidate.year}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearSelectedCandidate}
                className="px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-sans cursor-pointer transition-colors flex items-center gap-1"
                title="Change selected candidate"
              >
                <X className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Search Input Filter */}
            <div className="mb-3">
              <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
                Search Student in {currentDeptObj.name} <span className="text-[#a51c30]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4 text-[#a51c30]" />
                </div>
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Type student name, contact number, or university roll number..."
                  className="w-full pl-10 pr-10 py-2.5 bg-[#faf9f6] border border-stone-300 focus:border-[#a51c30] rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#a51c30]/20 transition-all font-sans"
                />
                {candidateSearch && (
                  <button
                    type="button"
                    onClick={() => setCandidateSearch('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Candidate Search Results List */}
            <div className="border border-stone-200 rounded-xl bg-[#faf9f6] p-2 max-h-56 overflow-y-auto custom-scrollbar space-y-1.5">
              {isSearching ? (
                <div className="py-6 text-center text-stone-500 font-serif italic text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#a51c30] animate-spin" />
                  <span>Searching database...</span>
                </div>
              ) : candidateList.length === 0 ? (
                <div className="py-6 text-center text-stone-500 font-serif italic text-xs">
                  No registered student found in {currentDeptObj.name} matching "{candidateSearch}".
                </div>
              ) : (
                candidateList.map((cand) => (
                  <div
                    key={cand.id || cand._id || cand.rollNumber}
                    onClick={() => handleSelectCandidate(cand)}
                    className="p-2.5 rounded-lg bg-white border border-stone-200 hover:border-[#a51c30] hover:bg-stone-50 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-stone-900">{cand.name}</span>
                        <span className="font-mono text-[#a51c30] bg-[#a51c30]/10 border border-[#a51c30]/20 px-1.5 py-0.5 rounded text-[10.5px] font-bold">
                          {cand.rollNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-500 font-sans mt-0.5">
                        {cand.contact && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" /> {cand.contact}
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-serif">
                          <GraduationCap className="w-3 h-3 text-stone-400" /> {cand.year}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCandidate(cand);
                      }}
                      className="px-2.5 py-1 rounded bg-[#a51c30] text-white hover:bg-[#7f1322] font-serif font-bold text-[11px] transition-colors cursor-pointer flex-shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Success notification banner if added */}
            {manualAddSuccess && (
              <div className="p-3 my-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn font-sans shadow-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{manualAddSuccess}</span>
              </div>
            )}

            {/* Fallback Manual Toggle */}
            <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-serif italic">Candidate not in roster?</span>
              <button
                type="button"
                onClick={() => setManualEntryMode(!manualEntryMode)}
                className="text-[#a51c30] hover:underline font-serif font-bold cursor-pointer"
              >
                {manualEntryMode ? 'Close manual fields' : '+ Enter candidate manually'}
              </button>
            </div>

            {/* Collapsible Manual Fields */}
            {manualEntryMode && (
              <div className="mt-3 p-4 bg-[#fdfbf7] rounded-xl border border-[#a51c30]/25 space-y-3.5 animate-fadeIn shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-bold text-[#a51c30] uppercase tracking-wider">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New Candidate to {currentDeptObj.name}</span>
                  </div>
                  <span className="text-[10.5px] text-stone-500 font-serif italic">Permanent department roster entry</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                      Student Name <span className="text-[#a51c30]">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Full Name (e.g. John Doe)"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 focus:border-[#a51c30] rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#a51c30]"
                    />
                    {errors.studentName && <p className="text-[10px] text-rose-600 mt-1 font-sans">{errors.studentName}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                      University Roll Number <span className="text-[#a51c30]">*</span>
                    </label>
                    <input
                      type="text"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="Roll Number (e.g. 2500100100999)"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 focus:border-[#a51c30] rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#a51c30]"
                    />
                    {errors.rollNumber && <p className="text-[10px] text-rose-600 mt-1 font-sans">{errors.rollNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                      Contact Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="10-digit phone number"
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 focus:border-[#a51c30] rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#a51c30]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif font-bold text-stone-700 mb-1">
                      Academic Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-stone-300 focus:border-[#a51c30] rounded-lg text-xs text-stone-900 focus:outline-none"
                    >
                      {ACADEMIC_YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setManualEntryMode(false);
                      setStudentName('');
                      setRollNumber('');
                      setContactNumber('');
                      setErrors((prev) => ({ ...prev, studentName: undefined, rollNumber: undefined }));
                    }}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 font-serif text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleRegisterManualStudent}
                    disabled={isRegisteringStudent}
                    className="px-4 py-2 rounded-lg bg-[#a51c30] hover:bg-[#7f1322] border border-[#c59b27]/40 text-white font-serif font-bold text-xs tracking-wider uppercase shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isRegisteringStudent ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding to Roster...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-[#f5e6be]" />
                        <span>Add Candidate to {currentDeptObj.name} Roster</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: Duty Hours, Skipped Lectures & +1 / +2 Extra Attendance Placeholder */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#a51c30]/15">
          <div className="flex items-center gap-2 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
            <Clock className="w-4 h-4 text-[#a51c30]" />
            <span>III. Duty Hours & Skipped Lectures</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-[#a51c30]/10 border border-[#a51c30]/20 text-[#a51c30] text-xs font-serif font-bold">
            {totalEffectivePeriods} Total {totalEffectivePeriods === 1 ? 'Period' : 'Periods'} Credited
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date Selector */}
          <div className="md:col-span-1">
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-[#a51c30]" /> Duty Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#faf9f6] border border-stone-300 rounded-xl text-stone-900 text-sm focus:outline-none focus:border-[#a51c30] font-mono"
            />
          </div>

          {/* Quick Info hint */}
          <div className="md:col-span-2 flex items-center gap-2 p-3 bg-[#faf9f6] border border-[#a51c30]/20 rounded-xl text-xs text-stone-700 font-sans">
            <Info className="w-4 h-4 text-[#a51c30] flex-shrink-0" />
            <span>
              Select the lecture periods skipped during official duty, plus add any extra attendance credits below.
            </span>
          </div>
        </div>

        {/* Skipped Lecture Grid */}
        <label className="block text-xs font-serif font-bold text-stone-800 mb-2 uppercase tracking-wider">
          Standard Lecture Periods <span className="text-[#a51c30]">*</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          {STANDARD_LECTURES.map((lect) => {
            const isSelected = selectedLectures.includes(lect.id);
            return (
              <button
                type="button"
                key={lect.id}
                onClick={() => toggleLecture(lect.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#a51c30] border-[#c59b27] text-white shadow-sm'
                    : 'bg-[#faf9f6] border-stone-300 text-stone-700 hover:border-[#a51c30] hover:text-[#a51c30]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-serif font-bold text-sm">{lect.label}</span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-[#f5e6be] stroke-[2.5]" />
                  )}
                </div>
                <span className={`text-[10px] font-mono block ${isSelected ? 'text-stone-200' : 'text-stone-500'}`}>
                  {lect.time}
                </span>
              </button>
            );
          })}
        </div>

        {/* NEW REQUIREMENT: PLACEHOLDER FOR +1 OR +2 ATTENDANCE */}
        <div className="p-3.5 rounded-xl bg-[#faf9f6] border-2 border-dashed border-[#c59b27]/60 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#a51c30]" />
              Additional Attendance Credit (+1 / +2 Placeholder)
            </label>
            <span className="text-[11px] font-sans font-semibold text-[#a51c30]">
              {extraAttendance > 0 ? `+${extraAttendance} Extra Added` : 'No Extra Added'}
            </span>
          </div>

          <p className="text-[11px] text-stone-600 font-sans mb-3">
            Add bonus attendance units or extra classes for special duties, rehearsals, or setup extensions.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setExtraAttendance(0)}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer border ${
                extraAttendance === 0
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              +0 Standard
            </button>

            <button
              type="button"
              onClick={() => setExtraAttendance(1)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                extraAttendance === 1
                  ? 'bg-[#a51c30] text-white border-[#c59b27] shadow-sm'
                  : 'bg-white text-stone-800 border-stone-300 hover:border-[#a51c30] hover:text-[#a51c30]'
              }`}
            >
              <Plus className="w-3 h-3" /> 1 Extra Lecture
            </button>

            <button
              type="button"
              onClick={() => setExtraAttendance(2)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                extraAttendance === 2
                  ? 'bg-[#a51c30] text-white border-[#c59b27] shadow-sm'
                  : 'bg-white text-stone-800 border-stone-300 hover:border-[#a51c30] hover:text-[#a51c30]'
              }`}
            >
              <Plus className="w-3 h-3" /> 2 Extra Lectures
            </button>

            {/* Custom Extra Numeric Input Placeholder */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-stone-500 font-sans">Custom:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={extraAttendance}
                onChange={(e) => setExtraAttendance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-14 px-2 py-1 bg-white border border-stone-300 rounded-lg text-center text-xs font-mono font-bold text-stone-900 focus:outline-none focus:border-[#a51c30]"
              />
            </div>
          </div>
        </div>

        {errors.selectedLectures && <p className="text-xs text-rose-600 mb-3 font-sans">{errors.selectedLectures}</p>}

        {/* Optional Duty Remarks */}
        <div>
          <label className="block text-xs font-serif font-bold text-stone-800 mb-1 uppercase tracking-wider">
            Duty Remarks / Task Details (Optional)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Stage light setup, flashmob choreography rehearsal, promo drive"
            className="w-full px-3.5 py-2 bg-[#faf9f6] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#a51c30] font-sans"
          />
        </div>
      </div>

      {submitError && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 font-sans">{submitError}</p>
      )}

      {/* FORM ACTION BUTTONS */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-4 py-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 font-serif font-bold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Form
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-xl bg-[#a51c30] hover:bg-[#7f1322] border border-[#c59b27]/40 text-white font-serif font-bold text-sm tracking-wider uppercase shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Saving Record in Database...</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 text-[#f5e6be]" />
              <span>Mark Attendance ({totalEffectivePeriods} {totalEffectivePeriods === 1 ? 'Period' : 'Periods'})</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
