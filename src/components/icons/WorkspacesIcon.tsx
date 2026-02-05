 import React from 'react';
 
 interface WorkspacesIconProps {
   className?: string;
   size?: number;
 }
 
 export function WorkspacesIcon({ className, size = 24 }: WorkspacesIconProps) {
   return (
     <svg 
       width={size} 
       height={size} 
       viewBox="0 0 24 24" 
       fill="none" 
       xmlns="http://www.w3.org/2000/svg"
       className={className}
       stroke="currentColor"
       strokeWidth="1.5"
     >
       <path d="M22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M22 6V2H18" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M17 7L22 2" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M11 8L8 11L11 14" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M13 8L16 11L13 14" strokeLinecap="round" strokeLinejoin="round"/>
     </svg>
   );
 }