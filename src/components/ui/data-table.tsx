import * as React from "react";
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
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  showExport = true,
  showPrint = true,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

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

  return (
    <TooltipProvider>
      <div className={`w-full ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
  <div className={`flex items-center py-4 space-x-2 ${isFullscreen ? "" : "px-2"} flex-wrap`}> 
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 flex-shrink-0"
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          {searchKey && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
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
              {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="max-w-[280px] break-words">
                      {/* If this is a status column render an icon with tooltip */}
                      {cell.column.id === 'status' ? (
                        (() => {
                          const stock = row.getValue('stock') as number | undefined;
                          const minStock = row.getValue('minStock') as number | undefined;
                          let icon = <Info className="h-4 w-4" />;
                          let text = String(cell.getValue() ?? '');
                          if (typeof stock === 'number' && typeof minStock === 'number') {
                            if (stock === 0) {
                              icon = <XCircle className="h-4 w-4 text-red-600" />;
                              text = 'Stock habis';
                            } else if (stock <= minStock) {
                              icon = <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                              text = 'Stock menipis';
                            } else {
                              icon = <CheckCircle className="h-4 w-4 text-green-600" />;
                              text = 'Stock masih ada';
                            }
                          } else {
                            // Fallback: use cell value string
                            const v = String(cell.getValue() ?? '').toLowerCase();
                            if (v.includes('out') || v.includes('habis')) { icon = <XCircle className="h-4 w-4 text-red-600" />; }
                            else if (v.includes('low') || v.includes('menipis')) { icon = <AlertTriangle className="h-4 w-4 text-yellow-600" />; }
                            else { icon = <CheckCircle className="h-4 w-4 text-green-600" />; }
                          }
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center">{icon}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{text}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()
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
        <div className={`flex items-center justify-between py-4 ${isFullscreen ? "px-2" : "px-4"}`}>
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    className={
                      !table.getCanPreviousPage()
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: table.getPageCount() }, (_, i) => {
                  const pageNumber = i + 1;
                  const isCurrentPage = table.getState().pagination.pageIndex === i;

                  if (
                    pageNumber === 1 ||
                    pageNumber === table.getPageCount() ||
                    (pageNumber >= table.getState().pagination.pageIndex - 1 &&
                      pageNumber <= table.getState().pagination.pageIndex + 1)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => table.setPageIndex(i)}
                          isActive={isCurrentPage}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (
                    pageNumber === table.getState().pagination.pageIndex - 2 ||
                    pageNumber === table.getState().pagination.pageIndex + 2
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
                    onClick={() => table.nextPage()}
                    className={
                      !table.getCanNextPage()
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}