import React, { useEffect } from 'react';
import { CheckCircle2, X, Copy, Database, CloudCheck, AlertCircle, AlertTriangle, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubmissionModal({ isOpen, onClose, formData, jsonBinResult }) {
  useEffect(() => {
    if (isOpen) {
      // Launch confetti on open
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a51c30', '#c59b27', '#1e1e1e', '#801424']
        });
      } catch {
        console.log('Confetti effect triggered');
      }
    }
  }, [isOpen]);

  if (!isOpen || !formData) return null;

  const jsonString = JSON.stringify(formData, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    alert('Form payload copied to clipboard!');
  };

  const isLiveBin = jsonBinResult && jsonBinResult.success && !jsonBinResult.isMock;
  const isError = jsonBinResult && jsonBinResult.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-[#a51c30]/30 rounded-3xl p-6 shadow-2xl text-stone-900 overflow-hidden">
        {/* Top Crimson accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#a51c30]" />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pt-1">
          <div className="w-12 h-12 rounded-xl bg-[#a51c30] border border-[#c59b27] text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#f5e6be]" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              Attendance Logged!
            </h3>
            <p className="text-xs text-stone-500 font-serif italic">
              {isLiveBin 
                ? 'Official Record Saved to Backend Database' 
                : isError 
                  ? 'Local Record Generated (Backend Warning)' 
                  : 'Official Attendance Entry Registered'}
            </p>
          </div>
        </div>

        {/* JSONBin Sync Status Banners */}
        {isLiveBin && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-sans">
            <CloudCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Attendance successfully verified and appended to live database.</span>
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-2 p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-sans">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-900 block mb-0.5">Database Notice: {jsonBinResult.error}</span>
              <span className="text-[11px] text-rose-700 leading-relaxed block">
                Ensure JSONBin credentials match runtime configuration.
              </span>
            </div>
          </div>
        )}

        {!isLiveBin && !isError && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-[#faf9f6] border border-stone-200 rounded-xl text-xs text-stone-700 font-sans">
            <AlertCircle className="w-4 h-4 text-[#a51c30] flex-shrink-0" />
            <span>Attendance entry compiled. Showing official payload preview.</span>
          </div>
        )}

        {/* Payload Preview Box */}
        <div className="relative mb-5 bg-[#1e1e1e] border border-stone-800 rounded-xl p-3.5 font-mono text-xs text-[#f5e6be] overflow-x-auto max-h-60 custom-scrollbar">
          <div className="flex items-center justify-between text-[10px] text-stone-400 border-b border-stone-700 pb-1.5 mb-2 font-sans">
            <span className="flex items-center gap-1 font-serif">
              <Database className="w-3 h-3 text-[#c59b27]" /> Official Entry Record Object
            </span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[#c59b27] hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copy JSON
            </button>
          </div>
          <pre className="text-stone-200">{jsonString}</pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#a51c30] hover:bg-[#7f1322] border border-[#c59b27]/40 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-[#f5e6be]" /> Log Another Record
          </button>
        </div>
      </div>
    </div>
  );
}
