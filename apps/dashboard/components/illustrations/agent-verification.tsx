'use client';

import { useEffect, useState } from 'react';

// Retro-style AI Agent being verified illustration
export function AgentVerificationIllustration() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main SVG Illustration */}
      <svg
        viewBox="0 0 400 350"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Grid Background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e5e5" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="350" fill="url(#grid)" />

        {/* Verification Gateway */}
        <g className={mounted ? 'animate-pop-in' : 'opacity-0'}>
          {/* Gateway Frame */}
          <rect x="140" y="40" width="120" height="180" fill="white" stroke="black" strokeWidth="4" />
          <rect x="144" y="44" width="112" height="172" fill="none" stroke="black" strokeWidth="2" />

          {/* Gateway Header */}
          <rect x="140" y="40" width="120" height="30" fill="black" stroke="black" strokeWidth="4" />
          <text x="200" y="60" textAnchor="middle" fill="white" fontFamily="'Space Mono', monospace" fontSize="12" fontWeight="bold">
            VERIFY
          </text>

          {/* Scanner Lines */}
          <g className={step >= 1 ? 'opacity-100' : 'opacity-30'} style={{ transition: 'opacity 0.3s' }}>
            <line x1="155" y1="100" x2="245" y2="100" stroke="black" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="155" y1="130" x2="245" y2="130" stroke="black" strokeWidth="2" strokeDasharray="4 2" />
            <line x1="155" y1="160" x2="245" y2="160" stroke="black" strokeWidth="2" strokeDasharray="4 2" />
          </g>

          {/* Scanning beam animation */}
          {step === 1 && (
            <rect x="155" y="80" width="90" height="4" fill="black" className="animate-scan">
              <animate attributeName="y" values="80;200;80" dur="1s" repeatCount="indefinite" />
            </rect>
          )}
        </g>

        {/* AI Agent 1 (Entering) */}
        <g
          className={mounted ? 'animate-slide-in-left' : 'opacity-0'}
          style={{
            transform: step >= 1 ? 'translateX(80px)' : 'translateX(0)',
            transition: 'transform 0.8s ease-out'
          }}
        >
          <AgentIcon x={20} y={100} verified={false} />
        </g>

        {/* AI Agent 2 (Inside Gateway - Being Verified) */}
        <g style={{ opacity: step >= 1 && step < 3 ? 1 : 0, transition: 'opacity 0.3s' }}>
          <AgentIcon x={165} y={110} verified={step >= 2} scanning={step === 1} />
        </g>

        {/* AI Agent 3 (Exiting - Verified) */}
        <g
          style={{
            transform: step >= 3 ? 'translateX(0)' : 'translateX(-80px)',
            opacity: step >= 2 ? 1 : 0,
            transition: 'all 0.8s ease-out'
          }}
        >
          <AgentIcon x={280} y={100} verified={true} />
        </g>

        {/* Verified Badge Popup */}
        {step >= 2 && (
          <g className="animate-pop-in">
            <rect x="300" y="60" width="80" height="35" fill="white" stroke="black" strokeWidth="3" />
            <text x="340" y="75" textAnchor="middle" fill="black" fontFamily="'VT323', monospace" fontSize="14">
              VERIFIED
            </text>
            <text x="340" y="90" textAnchor="middle" fill="black" fontFamily="'VT323', monospace" fontSize="18">
              ✓ 100%
            </text>
          </g>
        )}

        {/* Trust Score Display */}
        <g className={mounted ? 'animate-pop-in delay-500' : 'opacity-0'}>
          <rect x="20" y="260" width="100" height="60" fill="white" stroke="black" strokeWidth="3" />
          <text x="70" y="285" textAnchor="middle" fill="black" fontFamily="'Space Mono', monospace" fontSize="10" fontWeight="bold">
            TRUST SCORE
          </text>
          <text x="70" y="310" textAnchor="middle" fill="black" fontFamily="'VT323', monospace" fontSize="24">
            {step >= 2 ? '98' : '--'}
          </text>
        </g>

        {/* Credentials Counter */}
        <g className={mounted ? 'animate-pop-in delay-700' : 'opacity-0'}>
          <rect x="280" y="260" width="100" height="60" fill="white" stroke="black" strokeWidth="3" />
          <text x="330" y="285" textAnchor="middle" fill="black" fontFamily="'Space Mono', monospace" fontSize="10" fontWeight="bold">
            CREDENTIALS
          </text>
          <text x="330" y="310" textAnchor="middle" fill="black" fontFamily="'VT323', monospace" fontSize="24">
            {step >= 3 ? '1' : '0'}
          </text>
        </g>

        {/* Processing Status */}
        <g className={mounted ? 'animate-pop-in delay-300' : 'opacity-0'}>
          <rect x="130" y="250" width="140" height="70" fill="black" stroke="black" strokeWidth="3" />
          <text x="200" y="275" textAnchor="middle" fill="white" fontFamily="'Space Mono', monospace" fontSize="11" fontWeight="bold">
            {step === 0 && 'WAITING...'}
            {step === 1 && 'SCANNING...'}
            {step === 2 && 'VERIFIED!'}
            {step === 3 && 'COMPLETE!'}
          </text>

          {/* Progress Bar */}
          <rect x="145" y="290" width="110" height="12" fill="#333" stroke="white" strokeWidth="1" />
          <rect
            x="147"
            y="292"
            width={step * 26}
            height="8"
            fill="white"
            style={{ transition: 'width 0.5s ease-out' }}
          />
        </g>

        {/* Decorative Elements */}
        <g className={mounted ? 'animate-pop-in delay-200' : 'opacity-0'}>
          {/* Corner brackets */}
          <path d="M 10 10 L 10 30 M 10 10 L 30 10" stroke="black" strokeWidth="3" />
          <path d="M 390 10 L 390 30 M 390 10 L 370 10" stroke="black" strokeWidth="3" />
          <path d="M 10 340 L 10 320 M 10 340 L 30 340" stroke="black" strokeWidth="3" />
          <path d="M 390 340 L 390 320 M 390 340 L 370 340" stroke="black" strokeWidth="3" />
        </g>
      </svg>

      {/* Floating Labels */}
      <div className={`absolute top-4 left-4 bg-white border-2 border-black px-2 py-1 text-xs font-retro uppercase block-shadow-sm ${mounted ? 'animate-pop-in' : 'opacity-0'}`}>
        AI Agent
      </div>
      <div className={`absolute top-4 right-4 bg-black text-white border-2 border-black px-2 py-1 text-xs font-retro uppercase ${mounted ? 'animate-pop-in delay-200' : 'opacity-0'}`}>
        &lt;47ms
      </div>
    </div>
  );
}

