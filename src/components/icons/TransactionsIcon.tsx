import { SVGProps } from 'react';

export function TransactionsIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      height={size}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      {...props}
    >
      <g opacity="0.4">
        <path 
          d="M20.5002 14.9902L15.4902 20.0102" 
          strokeWidth="1.5" 
          strokeMiterlimit="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M3.5 14.9902H20.5" 
          strokeWidth="1.5" 
          strokeMiterlimit="10" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>
      <path 
        d="M3.5 9.01023L8.51 3.99023" 
        strokeWidth="1.5" 
        strokeMiterlimit="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M20.5 9.00977H3.5" 
        strokeWidth="1.5" 
        strokeMiterlimit="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
