import { useMemo, useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'right';
  render?: (row: T) => string;
}

interface DataTableProps<T extends object> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T, index: number) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  rows,
  columns,
  rowKey,
  searchPlaceholder = 'Filter rows…',
  pageSize = 25,
  emptyMessage = 'No rows match your filters.',
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof T>(columns[0]?.key);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const matched = normalized
      ? rows.filter((row) =>
          columns.some((column) => {
            const value = column.render
              ? column.render(row)
              : String(row[column.key] ?? '');
            return value.toLowerCase().includes(normalized);
          }),
        )
      : rows;

    return [...matched].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];

      if (typeof left === 'number' && typeof right === 'number') {
        return sortDirection === 'asc' ? left - right : right - left;
      }

      const leftText = String(left ?? '');
      const rightText = String(right ?? '');
      const result = leftText.localeCompare(rightText);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [columns, query, rows, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filteredRows.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setPage(0);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <Input
          type="search"
          className="max-w-sm"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {filteredRows.length.toLocaleString()} row{filteredRows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.align === 'right' ? 'text-right' : ''}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer hover:text-foreground transition-colors font-medium text-xs"
                    onClick={() => toggleSort(column.key)}
                  >
                    {column.label}
                    {sortKey === column.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, index) => (
                <TableRow key={rowKey(row, index)}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.key)}
                      className={column.align === 'right' ? 'text-right' : ''}
                    >
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 0}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
