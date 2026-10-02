import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Search, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { listLogs } from '../services/api';

export default function AdminRecordsModal({ isOpen, onClose, onAuthLost }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = useCallback(async () => {
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
  }, [onAuthLost]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    Promise.resolve().then(async () => {
      if (ignore) return;
      await loadLogs();
    });
    return () => {
      ignore = true;
    };
  }, [isOpen, loadLogs]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-[#a51c30]/30 rounded-3xl p-6 shadow-2xl text-stone-900 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top Harvard Crimson Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#a51c30]" />
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 pt-1 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#a51c30] rounded-xl border border-[#c59b27] text-[#f5e6be] flex items-center justify-center font-serif font-bold text-sm shadow-sm">
              TAS
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                Official Attendance Ledger
                <span className="px-2 py-0.5 rounded text-xs bg-[#a51c30]/10 border border-[#a51c30]/20 text-[#a51c30] font-sans font-bold">
                  {logs.length} Entries Recorded
                </span>
              </h3>
              <p className="text-xs text-stone-500 font-serif italic">Harvard University · ENIGMA 2026 Registry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLogs}
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

        {/* Search Bar */}
        <div className="my-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, class batch, or duty team..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#faf9f6] border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#a51c30] font-sans"
          />
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="py-16 text-center text-stone-600 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#a51c30] animate-spin" />
            <span className="text-sm font-serif italic">Fetching ledger data...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 my-auto bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3 font-sans">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch ledger: {error}</p>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Please check JSONBIN configuration.</p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            {filteredLogs.length === 0 ? (
              <div className="py-16 text-center text-stone-500 font-serif italic text-xs">
                {logs.length === 0 ? 'No attendance entries recorded in ledger.' : 'No matching ledger records found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <div 
                    key={log.id || index}
                    className="p-4 rounded-2xl bg-[#faf9f6] border border-stone-200 hover:border-[#a51c30]/50 transition-all text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-stone-900 text-sm">{log.studentDetails?.name || 'N/A'}</span>
                        <span className="font-mono text-[#a51c30] bg-[#a51c30]/10 border border-[#a51c30]/20 px-2 py-0.5 rounded text-[11px] font-bold">
                          {log.studentDetails?.rollNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-600 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-[#a51c30]" />
                        <span>Duty Date: <strong>{log.attendanceLog?.date || 'N/A'}</strong>{log.loggedBy ? ` · Logged by ${log.loggedBy}` : ''}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-stone-700 pt-1">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Standing & Class</span>
                        <span className="font-semibold text-stone-900">{log.studentDetails?.year} ({log.studentDetails?.classBatch})</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Duty Committee</span>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-serif font-bold bg-[#a51c30] text-white border border-[#c59b27]/40">
                          {log.dutyDepartment?.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-serif font-bold block">Skipped Periods</span>
                        <span className="font-bold text-[#a51c30]">
                          {log.attendanceLog?.totalLecturesSkipped} {log.attendanceLog?.totalLecturesSkipped === 1 ? 'Period' : 'Periods'} 
                          ({log.attendanceLog?.skippedLectureNumbers?.map(n => `L${n}`).join(', ')})
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