// Individual AI Agent Icon Component
function AgentIcon({ x, y, verified = false, scanning = false }: { x: number; y: number; verified?: boolean; scanning?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Robot Body */}
      <rect x="0" y="30" width="70" height="60" fill={verified ? 'white' : 'white'} stroke="black" strokeWidth="3" />

      {/* Robot Head */}
      <rect x="10" y="0" width="50" height="35" fill="white" stroke="black" strokeWidth="3" />

      {/* Antenna */}
      <line x1="35" y1="0" x2="35" y2="-15" stroke="black" strokeWidth="3" />
      <circle cx="35" cy="-20" r="6" fill={scanning ? 'black' : (verified ? 'black' : 'white')} stroke="black" strokeWidth="2">
        {scanning && (
          <animate attributeName="fill" values="black;white;black" dur="0.5s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Eyes */}
      <rect x="18" y="10" width="12" height="12" fill="black" />
      <rect x="40" y="10" width="12" height="12" fill="black" />

      {/* Mouth/Display */}
      <rect x="20" y="25" width="30" height="6" fill="black" />

      {/* Body Pattern */}
      <rect x="10" y="40" width="50" height="4" fill="black" />
      <rect x="10" y="50" width="50" height="4" fill="black" />
      <rect x="10" y="60" width="50" height="4" fill="black" />

      {/* Arms */}
      <rect x="-10" y="40" width="12" height="30" fill="white" stroke="black" strokeWidth="2" />
      <rect x="68" y="40" width="12" height="30" fill="white" stroke="black" strokeWidth="2" />

      {/* Legs */}
      <rect x="10" y="88" width="18" height="20" fill="white" stroke="black" strokeWidth="2" />
      <rect x="42" y="88" width="18" height="20" fill="white" stroke="black" strokeWidth="2" />

      {/* Verified Badge */}
      {verified && (
        <g transform="translate(50, -10)" className="animate-pop-in">
          <circle cx="0" cy="0" r="14" fill="white" stroke="black" strokeWidth="3" />
          <text x="0" y="5" textAnchor="middle" fill="black" fontSize="16" fontWeight="bold">✓</text>
        </g>
      )}
    </g>
  );
}

// Smaller version for cards and sections
export function AgentIconSmall({ verified = false, className = '' }: { verified?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 60 80" className={`w-12 h-16 ${className}`} fill="none">
      {/* Robot Body */}
      <rect x="5" y="25" width="50" height="40" fill="white" stroke="black" strokeWidth="2" />

      {/* Robot Head */}
      <rect x="10" y="0" width="40" height="28" fill="white" stroke="black" strokeWidth="2" />

      {/* Antenna */}
      <line x1="30" y1="0" x2="30" y2="-8" stroke="black" strokeWidth="2" />
      <circle cx="30" cy="-12" r="4" fill={verified ? 'black' : 'white'} stroke="black" strokeWidth="2" />

      {/* Eyes */}
      <rect x="15" y="8" width="8" height="8" fill="black" />
      <rect x="37" y="8" width="8" height="8" fill="black" />

      {/* Body Lines */}
      <rect x="12" y="32" width="36" height="3" fill="black" />
      <rect x="12" y="40" width="36" height="3" fill="black" />
      <rect x="12" y="48" width="36" height="3" fill="black" />

      {/* Legs */}
      <rect x="12" y="64" width="14" height="14" fill="white" stroke="black" strokeWidth="2" />
      <rect x="34" y="64" width="14" height="14" fill="white" stroke="black" strokeWidth="2" />

      {/* Verified Badge */}
      {verified && (
        <g>
          <circle cx="48" cy="8" r="10" fill="white" stroke="black" strokeWidth="2" />
          <text x="48" y="12" textAnchor="middle" fill="black" fontSize="12" fontWeight="bold">✓</text>
        </g>
      )}
    </svg>
  );
}

// Verification Gateway Icon for sections
export function VerificationGatewayIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 70" className={`w-14 h-16 ${className}`} fill="none">
      {/* Gateway Frame */}
      <rect x="5" y="5" width="50" height="60" fill="white" stroke="black" strokeWidth="3" />

      {/* Header */}
      <rect x="5" y="5" width="50" height="15" fill="black" />
      <text x="30" y="16" textAnchor="middle" fill="white" fontFamily="monospace" fontSize="8" fontWeight="bold">
        VERIFY
      </text>

      {/* Scan Lines */}
      <line x1="12" y1="30" x2="48" y2="30" stroke="black" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="12" y1="40" x2="48" y2="40" stroke="black" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="12" y1="50" x2="48" y2="50" stroke="black" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
}

