# Delete Loading System - Usage Guide

## Overview

The Delete Loading System provides a global, reusable solution for showing loading states when deleting items from tables. When a delete operation is in progress, the affected row displays a red-tinted skeleton animation, providing clear visual feedback to users.

## Features

- ✅ **Global Implementation**: Works across all DataTable instances
- ✅ **Red-tinted Skeleton**: Distinctive loading animation with customizable red intensity
- ✅ **Row Interaction Disabled**: Prevents clicks on rows being deleted
- ✅ **Bulk Delete Support**: Handles multiple simultaneous deletions
- ✅ **Error Handling**: Automatic cleanup on delete failures
- ✅ **TypeScript Support**: Full type safety

## Components

### 1. `useDeleteLoading` Hook

Manages delete loading state and provides handlers for delete operations.

```typescript
import { useDeleteLoading } from '@/hooks/useDeleteLoading';

const deleteLoading = useDeleteLoading({
  onDelete: async (id: string) => {
    // Your delete API call
    await apiService.deleteItem(id);
  },
  onSuccess: (id: string) => {
    toast.success('Item deleted successfully');
  },
  onError: (id: string, error: any) => {
    toast.error('Failed to delete item');
  },
});
```

### 2. `DeleteSkeleton` Component

Red-tinted skeleton component for loading states.

```typescript
import { DeleteSkeleton } from '@/components/ui/delete-skeleton';

<DeleteSkeleton 
  height="1.5rem" 
  width="100%" 
  redIntensity={25}
  className="rounded"
/>
```

### 3. Enhanced `DataTable` Component

Automatically handles delete loading states when provided with `deletingIds` prop.

## Usage Examples

### Basic Implementation

```typescript
import React from 'react';
import { useDeleteLoading } from '@/hooks/useDeleteLoading';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';

export function MyDataTable() {
  const [items, setItems] = useState([]);
  
  // Setup delete loading
  const deleteLoading = useDeleteLoading({
    onDelete: async (itemId: string) => {
      await apiService.deleteItem(itemId);
      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
    },
    onSuccess: (itemId: string) => {
      toast.success('Item deleted successfully');
    },
    onError: (itemId: string, error: any) => {
      toast.error('Failed to delete item');
    },
  });

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure?')) {
      await deleteLoading.handleDelete(itemId);
    }
  };

  const columns = [
    // ... your columns
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => handleDelete(row.original.id)}
          disabled={deleteLoading.isDeleting(row.original.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      deletingIds={deleteLoading.deletingIds}
      getRowId={(item) => item.id}
    />
  );
}
```

### Bulk Delete Implementation

```typescript
const handleBulkDelete = async () => {
  if (selectedItems.size === 0) return;
  
  if (window.confirm(`Delete ${selectedItems.size} items?`)) {
    // Start loading for all selected items
    for (const itemId of selectedItems) {
      deleteLoading.startDelete(itemId);
    }
    
    // Delete items sequentially
    for (const itemId of selectedItems) {
      try {
        await apiService.deleteItem(itemId);
        deleteLoading.endDelete(itemId);
      } catch (error) {
        deleteLoading.endDelete(itemId);
        console.error(`Failed to delete ${itemId}:`, error);
      }
    }
    
    setSelectedItems(new Set());
  }
};
```

### Custom Row ID Function

```typescript
<DataTable
  columns={columns}
  data={items}
  deletingIds={deleteLoading.deletingIds}
  getRowId={(item) => item.uuid || item.id || String(item)}
/>
```

## API Reference

### `useDeleteLoading(options)`

#### Options
- `onDelete?: (id: string) => Promise<void>` - Delete function to execute
- `onSuccess?: (id: string) => void` - Success callback
- `onError?: (id: string, error: any) => void` - Error callback

#### Returns
- `deletingIds: Set<string>` - Set of IDs currently being deleted
- `isDeleting: (id: string) => boolean` - Check if specific ID is being deleted
- `startDelete: (id: string) => void` - Start delete loading for ID
- `endDelete: (id: string) => void` - End delete loading for ID
- `handleDelete: (id: string) => Promise<void>` - Complete delete handler
- `clearAll: () => void` - Clear all delete loading states

### `DeleteSkeleton` Props

