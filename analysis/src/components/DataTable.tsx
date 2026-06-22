import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

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
    <div className="data-table">
      <div className="data-table__toolbar">
        <input
          type="search"
          className="data-table__search"
          value={query}
          placeholder={searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <p className="data-table__meta">
          {filteredRows.length.toLocaleString()} row{filteredRows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="data-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={column.align === 'right' ? 'align-right' : ''}>
                  <button type="button" className="sort-button" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    {sortKey === column.key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{emptyMessage}</td>
              </tr>
            ) : (
              pageRows.map((row, index) => (
                <tr key={rowKey(row, index)}>
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={column.align === 'right' ? 'align-right' : ''}
                    >
                      {column.render ? column.render(row) : String(row[column.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="data-table__pagination">
        <button
          type="button"
          className="button button--ghost"
          disabled={currentPage === 0}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          type="button"
          className="button button--ghost"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
