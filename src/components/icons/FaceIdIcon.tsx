import * as React from 'react';

interface FaceIdIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const FaceIdIcon: React.FC<FaceIdIconProps> = ({ 
  size = 24, 
  className,
  ...props 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top left corner */}
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      {/* Top right corner */}
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      {/* Bottom right corner */}
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      {/* Bottom left corner */}
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      
      {/* Left eye */}
      <path d="M9 9v2" />
      {/* Right eye */}
      <path d="M15 9v2" />
      
      {/* Nose */}
      <path d="M12 9v3" />
      
      {/* Smile */}
      <path d="M9 15c.5.5 1.5 1 3 1s2.5-.5 3-1" />
    </svg>
  );
};
