import React from 'react';

export default function PartyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#faf9f6]">
      {/* Subtle Harvard Crimson Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#a51c30]" />
      
      {/* Gold Sub-bar */}
      <div className="absolute top-2 left-0 right-0 h-[2px] bg-[#c59b27]/60" />

      {/* Subtle Academic Watermark / Radial Background Glows */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(165, 28, 48, 0.05) 0%, transparent 60%),
                            radial-gradient(circle at 80% 80%, rgba(197, 155, 39, 0.04) 0%, transparent 50%)`
        }}
      />

      {/* Decorative Architectural Line Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#1e1e1e 1px, transparent 1px), linear-gradient(90deg, #1e1e1e 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Large Subtle Harvard Crimson Shield Watermark Background */}
      <div className="absolute -bottom-24 -right-24 opacity-[0.03] text-[#a51c30] select-none pointer-events-none">
        <svg width="600" height="700" viewBox="0 0 100 120" fill="currentColor">
          <path d="M50 0 L95 20 L95 70 C95 100 50 120 50 120 C50 120 5 100 5 70 L5 20 Z" />
        </svg>
      </div>

      {/* Subtle Crimson Ambient Glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-[#a51c30]/5 rounded-full blur-[140px] pointer-events-none" />
    </div>
  );
}
