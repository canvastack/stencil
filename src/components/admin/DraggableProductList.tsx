import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Product } from '@/types/product';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableProductItemProps {
  product: Product;
  renderProduct: (product: Product, isDragging?: boolean) => React.ReactNode;
}

function SortableProductItem({ product, renderProduct }: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.uuid || product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-2 rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 z-50',
        !isDragging && 'hover:shadow-md'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'flex cursor-grab items-center justify-center px-2 py-4',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-muted/50 rounded-l-lg',
          isDragging && 'cursor-grabbing'
        )}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 py-2 pr-4">
        {renderProduct(product, isDragging)}
      </div>
    </div>
  );
}

interface DraggableProductListProps {
  products: Product[];
  onReorder: (reorderedProducts: Product[]) => void;
  renderProduct: (product: Product, isDragging?: boolean) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Drag & Drop product list component for intuitive reordering
 * Uses @dnd-kit for smooth, accessible drag & drop interactions
 * 
 * Features:
 * - Visual drag handle on hover
 * - Smooth animations during drag
 * - Keyboard accessibility
 * - Optimistic UI updates
 * - Works with any product renderer
 * 
 * @example
 * <DraggableProductList
 *   products={products}
 *   onReorder={handleReorder}
 *   renderProduct={(product) => <ProductCard product={product} />}
 * />
 */
export const DraggableProductList = ({
  products,
  onReorder,
  renderProduct,
  className,
  disabled = false,
}: DraggableProductListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = products.findIndex(p => (p.uuid || p.id) === active.id);
    const newIndex = products.findIndex(p => (p.uuid || p.id) === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedProducts = arrayMove(products, oldIndex, newIndex);
    onReorder(reorderedProducts);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeProduct = activeId ? products.find(p => (p.uuid || p.id) === activeId) : null;

  if (disabled) {
    return (
      <div className={cn('space-y-2', className)}>
        {products.map((product) => (
          <div key={product.uuid || product.id} className="rounded-lg border bg-card p-4">
            {renderProduct(product)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={products.map(p => p.uuid || p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-2', className)} role="list" aria-label="Draggable product list">
          {products.map((product) => (
            <SortableProductItem
              key={product.uuid || product.id}
              product={product}
              renderProduct={renderProduct}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeProduct ? (
          <div className="rounded-lg border bg-card p-4 shadow-lg opacity-90">
            {renderProduct(activeProduct, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