- `width?: string | number` - Width of skeleton (default: "100%")
- `height?: string | number` - Height of skeleton (default: "1rem")
- `animate?: boolean` - Enable animation (default: true)
- `redIntensity?: number` - Red tint intensity 0-100 (default: 20)

### `DataTable` New Props

- `deletingIds?: Set<string>` - Set of IDs being deleted
- `getRowId?: (row: TData) => string` - Function to extract ID from row data

## Styling Customization

### Custom Red Intensity

```typescript
<DeleteSkeleton redIntensity={40} /> // More intense red
<DeleteSkeleton redIntensity={10} /> // Subtle red tint
```

### Custom Animation

```typescript
<DeleteSkeleton animate={false} /> // Static skeleton
```

### Custom Styling

```typescript
<DeleteSkeleton 
  className="rounded-lg border-2 border-red-200" 
  style={{ boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' }}
/>
```

## Best Practices

### 1. Always Provide Confirmation

```typescript
const handleDelete = async (id: string) => {
  if (window.confirm('Are you sure you want to delete this item?')) {
    await deleteLoading.handleDelete(id);
  }
};
```

### 2. Handle Errors Gracefully

```typescript
const deleteLoading = useDeleteLoading({
  onError: (id, error) => {
    console.error('Delete failed:', error);
    toast.error('Delete failed. Please try again.');
  },
});
```

### 3. Disable Actions During Delete

```typescript
<Button 
  onClick={() => handleDelete(item.id)}
  disabled={deleteLoading.isDeleting(item.id)}
>
  {deleteLoading.isDeleting(item.id) ? 'Deleting...' : 'Delete'}
</Button>
```

### 4. Provide Visual Feedback

```typescript
const deleteLoading = useDeleteLoading({
  onSuccess: (id) => {
    toast.success('Item deleted successfully');
  },
  onError: (id, error) => {
    toast.error('Failed to delete item');
  },
});
```

## Migration Guide

### From Manual Delete Handling

**Before:**
```typescript
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async (id: string) => {
  setIsDeleting(true);
  try {
    await deleteItem(id);
    toast.success('Deleted');
  } catch (error) {
    toast.error('Failed');
  } finally {
    setIsDeleting(false);
  }
};
```

**After:**
```typescript
const deleteLoading = useDeleteLoading({
  onDelete: deleteItem,
  onSuccess: () => toast.success('Deleted'),
  onError: () => toast.error('Failed'),
});

const handleDelete = (id: string) => deleteLoading.handleDelete(id);
```

### Adding to Existing DataTable

1. Import the hook:
```typescript
import { useDeleteLoading } from '@/hooks/useDeleteLoading';
```

2. Setup the hook:
```typescript
const deleteLoading = useDeleteLoading({
  onDelete: yourDeleteFunction,
});
```

3. Add props to DataTable:
```typescript
<DataTable
  // ... existing props
  deletingIds={deleteLoading.deletingIds}
  getRowId={(row) => row.id}
/>
```

4. Update delete handlers:
```typescript
const handleDelete = (id: string) => deleteLoading.handleDelete(id);
```

## Troubleshooting

### Skeleton Not Showing
- Ensure `deletingIds` prop is passed to DataTable
- Verify `getRowId` function returns correct ID
- Check that delete operation calls `startDelete()`

### Multiple Skeletons for Same Row
- Ensure `getRowId` returns unique, consistent IDs
- Check for duplicate IDs in your data

### Performance Issues
- Use `React.memo` for table rows if needed
- Consider debouncing rapid delete operations
- Limit concurrent delete operations for bulk actions

## Examples in Codebase

- **Customer Database**: `frontend/src/pages/admin/customers/CustomerDatabase.tsx` ✅ **IMPLEMENTED**
- **Order Management**: `frontend/src/pages/admin/OrderManagement.tsx` ✅ **IMPLEMENTED**
- **Product Catalog**: `frontend/src/pages/admin/products/ProductCatalog.tsx` ✅ **IMPLEMENTED**
- **Vendor Database**: `frontend/src/pages/admin/vendors/VendorDatabase.tsx` ✅ **IMPLEMENTED**

This system provides a consistent, professional user experience across all delete operations in the application while maintaining code reusability and type safety.