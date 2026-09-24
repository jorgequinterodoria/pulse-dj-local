import React from "react";

interface PulseLogoProps {
  className?: string;
  size?: number;
}

export const PulseLogo: React.FC<PulseLogoProps> = ({ className = "", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="44" stroke="#00E676" strokeWidth="6" />
      <circle cx="50" cy="30" r="4.5" fill="#00E676" />
      <circle cx="37" cy="36" r="4" fill="#00E676" />
      <circle cx="63" cy="36" r="4" fill="#00E676" />
      <rect x="47.5" y="40" width="5" height="32" rx="2.5" fill="#00E676" />
      <rect x="35" y="44" width="5" height="24" rx="2.5" fill="#00E676" />
      <rect x="60" y="44" width="5" height="24" rx="2.5" fill="#00E676" />
      <rect x="23" y="48" width="4.5" height="15" rx="2.25" fill="#00E676" />
      <rect x="72.5" y="48" width="4.5" height="15" rx="2.25" fill="#00E676" />
    </svg>
  );
};