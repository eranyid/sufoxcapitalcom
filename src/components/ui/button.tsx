import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-mono uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-[#00FFFF] text-[#000000] hover:bg-[#00FFFF]/80",
        destructive: "bg-[#FF4D4D] text-[#FFFFFF] hover:bg-[#FF4D4D]/80",
        outline: "border border-[#1E1E1E] bg-transparent text-[#D0D0D0] hover:border-[#00FFFF] hover:text-[#00FFFF]",
        secondary: "bg-[#121212] text-[#D0D0D0] border border-[#1E1E1E] hover:text-[#F4D03F] hover:border-[#F4D03F]",
        ghost: "text-[#D0D0D0] hover:bg-[#121212] hover:text-[#F4D03F]",
        link: "text-[#00FFFF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };