import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface BulkAction {
  label: string;
  action: (selectedRows: any[]) => void;
  variant?: 'default' | 'destructive';
  icon?: React.ComponentType<{ className?: string }>;
}

interface BulkDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: string;
  bulkActions?: BulkAction[];
  enableBulkSelect?: boolean;
  loading?: boolean;
}

export function BulkDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
  bulkActions = [],
  enableBulkSelect = true,
  loading = false,
}: BulkDataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  // Add selection column if bulk select is enabled
  const columnsWithSelection: ColumnDef<TData, TValue>[] = enableBulkSelect
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!searchKey || !filterValue) return true;
      const value = row.getValue(searchKey) as string;
      return value?.toLowerCase().includes(filterValue.toLowerCase()) ?? false;
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedRowsData = selectedRows.map(row => row.original);

  const handleBulkAction = (action: BulkAction) => {
    if (selectedRowsData.length === 0) return;
    action.action(selectedRowsData);
    setRowSelection({});
  };

  // Skeleton Loading Components
  const TableSkeleton = () => {
    const skeletonRows = Array.from({ length: table.getState().pagination.pageSize || 5 }, (_, i) => i);
    
    return (
      <>
        {skeletonRows.map((_, index) => (
          <TableRow key={`skeleton-${index}`}>
            {columnsWithSelection.map((_, colIndex) => (
              <TableCell key={`skeleton-cell-${index}-${colIndex}`} className="py-4">
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  };

  const ControlsSkeleton = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-8 max-w-sm w-40" /> {/* Search input */}
        <Skeleton className="h-6 w-16" /> {/* Selected count */}
        <Skeleton className="h-8 w-24" /> {/* Bulk actions button */}
      </div>
    </div>
  );

  const PaginationSkeleton = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        <Skeleton className="h-4 w-40" /> {/* Selection text */}
      </div>
      <div className="space-x-2">
        <Skeleton className="h-8 w-20 inline-block" /> {/* Previous button */}
        <Skeleton className="h-8 w-20 inline-block" /> {/* Next button */}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {loading ? (
        <ControlsSkeleton />
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            {enableBulkSelect && selectedRows.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} selected
                </span>
                {bulkActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {bulkActions.map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => handleBulkAction(action)}
                          className={action.variant === 'destructive' ? 'text-destructive' : ''}
                        >
                          {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {loading ? (
        <PaginationSkeleton />
      ) : (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {enableBulkSelect && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}