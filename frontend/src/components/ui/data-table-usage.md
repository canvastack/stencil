# DataTable API Integration Guide

## Overview

The DataTable component supports both local (client-side) and external (server-side) data operations. For optimal performance and consistency across the application, **always use API integration** when possible.

## ✅ Correct Usage (API Integration)

```tsx
import { DataTable } from '@/components/ui/data-table';

function MyPage() {
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 20,
    search: '',
  });

  const { data, pagination, isLoading } = useMyDataHook();

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset to page 1 when filters change
    }));
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={isLoading}
      searchKey="name"
      searchPlaceholder="Search items..."
      // ✅ REQUIRED: API search integration
      onSearchChange={(value) => handleFilterChange('search', value)}
      // ✅ REQUIRED: API pagination integration  
      onPageSizeChange={(pageSize) => handleFilterChange('per_page', pageSize)}
      // ✅ REQUIRED: External pagination data
      externalPagination={{
        pageIndex: (pagination?.page || 1) - 1, // Convert to 0-based
        pageSize: pagination?.per_page || 20,
        pageCount: pagination?.last_page || 1,
        total: pagination?.total || 0,
        onPageChange: (page) => handleFilterChange('page', page + 1), // Convert to 1-based
      }}
    />
  );
}
```

## ❌ Incorrect Usage (Local Only)

```tsx
// ❌ DON'T DO THIS - Missing API callbacks
<DataTable
  columns={columns}
  data={filteredData} // Client-side filtering
  searchPlaceholder="Search..."
  // Missing onSearchChange, onPageSizeChange, externalPagination
/>
```

## Warning System

The DataTable component includes a built-in warning system that alerts developers when API callbacks are missing:

- **Search Warning**: `[DataTable] Search functionality used but no onSearchChange handler provided`
- **Pagination Warning**: `[DataTable] Page size change functionality used but no onPageSizeChange handler provided`

## Required Props for API Integration

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSearchChange` | `(value: string) => void` | ✅ | Handles search input changes with 300ms debounce |
| `onPageSizeChange` | `(pageSize: number) => void` | ✅ | Handles page size changes |
| `externalPagination` | `ExternalPagination` | ✅ | Server-side pagination data and handlers |

## ExternalPagination Interface

```tsx
interface ExternalPagination {
  pageIndex: number;      // 0-based page index
  pageSize: number;       // Items per page
  pageCount: number;      // Total number of pages
  total: number;          // Total number of items
  onPageChange?: (page: number) => void; // Page change handler
}
```

## Migration Checklist

When updating existing DataTable usages:

1. ✅ Add `onSearchChange` prop with API integration
2. ✅ Add `onPageSizeChange` prop with API integration  
3. ✅ Add `externalPagination` object with pagination data
4. ✅ Replace client-side filtering with server-side API calls
5. ✅ Update loading states to use `loading` prop
6. ✅ Test search, pagination, and page size changes

## Examples by Page Type

### Customer Database (✅ Working Example)
- File: `frontend/src/pages/admin/customers/CustomerDatabase.tsx`
- Uses: `useCustomers` hook with filters
- Features: Search, pagination, filtering via API

### Vendor Database (✅ Updated Example)  
- File: `frontend/src/pages/admin/vendors/VendorDatabase.tsx`
- Uses: `useVendors` hook with VendorFilters
- Features: Search, pagination, status filtering via API

### Vendor Payments (✅ Basic Integration)
- File: `frontend/src/pages/admin/vendors/VendorPayments.tsx`
- Uses: Basic search integration
- Note: Could be enhanced with full API pagination

## Performance Benefits

API integration provides:
- **Faster Loading**: Only loads current page data
- **Better UX**: Consistent behavior across all tables
- **Scalability**: Handles large datasets efficiently
- **Real-time**: Always shows current server data

## Troubleshooting

**Q: Search/pagination not working?**
A: Check browser console for DataTable warnings and ensure all required props are provided.

**Q: Page resets when filtering?**
A: Ensure `page: 1` is set when non-page filters change in your filter handler.

**Q: Pagination shows wrong numbers?**
A: Verify `pageIndex` conversion (0-based for DataTable, 1-based for API).
- **Purpose**: Called when user types in search input (debounced 300ms)
- **Example**: Update API filters and refetch data

### onPageSizeChange
- **Type**: `(pageSize: number) => void`
- **Purpose**: Called when user changes rows per page
- **Example**: Update API pagination and refetch data

### externalPagination
- **Type**: Object with pagination data and handlers
- **Purpose**: Provides server-side pagination data to DataTable
- **Required when**: Using server-side pagination

## Implementation Pattern

1. **Create filter state**:
```tsx
const [filters, setFilters] = useState({
  search: '',
  page: 1,
  per_page: 20,
  // other filters...
});
```

2. **Create filter change handler**:
```tsx
const handleFilterChange = useCallback((key: string, value: any) => {
  setFilters(prev => ({
    ...prev,
    [key]: value,
    page: key === 'page' ? value : 1, // Reset page when other filters change
  }));
}, []);
```

3. **Fetch data when filters change**:
```tsx
useEffect(() => {
  fetchData(filters);
}, [filters]);
```

4. **Pass handlers to DataTable**:
```tsx
<DataTable
  // ... other props
  onSearchChange={(value) => handleFilterChange('search', value)}
  onPageSizeChange={(size) => handleFilterChange('per_page', size)}
  externalPagination={{
    pageIndex: (pagination?.page || 1) - 1,
    pageSize: pagination?.per_page || 20,
    pageCount: pagination?.last_page || 1,
    total: pagination?.total || 0,
    onPageChange: (index) => handleFilterChange('page', index + 1),
  }}
/>
```

## Console Warnings

If you use DataTable's built-in features without providing handlers, you'll see warnings:

- **Search without onSearchChange**: "Search functionality used but no onSearchChange handler provided"
- **Page size without onPageSizeChange**: "Page size change functionality used but no onPageSizeChange handler provided"
- **External pagination without onPageChange**: "External pagination configured but no onPageChange handler provided"

## Complete Example

See `frontend/src/pages/admin/customers/CustomerDatabase.tsx` for a complete implementation example.

## Migration Guide

If you have existing DataTable usage that only works locally:

1. Add `onSearchChange` handler for search functionality
2. Add `onPageSizeChange` handler for pagination controls
3. Add `externalPagination` prop for server-side pagination
4. Ensure your API supports the required parameters: `search`, `per_page`, `page`