import React, { Children, isValidElement } from 'react';

interface StaggeredContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation in ms */
  staggerDelay?: number;
  /** Base delay before first animation starts in ms */
  baseDelay?: number;
}

/**
 * Wraps children and applies staggered animation delays for sequential fade-in effect.
 * Uses h-full on wrappers to preserve grid equal-height alignment.
 */
export function StaggeredContainer({
  children,
  className,
  staggerDelay = 50,
  baseDelay = 0,
}: StaggeredContainerProps) {
  const childArray = Children.toArray(children);

  return (
    <div className={className}>
      {childArray.map((child, index) => {
        if (!isValidElement(child)) return child;

        const delay = baseDelay + index * staggerDelay;

        return (
          <div
            key={index}
            className="animate-fade-in opacity-0 h-full"
            style={{
              animationDelay: `${delay}ms`,
              animationFillMode: 'forwards',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
