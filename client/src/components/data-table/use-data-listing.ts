import { useMemo, useState } from "react";
import type { Column, ColumnValue } from "./types";
export type { Column as DataTableColumn } from "./types";

export interface UseDataListingOptions<T> {
  columns: Column<T>[];
  searchEnabled?: boolean;
  defaultSortKey?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface UseDataListingReturn<T> {
  rows: T[];
  totalRows: number;
  pageRows: T[];
  page: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions: number[];
  searchTerm: string;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  filters: Record<string, string | number>;
  setSearchTerm: (value: string) => void;
  setFilter: (key: string, value: string | number) => void;
  clearFilters: () => void;
  setSort: (key: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getFilterOptions: (key: string) => string[];
}

function compareValues(a: ColumnValue, b: ColumnValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  const aString = String(a).toLowerCase();
  const bString = String(b).toLowerCase();
  return aString.localeCompare(bString, "id");
}

export function useDataListing<T>(
  items: T[],
  options: UseDataListingOptions<T>
): UseDataListingReturn<T> {
  const {
    columns,
    searchEnabled = false,
    defaultSortKey = "created_at",
    defaultPageSize = 10,
    pageSizeOptions = [10, 25, 50]
  } = options;

  const searchableColumns = useMemo(
    () => columns.filter((column) => column.type === "text" && column.sortable),
    [columns]
  );

  const [searchTerm, setSearchTermState] = useState("");
  const [filters, setFilters] = useState<Record<string, string | number>>({});
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSortKey ? defaultSortKey : null
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  function setSearchTerm(value: string) {
    setSearchTermState(value);
    setPageState(1);
  }

  function setFilter(key: string, value: string | number) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "" || value === "all") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPageState(1);
  }

  function clearFilters() {
    setFilters({});
    setPageState(1);
  }

  function setSort(key: string) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPageState(1);
  }

  function setPage(nextPage: number) {
    setPageState(Math.max(1, nextPage));
  }

  function setPageSize(size: number) {
    setPageSizeState(size);
    setPageState(1);
  }

  const filteredRows = useMemo(() => {
    let result = items;

    const hasSearch = searchEnabled && searchTerm.trim().length > 0;
    if (hasSearch) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((row) =>
        searchableColumns.some((column) =>
          String(column.getValue(row) ?? "").toLowerCase().includes(query)
        )
      );
    }

    const activeFilterKeys = Object.keys(filters);
    if (activeFilterKeys.length > 0) {
      result = result.filter((row) =>
        activeFilterKeys.every((key) => {
          const column = columns.find((c) => c.key === key);
          if (!column) return true;
          const expected = filters[key];
          return String(column.getValue(row)) === String(expected);
        })
      );
    }

    return result;
  }, [items, columns, searchEnabled, searchTerm, filters, searchableColumns]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredRows;

    const sorted = [...filteredRows].sort((a, b) => {
      const result = compareValues(
        column.getValue(a),
        column.getValue(b)
      );
      return sortDir === "asc" ? result : -result;
    });

    return sorted;
  }, [filteredRows, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  const pageRows = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, pageCount]);

  function getFilterOptions(key: string): string[] {
    const column = columns.find((c) => c.key === key);
    if (!column) return [];
    const seen = new Set<string>();
    for (const row of items) {
      const value = column.getValue(row);
      if (value == null || value === "") continue;
      seen.add(String(value));
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "id"));
  }

  return {
    rows: sortedRows,
    totalRows: sortedRows.length,
    pageRows,
    page: Math.min(page, pageCount),
    pageCount,
    pageSize,
    pageSizeOptions,
    searchTerm,
    sortKey,
    sortDir,
    filters,
    setSearchTerm,
    setFilter,
    clearFilters,
    setSort,
    setPage,
    setPageSize,
    getFilterOptions
  };
}
