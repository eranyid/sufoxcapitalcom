import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border px-2 py-0.5 text-xs font-mono uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#00FFFF]",
  {
    variants: {
      variant: {
        default: "border-[#00FFFF] bg-[#00FFFF]/10 text-[#00FFFF]",
        secondary: "border-[#1E1E1E] bg-[#121212] text-[#D0D0D0]",
        destructive: "border-[#FF4D4D] bg-[#FF4D4D]/10 text-[#FF4D4D]",
        success: "border-[#00FF00] bg-[#00FF00]/10 text-[#00FF00]",
        warning: "border-[#F4D03F] bg-[#F4D03F]/10 text-[#F4D03F]",
        outline: "border-[#1E1E1E] text-[#D0D0D0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };