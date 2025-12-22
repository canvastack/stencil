import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { Vendor } from '@/types/vendor';

interface VirtualVendorListProps {
  vendors: Vendor[];
  renderRow: (vendor: Vendor, index: number) => React.ReactNode;
  estimatedRowHeight?: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtual scrolling list component for efficient rendering of large vendor lists
 * Only renders visible items + overscan for smooth scrolling
 */
export const VirtualVendorList = ({ 
  vendors, 
  renderRow,
  estimatedRowHeight = 60,
  overscan = 5,
  className = 'h-[600px]'
}: VirtualVendorListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: vendors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto border rounded-lg ${className}`}
      role="list"
      aria-label="Virtual scrolling vendor list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualRow) => {
          const vendor = vendors[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              role="listitem"
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderRow(vendor, virtualRow.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
