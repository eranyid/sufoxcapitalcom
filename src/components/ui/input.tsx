import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full border border-[#1E1E1E] bg-[#121212] px-3 py-2 text-sm text-[#FFFFFF] font-mono ring-offset-[#000000] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#FFFFFF] placeholder:text-[#D0D0D0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00FFFF] focus-visible:border-[#00FFFF] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };