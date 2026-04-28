

export default function WalleyeIcon({ size = 24, color = 'currentColor', className = '' }: { size?: number, color?: string, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Body */}
      <path d="M 4 12 C 6 7.5, 16 7.5, 22 12 C 17 16, 7 15.5, 4 12 Z" />
      {/* Tail (Forked) */}
      <path d="M 4 12 L 1 8 C 2.5 10, 2.5 14, 1 16 L 4 12 Z" />
      {/* Spiny Dorsal Fin (Classic Walleye trait) */}
      <path d="M 8 7.8 L 8.5 3 L 9.5 6.5 L 10.5 3.5 L 11.5 6.5 L 12.5 4 L 13.5 8" />
      {/* Soft Dorsal Fin */}
      <path d="M 15 9 C 16 6, 17 7, 18 10" />
      {/* Anal Fin */}
      <path d="M 14 14.8 L 15 18 L 16 14.5" />
      {/* Pectoral Fin */}
      <path d="M 11 13.5 L 9 17 L 10 14" />
      {/* Gill slit */}
      <path d="M 17 10.5 C 16.5 11.5, 16.5 13, 17 14" />
      {/* Eye */}
      <circle cx="19" cy="10.5" r="0.8" fill={color} />
      {/* Sharp Walleye Jaw */}
      <path d="M 22 12 L 18 12.5" />
    </svg>
  );
}
