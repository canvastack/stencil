import * as React from "react";
import { cn } from "@/lib/utils";

interface DeleteSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The width of the skeleton
   * @default "100%"
   */
  width?: string | number;
  /**
   * The height of the skeleton
   * @default "1rem"
   */
  height?: string | number;
  /**
   * Whether to show the pulsing animation
   * @default true
   */
  animate?: boolean;
  /**
   * Intensity of the red tint (0-100)
   * @default 20
   */
  redIntensity?: number;
}

const DeleteSkeleton = React.forwardRef<HTMLDivElement, DeleteSkeletonProps>(
  ({ className, width = "100%", height = "1rem", animate = true, redIntensity = 20, style, ...props }, ref) => {
    const skeletonStyle = {
      width,
      height,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20",
          animate && "animate-pulse",
          className
        )}
        style={{
          ...skeletonStyle,
          backgroundColor: `rgba(239, 68, 68, ${redIntensity / 100 * 0.3})`, // red-500 with opacity
          backgroundImage: animate 
            ? `linear-gradient(90deg, 
                rgba(239, 68, 68, ${redIntensity / 100 * 0.2}) 0%, 
                rgba(239, 68, 68, ${redIntensity / 100 * 0.4}) 50%, 
                rgba(239, 68, 68, ${redIntensity / 100 * 0.2}) 100%)`
            : undefined,
          backgroundSize: animate ? "200% 100%" : undefined,
          animation: animate ? "delete-skeleton-shimmer 2s ease-in-out infinite" : undefined,
        }}
        {...props}
      />
    );
  }
);

DeleteSkeleton.displayName = "DeleteSkeleton";

export { DeleteSkeleton };

// Add CSS animation for the shimmer effect
const style = document.createElement('style');
style.textContent = `
  @keyframes delete-skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;
document.head.appendChild(style);