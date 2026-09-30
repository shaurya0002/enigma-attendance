import React, { useEffect } from 'react';
import { CheckCircle2, X, Copy, PartyPopper, Database, Sparkles, CloudCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SubmissionModal({ isOpen, onClose, formData, jsonBinResult }) {
  useEffect(() => {
    if (isOpen) {
      // Launch party confetti on open
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#38bdf8']
        });
      } catch (e) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a1128] border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-white overflow-hidden">
        {/* Top glowing ambient border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <CheckCircle2 className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Attendance Logged! <PartyPopper className="w-5 h-5 text-cyan-400" />
            </h3>
            <p className="text-xs text-blue-300/80">
              {isLiveBin 
                ? 'Live Saved to JSONBin.io Backend' 
                : isError 
                  ? 'Local Payload Ready (JSONBin Error)' 
                  : 'Local Preview Payload Generated'}
            </p>
          </div>
        </div>

        {/* JSONBin Sync Status Banners */}
        {isLiveBin && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
            <CloudCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Success! Record saved to your live JSONBin database.</span>
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-2 p-3 mb-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-300 block mb-0.5">JSONBin Notice: {jsonBinResult.error}</span>
              <span className="text-[11px] text-rose-200/80 leading-relaxed block">
                If creating a new Bin on JSONBin.io dashboard, ensure you type <code className="bg-rose-900/50 px-1 py-0.5 rounded font-mono">[]</code> inside the code editor before saving.
              </span>
            </div>
          </div>
        )}

        {!isLiveBin && !isError && (
          <div className="flex items-center gap-2 p-2.5 mb-3 bg-indigo-950/60 border border-indigo-700/40 rounded-xl text-xs text-indigo-300">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>JSONBin API credentials not set yet. Showing JSON preview below.</span>
          </div>
        )}

        {/* Payload Preview Box */}
        <div className="relative mb-5 bg-[#050916] border border-blue-900/60 rounded-xl p-3.5 font-mono text-xs text-cyan-300 overflow-x-auto max-h-60 custom-scrollbar">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-blue-900/40 pb-1.5 mb-2">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" /> Attendance Entry Object
            </span>
            <button 
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" /> Copy JSON
            </button>
          </div>
          <pre>{jsonString}</pre>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Log Another Entry
          </button>
        </div>
      </div>
    </div>
  );
}
