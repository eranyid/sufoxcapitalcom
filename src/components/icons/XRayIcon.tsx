import { SVGProps } from 'react';

export function XRayIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
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
      <path 
        d="M14.2194 9.78L11.9994 10.89M11.9994 10.89L9.77937 9.78M11.9994 10.89V13.67M14.2194 3.11L11.9994 2L9.77937 3.11M5.32938 18.67L3.10938 17.56V14.78M18.6694 18.67L20.8894 17.56V14.78" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <g opacity="0.4">
        <path 
          d="M20.8899 6.90967L18.6699 8.01967" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M20.8899 6.90981L18.6699 5.7998" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M20.8906 6.90967V9.68967" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M3.10938 6.90981L5.32938 5.7998" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M3.10938 6.90967L5.32938 8.01967" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M3.10938 6.90967V9.68967" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M11.9993 22.4699L9.7793 21.3599" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M12 22.4699L14.22 21.3599" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M12 22.4699V19.6899" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
