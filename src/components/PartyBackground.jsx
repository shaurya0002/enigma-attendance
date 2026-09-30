import React from 'react';

export default function PartyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#090712]">
      {/* Soft Dark Sunset Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #1e0f38 0%, #0d081b 50%, #07050d 100%)'
        }}
      />

      {/* Minimal Sunset Party Glowing Ambient Light Orbs */}
      {/* Top right sunset rose glow */}
      <div className="absolute -top-32 -right-32 w-[550px] h-[550px] bg-rose-600/15 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Bottom center warm amber horizon glow */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-600/10 rounded-full blur-[170px] pointer-events-none" />
      
      {/* Left deep indigo party atmosphere */}
      <div className="absolute top-1/2 -left-32 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[160px] pointer-events-none" />

      {/* Minimal subtle top dusk border accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
    </div>
  );
}
