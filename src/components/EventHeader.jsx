import React from 'react';
import { Sparkles, Calendar, PartyPopper, Flame } from 'lucide-react';

export default function EventHeader() {
  return (
    <div className="text-center mb-8 relative">
      {/* Top Fest Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-950/60 border border-purple-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.15)] mb-3 backdrop-blur-md">
        <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Official College Fest 2026</span>
        <Flame className="w-3.5 h-3.5 text-amber-400" />
      </div>

      {/* Main Title: ENIGMA 2026 */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-2">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-indigo-300 to-cyan-300 drop-shadow-[0_0_25px_rgba(244,63,94,0.4)]">
          ENIGMA 2026
        </span>
      </h1>

      <p className="text-indigo-200/80 font-medium text-sm md:text-base tracking-wide flex items-center justify-center gap-2 mb-4">
        <PartyPopper className="w-4 h-4 text-rose-400 inline" />
        Student Duty Attendance Logger
        <Calendar className="w-4 h-4 text-cyan-400 inline" />
      </p>

      {/* 
        ========================================================================
        BOILERPLATE: EVENT DETAILS & PARAGRAPH SECTION
        ========================================================================
        You can raw-code your own paragraph details or announcements here!
        Simply edit or expand the text inside the <p> tags below.
        ========================================================================
      */}
      <div className="max-w-xl mx-auto p-4 rounded-xl bg-indigo-950/30 border border-indigo-700/30 backdrop-blur-md text-left text-xs md:text-sm text-indigo-100/90 leading-relaxed shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 via-purple-500 to-cyan-400" />
        
        <div className="flex items-center justify-between mb-1.5 border-b border-indigo-800/30 pb-1">
          <span className="text-cyan-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            Notice / Event Info
          </span>
          <span className="text-[10px] text-indigo-400/60 font-mono">[Editable Paragraph Boilerplate]</span>
        </div>

        {/* --- EDIT YOUR PARAGRAPH TEXT HERE --- */}
        <p className="mt-1 text-indigo-100/80">
          Welcome to <span className="text-cyan-300 font-semibold">ENIGMA 2026</span>! All organizing team members (Tech, Management, Decoration, etc.) are requested to log their daily skipped lectures during duty hours. Ensure your roll number and class/batch details (e.g. B1, B2) are accurate for official verification.
        </p>
        {/* --- END OF EDITABLE PARAGRAPH --- */}

      </div>
    </div>
  );
}
