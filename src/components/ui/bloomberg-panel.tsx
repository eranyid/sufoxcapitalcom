import * as React from "react";
import { cn } from "@/lib/utils";

interface BloombergPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  titleIcon?: React.ReactNode;
  actions?: React.ReactNode;
  contentClassName?: string;
  headerClassName?: string;
}

const BloombergPanel = React.forwardRef<HTMLDivElement, BloombergPanelProps>(
  ({ className, title, titleIcon, actions, children, contentClassName, headerClassName, ...props }, ref) => (
    <div ref={ref} className={cn("bloomberg-panel", className)} {...props}>
      <div className={cn("bloomberg-header justify-between", headerClassName)}>
        <div className="flex items-center gap-2">
          {titleIcon}
          <span className="bloomberg-header-title">{title}</span>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className={cn("p-3", contentClassName)}>
        {children}
      </div>
    </div>
  )
);
BloombergPanel.displayName = "BloombergPanel";

export { BloombergPanel };
