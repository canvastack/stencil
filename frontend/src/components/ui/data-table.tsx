import * as React from "react";
import { createPortal } from "react-dom";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Maximize2, Minimize2, CheckCircle, AlertTriangle, XCircle, Download, Printer, Info } from "lucide-react";
import { useDatasetPerformanceMonitor } from '@/services/performance/datasetPerformanceMonitor';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataTableProps<TData> {
  // Use a wide ColumnDef signature to be compatible with various @tanstack/react-table versions
  columns: ColumnDef<any, any>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  // Show export/print controls (default true). Can be disabled per-page.
  showExport?: boolean;
  showPrint?: boolean;
  // Show internal pagination (default true). Can be disabled if using external pagination.
  showPagination?: boolean;
  // Loading state for skeleton animation
  loading?: boolean;
  // Performance monitoring identifier
  datasetId?: string;
  // Row click handler
  onRowClick?: (row: TData) => void;
  // Search change handler for external API calls
  onSearchChange?: (value: string) => void;
  // Page size change handler for external API calls
  onPageSizeChange?: (pageSize: number) => void;
  // External pagination data for server-side pagination
  externalPagination?: {
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    total: number;
    onPageChange?: (page: number) => void;
  };
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showExport = true,
  showPrint = true,
  showPagination = true,
  loading = false,
  datasetId = 'datatable',
  onRowClick,
  onSearchChange,
  onPageSizeChange,
  externalPagination,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  // Debounced search ref
  const debouncedSearchRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced search handler with warnings
  const handleDebouncedSearch = React.useCallback((value: string) => {
    if (debouncedSearchRef.current) {
      clearTimeout(debouncedSearchRef.current);
    }
    debouncedSearchRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      } else {
        console.warn('[DataTable] Search functionality used but no onSearchChange handler provided. Search will only work locally. To enable API search, provide onSearchChange prop.');
      }
    }, 300); // 300ms debounce
  }, [onSearchChange]);

  // Enhanced page size change handler with warnings
  const handleAutoPageSizeChange = React.useCallback((pageSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(pageSize);
    } else {
      console.warn('[DataTable] Page size change functionality used but no onPageSizeChange handler provided. Pagination will only work locally. To enable API pagination, provide onPageSizeChange prop.');
    }
  }, [onPageSizeChange]);
  
  // Performance monitoring
  const performanceMonitor = useDatasetPerformanceMonitor(datasetId);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: (updater) => {
      // Monitor sorting performance
      const startTime = performance.now();
      setSorting(updater);
      const endTime = performance.now();
      
      // Track sort performance
      if (endTime - startTime > 50) { // threshold 50ms
        console.warn(`🐌 Sorting took ${(endTime - startTime).toFixed(2)}ms for ${data.length} items`);
      }
    },
    onColumnFiltersChange: (updater) => {
      // Monitor filtering performance
      const startTime = performance.now();
      setColumnFilters(updater);
      const endTime = performance.now();
      
      // Track filter performance
      if (endTime - startTime > 50) { // threshold 50ms
        console.warn(`🐌 Filtering took ${(endTime - startTime).toFixed(2)}ms for ${data.length} items`);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    // Configure pagination based on external or internal
    ...(externalPagination ? {
      manualPagination: true,
      pageCount: externalPagination.pageCount,
    } : {}),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      // Set pagination state from external data if available
      ...(externalPagination ? {
        pagination: {
          pageIndex: externalPagination.pageIndex,
          pageSize: externalPagination.pageSize,
        }
      } : {}),
    },
  });

  // Performance monitoring untuk initial render dan data changes
  React.useEffect(() => {
    if (!loading && data.length > 0) {
      performanceMonitor.startRender(data.length);
      
      // Simulasi end render pada next tick
      const timer = setTimeout(() => {
        const metrics = performanceMonitor.endRender(data.length);
        if (metrics && data.length > 1000) {
          console.log(`📊 DataTable Performance (${datasetId}):`, {
            dataSize: metrics.dataSize,
            renderTime: `${metrics.renderTime.toFixed(2)}ms`,
            memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
          });
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [data, loading, performanceMonitor, datasetId]);

  // Keyboard shortcut for fullscreen toggle
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "t" && event.altKey) {
        event.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
      if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // --- EXPORT / PRINT UI state ---
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'csv'|'excel'|'pdf'>('csv');
  const availableColumns = React.useMemo(() => {
    return columns.map((col) => {
      const id = (col as any).id ?? (col as any).accessorKey ?? '';
      const header = typeof col.header === 'string' ? col.header : id;
      return { id, header };
    }).filter(c => c.id);
  }, [columns]);

  const [selectedColumnIds, setSelectedColumnIds] = React.useState<string[]>(() => availableColumns.map(c => c.id));
  const [rowCountMode, setRowCountMode] = React.useState<'preset'|'manual'>('preset');
  const [presetRowCount, setPresetRowCount] = React.useState<number | 'all'>(100);
  const [manualRowCount, setManualRowCount] = React.useState<number>(100);

  const toggleColumnSelection = (colId: string) => {
    setSelectedColumnIds((prev) => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
  };

  const getRowValue = (row: any, colId: string) => {
    // Support accessorKey/id simple access
    return row?.[colId] ?? '';
  };

  const buildRowsForExport = () => {
    const total = data.length;
    let count = 0;
    if (rowCountMode === 'preset') {
      if (presetRowCount === 'all') count = total; else count = Math.min(total, Number(presetRowCount));
    } else {
      count = Math.min(total, Math.max(0, Math.floor(manualRowCount || 0)));
    }
    const slice = count === 0 ? [] : data.slice(0, count === -1 ? data.length : count);
    return slice.map((r) => {
      const mapped: Record<string, any> = {};
      selectedColumnIds.forEach((cid) => {
        mapped[cid] = getRowValue(r, cid);
      });
      return mapped;
    });
  };

  // Export helpers
  const downloadCSV = (filename = 'export.csv') => {
    const rows = buildRowsForExport();
    const header = selectedColumnIds.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',');
    const csvRows = rows.map(r => selectedColumnIds.map(cid => '"' + String(r[cid] ?? '').replace(/"/g,'""') + '"').join(','));
    const csv = [header, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadXLSX = async (filename = 'export.xlsx') => {
    // lazy import xlsx to keep initial bundle small
  // @ts-ignore - dynamic import, types may not be present in this environment
  const XLSX = await import('xlsx');
    const rows = buildRowsForExport();
    const sheet = (XLSX as any).utils.json_to_sheet(rows);
    const wb = { Sheets: { data: sheet }, SheetNames: ['data'] };
    const wbout = (XLSX as any).write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async (filename = 'export.pdf') => {
  // @ts-ignore - dynamic import, types may not be present in this environment
  const { jsPDF } = await import('jspdf');
  // @ts-ignore
  const autoTableModule = await import('jspdf-autotable');
    const autoTable = (autoTableModule as any).default || (autoTableModule as any);
    const rows = buildRowsForExport();
    const headers = selectedColumnIds;
    const doc = new (jsPDF as any)();
    autoTable(doc, { head: [headers], body: rows.map(r => selectedColumnIds.map(cid => r[cid])) });
    doc.save(filename);
  };

  const handleExport = async () => {
    setExportDialogOpen(false);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `export-${timestamp}`;
    if (exportFormat === 'csv') {
      downloadCSV(`${filenameBase}.csv`);
    } else if (exportFormat === 'excel') {
      await downloadXLSX(`${filenameBase}.xlsx`);
    } else if (exportFormat === 'pdf') {
      await downloadPDF(`${filenameBase}.pdf`);
    }
  };

  const handlePrint = () => {
    setPrintDialogOpen(false);
    const rows = buildRowsForExport();
    const headers = selectedColumnIds;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Print</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${String(r[h]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // Skeleton Loading Components
  const TableSkeleton = () => {
    const skeletonRows = Array.from({ length: table.getState().pagination.pageSize || 5 }, (_, i) => i);
    
    return (
      <>
        {skeletonRows.map((_, index) => (
          <TableRow key={`skeleton-${index}`}>
            {columns.map((_, colIndex) => (
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
    <div className={`flex items-center py-4 space-x-2 ${isFullscreen ? "" : "px-2"} flex-wrap`}>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-20" /> {/* "Rows per page" text */}
        <Skeleton className="h-8 w-[70px]" /> {/* Select dropdown */}
      </div>
      <Skeleton className="h-8 flex-1 min-w-[150px] max-w-sm" /> {/* Search input */}
      <Skeleton className="h-8 w-20" /> {/* Columns button */}
      <Skeleton className="h-8 w-16" /> {/* Export button */}
      <Skeleton className="h-8 w-16" /> {/* Print button */}
      <Skeleton className="h-8 w-8" /> {/* Fullscreen button */}
    </div>
  );

  const PaginationSkeleton = () => (
    <div className={`flex items-center justify-between py-4 ${isFullscreen ? "px-2" : "px-4"}`}>
      <Skeleton className="h-4 w-40" /> {/* Selection text */}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <Skeleton className="h-4 w-20" /> {/* Page info */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" /> {/* Previous button */}
          <Skeleton className="h-8 w-8" /> {/* Page numbers */}
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" /> {/* Next button */}
        </div>
      </div>
    </div>
  );

  const tableContent = (
    <TooltipProvider>
      <div className={`w-full ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
        {loading ? (
          <ControlsSkeleton />
        ) : (
          <div className={`flex items-center py-4 space-x-2 ${isFullscreen ? "" : "px-2"} flex-wrap`}> 
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={String(externalPagination ? externalPagination.pageSize : table.getState().pagination.pageSize)}
              onValueChange={(value) => {
                const newPageSize = Number(value);
                if (!externalPagination) {
                  table.setPageSize(newPageSize);
                }
                // Call handler (either provided or auto)
                handleAutoPageSizeChange(newPageSize);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                table.getColumn(searchKey)?.setFilterValue(value);
                // Call external handler with debounce
                handleDebouncedSearch(value);
              }}
              className="flex-1 min-w-[150px] max-w-sm"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center space-x-2">
            {showExport && (
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-2">
                      <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => { setExportFormat('csv'); setExportDialogOpen(true); }}>
                      CSV
                    </button>
                    <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => { setExportFormat('excel'); setExportDialogOpen(true); }}>
                      Excel
                    </button>
                    <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={() => { setExportFormat('pdf'); setExportDialogOpen(true); }}>
                      PDF
                    </button>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            {showPrint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2" onClick={() => setPrintDialogOpen(true)}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Print table data</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="ml-2"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle fullscreen table view</p>
                <p className="text-xs text-muted-foreground">Shortcut: Alt+T to enter, Escape to exit</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        )}
        
        {/* Export / Print Dialogs */}
          <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export table data ({exportFormat.toUpperCase()})</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Pilih kolom</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-auto">
                    {availableColumns.map((c) => (
                      <label key={c.id} className="inline-flex items-center space-x-2">
                        <input type="checkbox" checked={selectedColumnIds.includes(c.id)} onChange={() => toggleColumnSelection(c.id)} />
                        <span className="text-sm">{c.header}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Jumlah baris</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <select value={String(presetRowCount)} onChange={(e) => setPresetRowCount(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded border px-2 py-1">
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={750}>750</option>
                      <option value={1000}>1000</option>
                      <option value={'all'}>All rows</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">atau</label>
                      <input type="number" value={manualRowCount} onChange={(e) => setManualRowCount(Number(e.target.value))} className="w-32 rounded border px-2 py-1" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleExport}>Export</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Print table data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Pilih kolom</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-auto">
                    {availableColumns.map((c) => (
                      <label key={c.id} className="inline-flex items-center space-x-2">
                        <input type="checkbox" checked={selectedColumnIds.includes(c.id)} onChange={() => toggleColumnSelection(c.id)} />
                        <span className="text-sm">{c.header}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium">Jumlah baris</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <select value={String(presetRowCount)} onChange={(e) => setPresetRowCount(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded border px-2 py-1">
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={750}>750</option>
                      <option value={1000}>1000</option>
                      <option value={'all'}>All rows</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">atau</label>
                      <input type="number" value={manualRowCount} onChange={(e) => setManualRowCount(Number(e.target.value))} className="w-32 rounded border px-2 py-1" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
                <Button onClick={handlePrint}>Print</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className={`rounded-md border overflow-x-auto ${isFullscreen ? "" : "mx-0"}`}>
          <Table className="w-full table-auto">
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
                    onClick={(e) => {
                      // Don't trigger row click if clicking on action buttons or checkboxes
                      const target = e.target as HTMLElement;
                      const isActionClick = target.closest('button') || 
                                           target.closest('a') || 
                                           target.closest('[role="checkbox"]') ||
                                           target.closest('[data-radix-collection-item]');
                      
                      if (!isActionClick && onRowClick) {
                        onRowClick(row.original);
                      }
                    }}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="max-w-[280px] break-words">
                        {/* If this is a status column render an icon with tooltip */}
                        {cell.column.id === 'status' ? (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
          </Table>
        </div>
        
        {showPagination && (loading ? (
          <PaginationSkeleton />
        ) : (
          <div className={`flex items-center justify-between py-4 ${isFullscreen ? "px-2" : "px-4"}`}>
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {(externalPagination ? externalPagination.pageIndex : table.getState().pagination.pageIndex) + 1} of{" "}
                {externalPagination ? externalPagination.pageCount : table.getPageCount()}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => {
                        if (externalPagination && externalPagination.onPageChange) {
                          externalPagination.onPageChange(externalPagination.pageIndex - 1);
                        } else if (externalPagination) {
                          console.warn('[DataTable] External pagination configured but no onPageChange handler provided. Page navigation will not work.');
                        } else {
                          table.previousPage();
                        }
                      }}
                      className={
                        (externalPagination ? externalPagination.pageIndex === 0 : !table.getCanPreviousPage())
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: externalPagination ? externalPagination.pageCount : table.getPageCount() }, (_, i) => {
                    const pageNumber = i + 1;
                    const currentPageIndex = externalPagination ? externalPagination.pageIndex : table.getState().pagination.pageIndex;
                    const isCurrentPage = currentPageIndex === i;

                    if (
                      pageNumber === 1 ||
                      pageNumber === (externalPagination ? externalPagination.pageCount : table.getPageCount()) ||
                      (pageNumber >= currentPageIndex - 1 &&
                        pageNumber <= currentPageIndex + 1)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => {
                              if (externalPagination && externalPagination.onPageChange) {
                                externalPagination.onPageChange(i);
                              } else if (externalPagination) {
                                console.warn('[DataTable] External pagination configured but no onPageChange handler provided. Page navigation will not work.');
                              } else {
                                table.setPageIndex(i);
                              }
                            }}
                            isActive={isCurrentPage}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNumber === currentPageIndex - 2 ||
                      pageNumber === currentPageIndex + 2
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => {
                        if (externalPagination && externalPagination.onPageChange) {
                          externalPagination.onPageChange(externalPagination.pageIndex + 1);
                        } else if (externalPagination) {
                          console.warn('[DataTable] External pagination configured but no onPageChange handler provided. Page navigation will not work.');
                        } else {
                          table.nextPage();
                        }
                      }}
                      className={
                        (externalPagination ? externalPagination.pageIndex >= externalPagination.pageCount - 1 : !table.getCanNextPage())
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
                </Pagination>
              </div>
            </div>
        ))}
      </div>
    </TooltipProvider>
  );

  return isFullscreen && typeof document !== 'undefined' 
    ? createPortal(tableContent, document.body)
    : tableContent;
}