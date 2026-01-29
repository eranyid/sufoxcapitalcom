import { SVGProps } from 'react';

export function ConstructionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Target/compass center */}
      <circle cx="12" cy="12" r="2" />
      {/* Inner ring */}
      <circle cx="12" cy="12" r="6" />
      {/* Outer ring */}
      <circle cx="12" cy="12" r="10" />
      {/* Cross hairs */}
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}
