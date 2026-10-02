import React from 'react';

export default function EventHeader() {
  return (
    <div className="text-center mb-8 relative">
      {/* Harvard Shield & Veritas Crest emblem */}
      <div className="flex justify-center mb-3">
        <div className="inline-flex flex-col items-center">
          {/* Harvard Crimson Shield Icon */}
          <div className="w-14 h-16 bg-[#a51c30] rounded-b-xl border-2 border-[#c59b27] flex flex-col items-center justify-center text-white shadow-md relative group">
            <span className="text-[9px] font-serif font-bold tracking-widest leading-none text-[#f5e6be]">VE</span>
            <span className="text-[9px] font-serif font-bold tracking-widest leading-none text-[#f5e6be] my-0.5">RI</span>
            <span className="text-[9px] font-serif font-bold tracking-widest leading-none text-[#f5e6be]">TAS</span>
          </div>
        </div>
      </div>

      {/* University Sub-header */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#a51c30]/10 border border-[#a51c30]/20 text-[#a51c30] text-[11px] font-serif font-bold uppercase tracking-widest mb-2">
        <span>Harvard University Official Registry</span>
      </div>

      {/* Main Title: ENIGMA 2026 */}
      <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight text-[#1e1e1e] mb-2">
        ENIGMA 2026
      </h1>

      <p className="text-[#a51c30] font-serif italic text-sm md:text-base tracking-wide flex items-center justify-center gap-2 mb-5">
        <span>Student Duty & Attendance Portal</span>
      </p>

      {/* Decorative Gold Rule */}
      <div className="flex items-center justify-center gap-3 mb-6 max-w-sm mx-auto">
        <div className="h-px flex-1 bg-[#c59b27]/40" />
        <span className="text-[#c59b27] text-xs font-serif">❖</span>
        <div className="h-px flex-1 bg-[#c59b27]/40" />
      </div>

      {/* Academic Notice Box */}
      <div className="max-w-xl mx-auto p-4 rounded-xl bg-[#faf9f6] border border-[#a51c30]/20 text-left text-xs md:text-sm text-[#2d3748] leading-relaxed shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#a51c30]" />
        
        <div className="flex items-center justify-between mb-2 border-b border-[#a51c30]/15 pb-1.5">
          <span className="text-[#a51c30] font-serif font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a51c30] inline-block" />
            Official Academic Notice
          </span>
          <span className="text-[10px] text-stone-500 font-serif font-semibold uppercase">Harvard Academic Affairs</span>
        </div>

        <p className="text-stone-700 font-sans text-xs md:text-sm">
          Welcome to <strong className="text-[#a51c30]">ENIGMA 2026</strong>. All appointed student duty officers across technical, administrative, and management committees are required to log their official duty hours and skipped lectures for verified academic attendance credit.
        </p>
      </div>
    </div>
  );
}
