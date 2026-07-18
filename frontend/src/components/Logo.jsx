import React from 'react';

export default function Logo({ width = 46, height = 46, showText = false, textClass = "" }) {
  return (
    <div className="d-inline-flex align-items-center gap-2">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 200" 
        width={width} 
        height={height} 
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="shieldBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f4c81" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9933" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Shield Container Background Card */}
        <rect x="10" y="10" width="180" height="180" rx="40" fill="url(#shieldBg)" stroke="#e2e8f0" strokeWidth="2" filter="drop-shadow(0px 8px 16px rgba(15, 76, 129, 0.1))" />

        {/* Outer Shield Frame (Deep Blue GovTech) */}
        <path d="M 50,50 C 50,50 100,32 100,32 C 100,32 150,50 150,50 C 150,112 100,155 100,155 C 100,155 50,112 50,50 Z" fill="none" stroke="url(#blueGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Elegant Tricolor Swirl / Heritage Arch background */}
        {/* Saffron Arc */}
        <path d="M 65,75 C 80,60 120,60 135,75" fill="none" stroke="url(#saffronGrad)" strokeWidth="8" strokeLinecap="round" />
        {/* White Arc (divider) */}
        <path d="M 70,87 C 82,75 118,75 130,87" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" opacity="0.6" />
        {/* Green Arc */}
        <path d="M 75,99 C 85,90 115,90 125,99" fill="none" stroke="url(#greenGrad)" strokeWidth="8" strokeLinecap="round" />

        {/* Location Pin (Geo-tracking) */}
        <path d="M 100,75 C 112,75 120,83 120,95 C 120,110 100,132 100,132 C 100,132 80,110 80,95 C 80,83 88,75 100,75 Z" fill="url(#blueGrad)" filter="drop-shadow(0px 4px 8px rgba(15, 76, 129, 0.35))" />
        
        {/* Center Checkmark Circle Container & Verification Checkmark */}
        <circle cx="100" cy="95" r="12" fill="#ffffff" />
        <path d="M 94,95 L 98,99 L 107,90" fill="none" stroke="url(#greenGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span className={`fw-extrabold tracking-tight ms-1 ${textClass || 'fs-4 text-gradient-primary'}`}>
          RajCivic <span style={{ color: 'var(--rc-accent)' }}>Connect</span>
        </span>
      )}
    </div>
  );
}
