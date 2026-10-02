import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  RefreshCw, 
  Search, 
  Calendar, 
  AlertCircle, 
  Loader2, 
  Award, 
  Clock, 
  CheckCircle,
  Phone,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { listLogs, listAttendanceCounts, listStudents } from '../services/api';
import { EVENT_TEAMS } from '../config/teams';
import { filterRoster } from '../data/studentsData';

export default function AdminRecordsModal({ isOpen, onClose, onAuthLost, currentAdmin }) {
  const isMaster = !currentAdmin || currentAdmin.department === 'all' || currentAdmin.role === 'master_admin' || currentAdmin.role === 'super_admin';
  const defaultDept = !isMaster && currentAdmin?.department ? currentAdmin.department : 'all';

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'all_logs'
  const [masterSelectedDept, setMasterSelectedDept] = useState(defaultDept);
  const selectedDept = isMaster ? masterSelectedDept : (currentAdmin?.department || defaultDept);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});

  const [logs, setLogs] = useState([]);
  const [counts, setCounts] = useState(() =>
    filterRoster({ department: defaultDept, search: '' }).map((s) => ({
      rollNumber: s.rollNumber,
      name: s.name,
      contact: s.contact,
      department: s.department,
      year: s.year,
      classBatch: s.classBatch,
      totalDaysAttended: 0,
      totalLecturesSkipped: 0,
      dutyDates: [],
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleStudentExpanded = (roll) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [roll]: !prev[roll],
    }));
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const activeDept = !isMaster && currentAdmin?.department ? currentAdmin.department : selectedDept;

    const params = {
      department: activeDept !== 'all' ? activeDept : '',
      search: searchTerm.trim(),
    };

    try {
      const [logsRes, countsRes, studentsRes] = await Promise.all([
        listLogs(params),
        listAttendanceCounts(params),
        listStudents(params),
      ]);

      setLoading(false);

      if (logsRes.status === 401 || countsRes.status === 401 || studentsRes.status === 401) {
        return onAuthLost?.();
      }

      const receivedLogs = logsRes.ok && Array.isArray(logsRes.data?.logs) ? logsRes.data.logs : [];
      setLogs(receivedLogs);

      const rosterList = filterRoster({ department: activeDept, search: searchTerm.trim() });
      if (studentsRes?.ok && Array.isArray(studentsRes.data?.students)) {
        studentsRes.data.students.forEach((stu) => {
          if (!rosterList.some((r) => r.rollNumber === stu.rollNumber && r.department === stu.department)) {
            rosterList.push(stu);
          }
        });
      }

      const countsMap = new Map();
      if (countsRes.ok && Array.isArray(countsRes.data?.counts)) {
        countsRes.data.counts.forEach((c) => countsMap.set(c.rollNumber, c));
      }

      // Combine roster with live counts
      const combined = rosterList.map((s) => {
        const recorded = countsMap.get(s.rollNumber);
        if (recorded) return recorded;
        return {
          rollNumber: s.rollNumber,
          name: s.name,
          contact: s.contact,
          department: s.department,
          year: s.year,
          classBatch: s.classBatch,
          totalDaysAttended: 0,
          totalLecturesSkipped: 0,
          dutyDates: [],
        };
      });

      // Also append any recorded students not in roster
      countsMap.forEach((val, key) => {
        if (!rosterList.some((r) => r.rollNumber === key)) {
          combined.push(val);
        }
      });

      setCounts(combined);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to query records');
    }
  }, [isMaster, currentAdmin, selectedDept, searchTerm, onAuthLost]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    Promise.resolve().then(async () => {
      if (ignore) return;
      await loadData();
    });
    return () => {
      ignore = true;
    };
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-[#a51c30]/30 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Crimson Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#a51c30]" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 pt-1 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#a51c30] rounded-xl border border-[#c59b27] text-[#f5e6be] flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              EN
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                Official Attendance Ledger
                <span className="px-2 py-0.5 rounded text-xs bg-[#a51c30]/10 border border-[#a51c30]/20 text-[#a51c30] font-sans font-bold">
                  {counts.length} Students · {logs.length} Total Logs
                </span>
              </h3>
              <p className="text-xs text-stone-500 font-serif italic">Official Registry · ENIGMA 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#faf9f6] border border-stone-300 text-stone-700 hover:text-[#a51c30] hover:border-[#a51c30] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Ledger"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Department Filtration Controls */}
        <div className="pt-3 pb-2 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* View Selector */}
            <div className="flex items-center gap-2 bg-[#faf9f6] p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'summary'
                    ? 'bg-[#a51c30] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-[#f5e6be]" />
                <span>Student Summary & Days Log</span>
              </button>

              <button
                onClick={() => setActiveTab('all_logs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all_logs'
                    ? 'bg-[#a51c30] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Chronological Log Stream</span>
              </button>
            </div>

            {/* Department Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-serif font-bold text-stone-500 uppercase tracking-wider">Department:</span>
              {!isMaster ? (
                <div className="px-3 py-1.5 rounded-xl bg-[#a51c30]/10 border border-[#a51c30]/25 text-[#a51c30] text-xs font-serif font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{currentAdmin?.departmentName || currentAdmin?.department} (Locked)</span>
                </div>
              ) : (
                <select
                  value={masterSelectedDept}
                  onChange={(e) => setMasterSelectedDept(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#faf9f6] border border-stone-300 text-stone-800 text-xs font-serif font-bold focus:outline-none focus:border-[#a51c30] cursor-pointer"
                >
                  <option value="all">All Departments ({EVENT_TEAMS.length})</option>
                  {EVENT_TEAMS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Search Bar matching Name, Roll Number, or Contact */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student identity: Name, Contact number, or University Roll Number..."
              className="w-full pl-10 pr-4 py-2 bg-[#faf9f6] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#a51c30] font-sans"
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center text-stone-600 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#a51c30] animate-spin" />
            <span className="text-sm font-serif italic">Loading ledger records from database...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 my-auto bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3 font-sans">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch records: {error}</p>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Please check connection or try refreshing.</p>
            </div>
          </div>
        )}

        {/* VIEW 1: STUDENT SUMMARY & ALL-DAYS LOG */}
        {!loading && !error && activeTab === 'summary' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-2">
            {counts.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-serif italic text-xs">
                No student attendance records found matching this department or query.
              </div>
            ) : (
              <div className="space-y-3.5">
                {counts.map((student, idx) => {
                  const roll = student.rollNumber;
                  const isExpanded = !!expandedStudents[roll];
                  const studentLogs = logs.filter(
                    (l) => l.studentDetails?.rollNumber === roll
                  );

                  const totalDays = student.totalDaysAttended || (student.dutyDates ? student.dutyDates.length : 0);
                  const totalLectures = student.totalLecturesSkipped || 0;
                  // Standard academic schedule typically has 8 periods per day
                  const maxExpectedPeriods = totalDays * 8;
                  const classesRemainingAttended = Math.max(0, maxExpectedPeriods - totalLectures);

                  return (
                    <div
                      key={student._id || roll || idx}
                      className="p-4 rounded-2xl bg-[#faf9f6] border border-stone-200 hover:border-[#a51c30]/50 transition-all text-xs"
                    >
                      {/* Student Identity Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-stone-900 text-base">
                            {student.name}
                          </span>
                          <span className="font-mono text-[#a51c30] bg-[#a51c30]/10 border border-[#a51c30]/20 px-2 py-0.5 rounded text-[11px] font-bold">
                            {roll}
                          </span>
                          {student.contact && (
                            <span className="font-mono text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {student.contact}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-[#a51c30] text-white uppercase">
                            {student.department}
                          </span>
                        </div>

                        {/* Expand / Collapse All-Days Breakdown Button */}
                        <button
                          type="button"
                          onClick={() => toggleStudentExpanded(roll)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-stone-300 text-stone-700 hover:text-[#a51c30] hover:border-[#a51c30] text-xs font-serif font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Days Log' : `View All Days Log (${studentLogs.length})`}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Summary Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] font-serif font-bold text-stone-500 uppercase block">Total Duty Days</span>
                          <span className="text-sm font-serif font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            {totalDays} {totalDays === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] font-serif font-bold text-stone-500 uppercase block">Total Lectures Added</span>
                          <span className="text-sm font-serif font-bold text-[#a51c30] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {totalLectures} Periods
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] font-serif font-bold text-stone-500 uppercase block">Regular Classes Attended</span>
                          <span className="text-sm font-serif font-bold text-stone-800">
                            ~{classesRemainingAttended} Classes
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                          <span className="text-[10px] font-serif font-bold text-stone-500 uppercase block">Dates of Duty</span>
                          <span className="text-[11px] font-mono text-stone-600 truncate block" title={student.dutyDates?.join(', ')}>
                            {student.dutyDates && student.dutyDates.length > 0 ? student.dutyDates.join(', ') : 'None logged'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Breakdown: Log of all the days */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-stone-200 animate-fadeIn">
                          <h5 className="font-serif font-bold text-stone-900 text-xs mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-[#a51c30]" />
                            Day-by-Day Duty Attendance History
                          </h5>

                          {studentLogs.length === 0 ? (
                            <p className="text-xs text-stone-500 font-serif italic py-2">
                              No granular daily records found for this student.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {studentLogs.map((item, logIdx) => (
                                <div
                                  key={item.id || item._id || logIdx}
                                  className="p-3 rounded-xl bg-white border border-stone-200 flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-stone-900 font-serif">
                                        Date: {item.attendanceLog?.date}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                                        {item.attendanceLog?.totalLecturesSkipped} Lectures Missed/Credited
                                      </span>
                                      {item.attendanceLog?.extraAttendance > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                          +{item.attendanceLog?.extraAttendance} Extra
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-stone-600 font-sans mt-0.5">
                                      Periods: {item.attendanceLog?.skippedLectureNumbers?.map((n) => `L${n}`).join(', ') || 'N/A'}
                                      {item.attendanceLog?.remarks ? ` · Note: "${item.attendanceLog.remarks}"` : ''}
                                    </div>
                                  </div>

                                  <span className="text-[10px] text-stone-400 font-serif">
                                    Logged by: <strong>{item.loggedBy || 'admin'}</strong>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: MASTER CHRONOLOGICAL LOG STREAM */}
        {!loading && !error && activeTab === 'all_logs' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mt-2">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-serif italic text-xs">
                No attendance logs found matching this department or query.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div 
                    key={log.id || log._id || index}
                    className="p-4 rounded-2xl bg-[#faf9f6] border border-stone-200 hover:border-[#a51c30]/50 transition-all text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-stone-900 text-sm">{log.studentDetails?.name || 'N/A'}</span>
                        <span className="font-mono text-[#a51c30] bg-[#a51c30]/10 border border-[#a51c30]/20 px-2 py-0.5 rounded text-[11px] font-bold">
                          {log.studentDetails?.rollNumber || 'N/A'}
                        </span>
                        {log.studentDetails?.contact && (
                          <span className="font-mono text-stone-600 bg-white border border-stone-200 px-1.5 py-0.5 rounded text-[10.5px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            {log.studentDetails?.contact}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-600 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-[#a51c30]" />
                        <span>Duty Date: <strong>{log.attendanceLog?.date || 'N/A'}</strong>{log.loggedBy ? ` · Logged by ${log.loggedBy}` : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-stone-700 pt-1">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Standing & Class</span>
                        <span className="font-semibold text-stone-900">{log.studentDetails?.year} ({log.studentDetails?.classBatch || 'General'})</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Duty Committee</span>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-[#a51c30] text-white border border-[#c59b27]/40">
                          {log.dutyDepartment?.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Total Lectures Missed</span>
                        <span className="font-bold text-[#a51c30]">
                          {log.attendanceLog?.totalLecturesSkipped} {log.attendanceLog?.totalLecturesSkipped === 1 ? 'Period' : 'Periods'}
                          {log.attendanceLog?.extraAttendance > 0 ? ` (+${log.attendanceLog.extraAttendance} Extra)` : ''}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Remarks</span>
                        <span className="text-stone-600 truncate block font-sans">{log.attendanceLog?.remarks || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
