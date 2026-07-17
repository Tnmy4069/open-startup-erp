'use client';

import React from 'react';

interface PreloaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Preloader({ message = 'Loading System Coordinates...', size = 'md' }: PreloaderProps) {
  const spinnerSizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-14 h-14 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 font-mono text-center w-full">
      {/* Cyber theme loading animation */}
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className={`absolute rounded-full border border-primary/20 animate-ping opacity-75 ${
          size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-14 h-14' : 'w-20 h-20'
        }`} />
        
        {/* Main rotating segmented spinner */}
        <div className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-primary/10 border-l-transparent ${spinnerSizes[size]}`} />
        
        {/* Center glowing dot */}
        <div className="absolute w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(255,213,74,0.8)]" />
      </div>
      
      {message && (
        <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-widest animate-pulse font-semibold">
          {`// ${message}`}
        </p>
      )}
    </div>
  );
}
