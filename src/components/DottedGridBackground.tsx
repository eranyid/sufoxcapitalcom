import React from 'react';
import { cn } from '@/lib/utils';

interface DottedGridBackgroundProps {
  /** Size of each dot in pixels */
  dotSize?: number;
  /** Spacing between dots in pixels */
  dotSpacing?: number;
  /** Overall opacity of the grid (0-1) */
  opacity?: number;
  /** Whether to fade edges with a radial mask */
  fadeEdges?: boolean;
  /** Additional className for the container */
  className?: string;
  /** Children to render on top of the background */
  children?: React.ReactNode;
}

/**
 * A subtle dotted grid background component that creates a "terminal canvas" effect.
 * Uses pure CSS radial gradients for performance.
 */
export function DottedGridBackground({
  dotSize = 1,
  dotSpacing = 24,
  opacity = 0.06,
  fadeEdges = true,
  className,
  children,
}: DottedGridBackgroundProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Dotted grid layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, hsl(var(--foreground) / ${opacity}) ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
          ...(fadeEdges && {
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 70%)',
          }),
        }}
        aria-hidden="true"
      />
      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
