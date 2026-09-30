import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Search, Database, Layers, Clock, Calendar, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { listLogs } from '../services/api';

export default function AdminRecordsModal({ isOpen, onClose, onAuthLost }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    const res = await listLogs();
    setLoading(false);

    if (res.status === 401) return onAuthLost?.();
    if (res.ok) {
      setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
    } else {
      setError(res.data?.error || 'Failed to load records');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const name = log.studentDetails?.name?.toLowerCase() || '';
    const roll = log.studentDetails?.rollNumber?.toLowerCase() || '';
    const team = log.dutyDepartment?.name?.toLowerCase() || '';
    const cls = log.studentDetails?.classBatch?.toLowerCase() || '';
    return name.includes(term) || roll.includes(term) || team.includes(term) || cls.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0a0718] border border-indigo-500/40 rounded-3xl p-6 shadow-[0_0_60px_rgba(30,15,56,0.8)] text-white max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top ambient glowing accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-rose-400 to-cyan-400" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-900/50 border border-indigo-700/40 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Live Attendance Records
                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-950 border border-cyan-500/30 text-cyan-300 font-mono">
                  {logs.length} Logged
                </span>
              </h3>
              <p className="text-xs text-indigo-300/70">Synced from secure backend</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="p-2 rounded-xl bg-indigo-950 border border-indigo-800/60 text-indigo-300 hover:text-white hover:bg-indigo-900/50 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-900/40 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, class, or duty team..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0e0924] border border-indigo-800/50 rounded-xl text-white placeholder-indigo-300/40 text-xs focus:outline-none focus:border-cyan-400 font-mono"
          />
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center text-indigo-300 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium">Fetching records...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 my-auto bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch records: {error}</p>
              <p className="text-[11px] text-rose-300/70 mt-0.5">Check the JSONBIN_* environment variables in Netlify.</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-indigo-300/60 text-xs">
                {logs.length === 0 ? 'No attendance entries recorded yet.' : 'No matching records found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <div 
                    key={log.id || index}
                    className="p-4 rounded-2xl bg-[#0e0924] border border-indigo-900/50 hover:border-indigo-700/60 transition-all text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-900/40">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{log.studentDetails?.name || 'N/A'}</span>
                        <span className="font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md text-[11px]">
                          {log.studentDetails?.rollNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-indigo-300/70 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        <span>Duty Date: {log.attendanceLog?.date || 'N/A'}{log.loggedBy ? ` · by ${log.loggedBy}` : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-indigo-200/90 pt-1">
                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Year & Class</span>
                        <span className="font-semibold text-white">{log.studentDetails?.year} ({log.studentDetails?.classBatch})</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Duty Team</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-900/60 border border-indigo-700/40 text-cyan-300">
                          {log.dutyDepartment?.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Skipped Lectures</span>
                        <span className="font-bold text-cyan-300">
                          {log.attendanceLog?.totalLecturesSkipped} {log.attendanceLog?.totalLecturesSkipped === 1 ? 'Lecture' : 'Lectures'} 
                          ({log.attendanceLog?.skippedLectureNumbers?.map(n => `L${n}`).join(', ')})
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-semibold block">Remarks</span>
                        <span className="text-indigo-300/80 truncate block">{log.attendanceLog?.remarks || '-'}</span>
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
