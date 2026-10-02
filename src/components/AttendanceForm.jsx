import React, { useState } from 'react';
import { 
  User, 
  Hash, 
  GraduationCap, 
  Users, 
  Calendar as CalendarIcon, 
  Clock, 
  Check, 
  Send, 
  RotateCcw,
  Info,
  CheckCircle,
  Layers,
  Loader2,
  BookOpen
} from 'lucide-react';
import { EVENT_TEAMS, ACADEMIC_YEARS, STANDARD_LECTURES } from '../config/teams';
import { addLog } from '../services/api';

export default function AttendanceForm({ onSubmitSuccess, onAuthLost }) {
  // Form State
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState('3rd Year');
  const [studentClass, setStudentClass] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(EVENT_TEAMS[0].id);
  
  // Date and Lectures Tracker State
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [selectedLectures, setSelectedLectures] = useState([1, 2]);
  const [customNote, setCustomNote] = useState('');

  // UI & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Toggle lecture selection
  const toggleLecture = (lectureId) => {
    if (selectedLectures.includes(lectureId)) {
      setSelectedLectures(selectedLectures.filter(id => id !== lectureId));
    } else {
      setSelectedLectures([...selectedLectures, lectureId].sort((a, b) => a - b));
    }
  };

  const handleReset = () => {
    setStudentName('');
    setRollNumber('');
    setYear('3rd Year');
    setStudentClass('');
    setSelectedTeam(EVENT_TEAMS[0].id);
    setAttendanceDate(new Date().toISOString().split('T')[0]);
    setSelectedLectures([]);
    setCustomNote('');
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!rollNumber.trim()) newErrors.rollNumber = 'University roll number is required';
    if (!studentClass.trim()) newErrors.studentClass = 'Class / Batch is required (e.g. B1, B2)';
    if (!selectedTeam) newErrors.selectedTeam = 'Please select your event department';
    if (selectedLectures.length === 0) newErrors.selectedLectures = 'Select at least one skipped lecture';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setSubmitError('');
    const res = await addLog({
      name: studentName,
      rollNumber,
      year,
      classBatch: studentClass,
      teamId: selectedTeam,
      date: attendanceDate,
      lectures: selectedLectures,
      remarks: customNote,
    });
    setIsSubmitting(false);

    if (res.status === 401) return onAuthLost();
    if (!res.ok) return setSubmitError(res.data?.error || 'Could not save. Try again.');
    onSubmitSuccess(res.data.entry);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      
      {/* SECTION 1: Student Personal Details */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#a51c30]/15 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
          <User className="w-4 h-4 text-[#a51c30]" />
          <span>I. Student Identification</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Name Input */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
              Student Full Name <span className="text-[#a51c30]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alexander Mercer"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#faf9f6] border ${errors.studentName ? 'border-rose-500' : 'border-stone-300 focus:border-[#a51c30]'} rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#a51c30]/20 transition-all font-sans`}
              />
            </div>
            {errors.studentName && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.studentName}</p>}
          </div>

          {/* Roll Number Input */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider">
              University Roll Number <span className="text-[#a51c30]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 2100520100089"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#faf9f6] border ${errors.rollNumber ? 'border-rose-500' : 'border-stone-300 focus:border-[#a51c30]'} rounded-xl text-stone-900 placeholder-stone-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a51c30]/20 transition-all`}
              />
            </div>
            {errors.rollNumber && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.rollNumber}</p>}
          </div>
        </div>

        {/* SECTION 2: Year and Custom Class Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Year Picker */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#a51c30]" /> Academic Standing
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACADEMIC_YEARS.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setYear(y)}
                  className={`py-2 text-xs font-serif font-bold rounded-xl border transition-all cursor-pointer ${
                    year === y
                      ? 'bg-[#a51c30] text-white border-[#c59b27] shadow-sm'
                      : 'bg-[#faf9f6] text-stone-700 border-stone-300 hover:border-[#a51c30] hover:text-[#a51c30]'
                  }`}
                >
                  {y.replace(' Year', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Class / Batch Text Input */}
          <div>
            <label className="block text-xs font-serif font-bold text-stone-800 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#a51c30]" /> Class / Section Batch <span className="text-[#a51c30]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Layers className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="e.g. B1, B2, CS-A"
                className={`w-full pl-10 pr-4 py-2 bg-[#faf9f6] border ${errors.studentClass ? 'border-rose-500' : 'border-stone-300 focus:border-[#a51c30]'} rounded-xl text-stone-900 placeholder-stone-400 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#a51c30]/20 transition-all`}
              />
            </div>
            {errors.studentClass && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.studentClass}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 3: Department / Event Team */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#a51c30]/15">
          <div className="flex items-center gap-2 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
            <Users className="w-4 h-4 text-[#a51c30]" />
            <span>II. Appointed Duty Committee</span>
          </div>
          <span className="text-[11px] text-stone-500 font-serif italic">Scroll to view all teams</span>
        </div>

        <p className="text-xs text-stone-600 font-sans mb-3">
          Select the official ENIGMA committee or department to which you are assigned.
        </p>

        {/* SCROLLABLE TEAM SELECTION CONTAINER */}
        <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar rounded-xl">
          {EVENT_TEAMS.map((team) => {
            const isSelected = selectedTeam === team.id;
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-[#a51c30] text-white border-[#c59b27] shadow-sm'
                    : 'bg-[#faf9f6] border-stone-200 hover:border-[#a51c30]/60 text-stone-800'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-[#c59b27] bg-[#c59b27] text-[#1e1e1e]' : 'border-stone-400 bg-white'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-serif font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                      {team.name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-serif font-bold uppercase tracking-wider ${
                      isSelected ? 'bg-[#7f1322] text-[#f5e6be] border border-[#c59b27]/40' : 'bg-[#a51c30]/10 text-[#a51c30] border border-[#a51c30]/20'
                    }`}>
                      {team.badge}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 leading-snug font-sans ${isSelected ? 'text-stone-100' : 'text-stone-600'}`}>
                    {team.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {errors.selectedTeam && <p className="text-xs text-rose-600 mt-2 font-sans">{errors.selectedTeam}</p>}
      </div>

      {/* SECTION 4: Duty Hours & Skipped Lectures */}
      <div className="bg-white border border-[#a51c30]/20 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#a51c30]/15">
          <div className="flex items-center gap-2 text-[#a51c30] font-serif font-bold text-sm tracking-wider uppercase">
            <Clock className="w-4 h-4 text-[#a51c30]" />
            <span>III. Duty Hours & Skipped Lectures</span>
          </div>
          <span className="px-2.5 py-1 rounded bg-[#a51c30]/10 border border-[#a51c30]/20 text-[#a51c30] text-xs font-serif font-bold">
            {selectedLectures.length} {selectedLectures.length === 1 ? 'Lecture' : 'Lectures'} Selected
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
              Select all lecture periods during which you were actively performing assigned ENIGMA event duties.
            </span>
          </div>
        </div>

        {/* Skipped Lecture Grid */}
        <label className="block text-xs font-serif font-bold text-stone-800 mb-2 uppercase tracking-wider">
          Select Skipped Lecture Periods <span className="text-[#a51c30]">*</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
        {errors.selectedLectures && <p className="text-xs text-rose-600 mt-2 font-sans">{errors.selectedLectures}</p>}

        {/* Optional Duty Remarks */}
        <div className="mt-4">
          <label className="block text-xs font-serif font-bold text-stone-800 mb-1 uppercase tracking-wider">
            Duty Remarks / Task Details (Optional)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Stage light setup & main hall sound coordination"
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
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-xl bg-[#a51c30] hover:bg-[#7f1322] border border-[#c59b27]/40 text-white font-serif font-bold text-sm tracking-wider uppercase shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Registering Duty...</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 text-[#f5e6be]" />
              <span>Submit Duty Attendance</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
