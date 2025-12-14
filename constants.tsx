import { Language } from './types';
import React from 'react';

export const LANGUAGES: Language[] = [
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'en-US', name: 'English', nativeName: 'English' },
];

export const APP_COLORS = {
  primary: 'bg-orange-600',
  secondary: 'bg-indigo-900',
  accent: 'text-orange-600',
};

// Icons
export const Icons = {
  // The Interactive Guide "Arya"
  Sage: ({ className, emotion = 'neutral' }: { className?: string, emotion?: 'neutral' | 'happy' | 'thinking' | 'listening' }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Halo/Aura */}
      <circle cx="50" cy="50" r="48" className="stroke-orange-200 dark:stroke-orange-900" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="50" cy="50" r="42" className="fill-stone-100 dark:fill-stone-800" />
      
      {/* Face Base */}
      <path d="M25 50C25 65 35 80 50 80C65 80 75 65 75 50" className="stroke-stone-800 dark:stroke-stone-200" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Eyes */}
      {emotion === 'thinking' ? (
        <>
           <path d="M35 45L45 45" className="stroke-stone-800 dark:stroke-stone-200" strokeWidth="3" strokeLinecap="round"/>
           <path d="M55 45L65 45" className="stroke-stone-800 dark:stroke-stone-200" strokeWidth="3" strokeLinecap="round"/>
        </>
      ) : emotion === 'listening' ? (
        <>
           <circle cx="40" cy="45" r="3" className="fill-orange-500 animate-pulse"/>
           <circle cx="60" cy="45" r="3" className="fill-orange-500 animate-pulse delay-75"/>
        </>
      ) : (
        <>
           <circle cx="40" cy="45" r="3" className="fill-stone-800 dark:fill-stone-200"/>
           <circle cx="60" cy="45" r="3" className="fill-stone-800 dark:fill-stone-200"/>
        </>
      )}

      {/* Mouth */}
      {emotion === 'happy' ? (
          <path d="M40 60Q50 65 60 60" className="stroke-stone-800 dark:stroke-stone-200" strokeWidth="3" strokeLinecap="round"/>
      ) : emotion === 'thinking' ? (
          <circle cx="50" cy="65" r="2" className="fill-stone-800 dark:fill-stone-200"/>
      ) : (
          <path d="M42 62Q50 62 58 62" className="stroke-stone-800 dark:stroke-stone-200" strokeWidth="3" strokeLinecap="round"/>
      )}

      {/* Tika (Forehead mark) */}
      <path d="M50 25V35" className="stroke-red-500" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  Mic: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  ),
  Send: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Volume2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  Share2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  ),
  ChevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  Sparkles: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  ),
};