// Credential Card Icon
export function CredentialCardIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 50" className={`w-16 h-12 ${className}`} fill="none">
      {/* Card */}
      <rect x="2" y="2" width="62" height="42" fill="white" stroke="black" strokeWidth="3" />
      <rect x="6" y="6" width="54" height="34" fill="none" stroke="black" strokeWidth="1" />

      {/* Header stripe */}
      <rect x="2" y="2" width="62" height="12" fill="black" />

      {/* ID lines */}
      <rect x="10" y="20" width="30" height="3" fill="black" />
      <rect x="10" y="28" width="20" height="3" fill="black" />

      {/* Checkmark */}
      <circle cx="54" cy="28" r="8" fill="white" stroke="black" strokeWidth="2" />
      <text x="54" y="32" textAnchor="middle" fill="black" fontSize="10" fontWeight="bold">✓</text>
    </svg>
  );
}

// Trust Score Meter
export function TrustScoreMeter({ score = 98, className = '' }: { score?: number; className?: string }) {
  return (
    <svg viewBox="0 0 80 60" className={`w-20 h-14 ${className}`} fill="none">
      {/* Meter background */}
      <rect x="5" y="5" width="70" height="50" fill="white" stroke="black" strokeWidth="3" />

      {/* Label */}
      <text x="40" y="20" textAnchor="middle" fill="black" fontFamily="monospace" fontSize="8" fontWeight="bold">
        TRUST
      </text>

      {/* Score */}
      <text x="40" y="45" textAnchor="middle" fill="black" fontFamily="monospace" fontSize="20" fontWeight="bold">
        {score}%
      </text>
    </svg>
  );
}
