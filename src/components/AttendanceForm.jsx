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
  Sparkles,
  Info,
  CheckCircle,
  Layers,
  Loader2
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
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedLectures, setSelectedLectures] = useState([1, 2]); // Default lectures 1 & 2 selected
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
      <div className="bg-blue-950/20 border border-indigo-800/30 rounded-2xl p-4 md:p-6 backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-indigo-800/40 text-cyan-400 font-semibold text-sm tracking-wide uppercase">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Student Credentials</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Name Input */}
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider">
              Student Name <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#090716] border ${errors.studentName ? 'border-red-500' : 'border-indigo-900/60 focus:border-cyan-400'} rounded-xl text-white placeholder-indigo-300/30 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all`}
              />
            </div>
            {errors.studentName && <p className="text-xs text-red-400 mt-1">{errors.studentName}</p>}
          </div>

          {/* Roll Number Input */}
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider">
              University Roll Number <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. 2100520100089"
                className={`w-full pl-10 pr-4 py-2.5 bg-[#090716] border ${errors.rollNumber ? 'border-red-500' : 'border-indigo-900/60 focus:border-cyan-400'} rounded-xl text-white placeholder-indigo-300/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all`}
              />
            </div>
            {errors.rollNumber && <p className="text-xs text-red-400 mt-1">{errors.rollNumber}</p>}
          </div>
        </div>

        {/* SECTION 2: Year and Custom Class Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Year Picker */}
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Academic Year
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACADEMIC_YEARS.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setYear(y)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    year === y
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-[#090716] text-indigo-300 border-indigo-900/60 hover:border-indigo-600 hover:text-white'
                  }`}
                >
                  {y.replace(' Year', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Class / Batch Text Input */}
          <div>
            <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Class / Batch <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-400">
                <Layers className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="e.g. B1, B2, C3, CS-A"
                className={`w-full pl-10 pr-4 py-2 bg-[#090716] border ${errors.studentClass ? 'border-red-500' : 'border-indigo-900/60 focus:border-cyan-400'} rounded-xl text-white placeholder-indigo-300/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all`}
              />
            </div>
            {errors.studentClass && <p className="text-xs text-red-400 mt-1">{errors.studentClass}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 3: Department / Event Team (Scrollable Category Box) */}
      <div className="bg-blue-950/20 border border-indigo-800/30 rounded-2xl p-4 md:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-indigo-800/40">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm tracking-wide uppercase">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Department / Event Team</span>
          </div>
          <span className="text-[11px] text-indigo-400/80 font-mono">Scroll to view all teams</span>
        </div>

        <p className="text-xs text-indigo-300/70 mb-3">
          Select the event duty team you are assigned to for ENIGMA 2026.
        </p>

        {/* SCROLLABLE TEAM SELECTION CONTAINER */}
        <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar rounded-xl">
          {EVENT_TEAMS.map((team) => {
            const isSelected = selectedTeam === team.id;
            return (
              <div
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-900/80 to-purple-950/80 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/30'
                    : 'bg-[#090716]/80 border-indigo-900/50 hover:border-indigo-600/70 hover:bg-[#0f0b24]'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-indigo-600 bg-transparent'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-indigo-100'}`}>
                      {team.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-900/50 border border-indigo-700/40 text-cyan-300">
                      {team.badge}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300/70 mt-0.5 leading-snug">
                    {team.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {errors.selectedTeam && <p className="text-xs text-red-400 mt-2">{errors.selectedTeam}</p>}
      </div>

      {/* SECTION 4: Lecture Number with Date (Skipped Class Tracker) */}
      <div className="bg-blue-950/20 border border-indigo-800/30 rounded-2xl p-4 md:p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-800/40">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm tracking-wide uppercase">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Lecture Number with Date</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            {selectedLectures.length} {selectedLectures.length === 1 ? 'Lecture' : 'Lectures'} Selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Date Selector */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-blue-200 mb-1.5 uppercase tracking-wider flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" /> Duty Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#090716] border border-indigo-900/60 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Quick Info hint */}
          <div className="md:col-span-2 flex items-center gap-2 p-3 bg-indigo-950/40 border border-indigo-800/30 rounded-xl text-xs text-indigo-200">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Tap the lecture numbers below that were skipped during your ENIGMA event duty hours on this date.
            </span>
          </div>
        </div>

        {/* Skipped Lecture Grid */}
        <label className="block text-xs font-semibold text-blue-200 mb-2 uppercase tracking-wider">
          Select Skipped Lecture Numbers <span className="text-cyan-400">*</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {STANDARD_LECTURES.map((lect) => {
            const isSelected = selectedLectures.includes(lect.id);
            return (
              <button
                type="button"
                key={lect.id}
                onClick={() => toggleLecture(lect.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-indigo-700 to-cyan-600 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[#090716] border-indigo-900/60 text-indigo-300 hover:border-indigo-600 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">{lect.label}</span>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-cyan-200 stroke-[2.5]" />
                  )}
                </div>
                <span className={`text-[10px] font-mono block ${isSelected ? 'text-cyan-100' : 'text-indigo-400/70'}`}>
                  {lect.time}
                </span>
              </button>
            );
          })}
        </div>
        {errors.selectedLectures && <p className="text-xs text-red-400 mt-2">{errors.selectedLectures}</p>}

        {/* Optional Duty Remarks */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-blue-200 mb-1 uppercase tracking-wider">
            Duty Remarks / Reason (Optional)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="e.g. Stage light rehearsal & sound check for main event"
            className="w-full px-3.5 py-2 bg-[#090716] border border-indigo-900/60 rounded-xl text-white placeholder-indigo-300/30 text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {submitError && (
        <p className="text-xs text-red-400 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3">{submitError}</p>
      )}

      {/* FORM ACTION BUTTONS */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-4 py-3 rounded-xl border border-indigo-900/60 bg-[#090716] hover:bg-indigo-900/40 text-indigo-300 hover:text-white font-semibold text-xs tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Form
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-cyan-500 to-violet-600 hover:from-indigo-500 hover:via-cyan-400 hover:to-violet-500 text-white font-bold text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 text-white animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Submit Attendance Request</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

    </form>
  );
}
