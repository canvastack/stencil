import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

interface CursorTooltipProps {
  text: string;
  className?: string;
  maxLines?: number;
  as?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'div';
  tooltipClassName?: string;
}

export const CursorTooltip: React.FC<CursorTooltipProps> = ({
  text,
  className = '',
  maxLines = 1,
  as: Component = 'p',
  tooltipClassName = '',
}) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsTruncated(element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
    }
  }, [text]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isTruncated) return;
    
    const tooltipWidth = 400;
    const tooltipHeight = 100;
    const padding = 20;
    
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = e.clientX - tooltipWidth - 15;
    }
    
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = e.clientY - tooltipHeight - 15;
    }
    
    if (x < padding) {
      x = padding;
    }
    
    if (y < padding) {
      y = padding;
    }
    
    setTooltipPos({ x, y });
  }, [isTruncated]);

  const handleMouseEnter = useCallback(() => {
    if (isTruncated) {
      setShowTooltip(true);
    }
  }, [isTruncated]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  return (
    <>
      <Component
        ref={textRef as any}
        className={className}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text}
      </Component>
      
      {showTooltip && isTruncated && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            maxWidth: '400px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          className={`bg-popover border border-border text-popover-foreground shadow-2xl rounded-lg p-3 animate-in fade-in-0 zoom-in-95 duration-200 ${tooltipClassName}`}
        >
          <p className="text-sm leading-relaxed whitespace-normal break-words">
            {text}
          </p>
        </div>,
        document.body
      )}
    </>
  );
};

CursorTooltip.displayName = 'CursorTooltip';
