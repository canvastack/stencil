import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export const RatingStars = ({
  rating: ratingProp,
  maxStars = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  showValue = true,
  className,
}: RatingStarsProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  
  // Ensure rating is always a valid number
  const rating = Number(ratingProp) || 0;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const starSize = sizeClasses[size];

  const handleStarClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!interactive || !onRatingChange) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalf = x < rect.width / 2;

    const newRating = isHalf ? index + 0.5 : index + 1;
    onRatingChange(newRating);
  };

  const handleStarHover = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!interactive) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const isHalf = x < rect.width / 2;

    const hoverValue = isHalf ? index + 0.5 : index + 1;
    setHoveredRating(hoverValue);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoveredRating(null);
  };

  const renderStar = (index: number) => {
    const displayRating = hoveredRating !== null ? hoveredRating : rating;
    const fillPercentage = Math.min(Math.max((displayRating - index) * 100, 0), 100);

    const isFull = fillPercentage === 100;
    const isHalf = fillPercentage > 0 && fillPercentage < 100;
    const isEmpty = fillPercentage === 0;

    return (
      <button
        key={index}
        type="button"
        onClick={(e) => handleStarClick(index, e)}
        onMouseMove={(e) => handleStarHover(index, e)}
        disabled={!interactive}
        className={cn(
          "relative transition-all",
          interactive && "cursor-pointer hover:scale-110",
          !interactive && "cursor-default"
        )}
      >
        <div className="relative">
          <Star
            className={cn(
              starSize,
              "transition-colors stroke-2",
              isEmpty && "text-muted-foreground",
              (isFull || isHalf) && "text-primary"
            )}
          />
          {(isFull || isHalf) && (
            <div
              className="absolute top-0 left-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star
                className={cn(starSize, "fill-primary text-primary stroke-2")}
              />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};
