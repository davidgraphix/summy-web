"use client";

import * as React from "react";
import {
  flexRender, getCoreRowModel, useReactTable,
  type ColumnDef, type RowSelectionState, type SortingState, type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { PagedResult } from "@/types/api";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  /** Server-paginated payload. */
  data: PagedResult<TData> | undefined;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;

  page: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;

  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;

  getRowId: (row: TData) => string;
  /** Rendered when at least one row is selected. */
  bulkActions?: (selectedIds: string[], clear: () => void) => React.ReactNode;
  /** Extra filter controls rendered in the toolbar. */
  toolbar?: React.ReactNode;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  /** Enables the CSV export button. */
  exportFileName?: string;
  onRowClick?: (row: TData) => void;
}

/**
 * Server-driven table used by every admin management page.
 *
 * Pagination, sorting, searching and filtering are all delegated to the server
 * (the row model is `getCoreRowModel` only) so pages stay correct at any data
 * volume — the client never assumes it holds the full set.
 */
export function DataTable<TData>({
  columns, data, isLoading, isFetching, isError, onRetry,
  page, onPageChange, pageSize = 20, onPageSizeChange,
  search, onSearchChange, searchPlaceholder = "Search…",
  sorting = [], onSortingChange,
  getRowId, bulkActions, toolbar,
  emptyTitle = "Nothing here yet", emptyDescription, emptyAction,
  exportFileName, onRowClick,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [searchInput, setSearchInput] = React.useState(search ?? "");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Push debounced input up to the query; instant-feel search without a request per keystroke.
  React.useEffect(() => {
    if (onSearchChange && debouncedSearch !== search) onSearchChange(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const selectable = !!bulkActions;

  const allColumns = React.useMemo<ColumnDef<TData, unknown>[]>(() => {
    if (!selectable) return columns;
    const selectCol: ColumnDef<TData, unknown> = {
      id: "__select",
      enableHiding: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox aria-label="Select row" checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)} />
        </div>
      ),
    };
    return [selectCol, ...columns];
  }, [columns, selectable]);

  const rows = data?.items ?? [];

  const table = useReactTable({
    data: rows,
    columns: allColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: data?.totalPages ?? -1,
    state: { rowSelection, columnVisibility, sorting },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      onSortingChange(typeof updater === "function" ? updater(sorting) : updater);
    },
    getRowId: (row) => getRowId(row),
    enableRowSelection: selectable,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const clearSelection = () => setRowSelection({});

  /** CSV export of the visible columns for the current page. */
  const exportCsv = () => {
    const visible = table.getVisibleLeafColumns().filter((c) => c.id !== "__select");
    const headers = visible.map((c) => {
      const h = c.columnDef.header;
      return typeof h === "string" ? h : c.id;
    });
    const body = table.getRowModel().rows.map((row) =>
      visible.map((c) => {
        const value = row.getValue(c.id);
        const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
        return `"${text.replace(/"/g, '""')}"`;
      })
    );
    const csv = [headers.map((h) => `"${h}"`).join(","), ...body.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFileName}-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-8 text-sm outline-none transition-colors focus:border-primary"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {toolbar}

        <div className="ml-auto flex items-center gap-2">
          {exportFileName && (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Columns3 size={14} /> <span className="hidden sm:inline">Columns</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem key={column.id} checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)} onSelect={(e) => e.preventDefault()}>
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectable && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
          <span className="text-sm font-semibold">{selectedIds.length} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions(selectedIds, clearSelection)}
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isError ? (
          <ErrorState onRetry={onRetry} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border">
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort() && !!onSortingChange;
                      const dir = header.column.getIsSorted();
                      return (
                        <th key={header.id} scope="col"
                          style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                          className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {header.isPlaceholder ? null : canSort ? (
                            <button onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {dir === "asc" ? <ArrowUp size={12} /> : dir === "desc" ? <ArrowDown size={12} />
                                : <ChevronsUpDown size={12} className="opacity-40" />}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {table.getVisibleLeafColumns().map((c) => (
                        <td key={c.id} className="px-4 py-3.5">
                          <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getVisibleLeafColumns().length}>
                      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(
                        "border-b border-border transition-colors last:border-0 hover:bg-muted/50",
                        row.getIsSelected() && "bg-primary/5",
                        onRowClick && "cursor-pointer"
                      )}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {data?.totalCount
              ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, data.totalCount)} of ${data.totalCount.toLocaleString()}`
              : isLoading ? "Loading…" : "No results"}
          </span>
          {isFetching && !isLoading && <Spinner className="h-3.5 w-3.5" />}
        </div>

        <div className="flex items-center gap-2">
          {onPageSizeChange && (
            <select value={pageSize} onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
              aria-label="Rows per page"
              className="h-8 rounded-lg border border-border bg-card pl-2 pr-6 text-xs outline-none focus:border-primary">
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
            </select>
          )}
          <Button variant="outline" size="sm" disabled={!data?.hasPreviousPage || page <= 1}
            onClick={() => onPageChange(page - 1)}>Previous</Button>
          <span className="px-1 text-sm text-muted-foreground">
            {page} / {Math.max(data?.totalPages ?? 1, 1)}
          </span>
          <Button variant="outline" size="sm" disabled={!data?.hasNextPage}
            onClick={() => onPageChange(page + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
