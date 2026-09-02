import type { ReactNode } from "react";

export type ColumnValue = string | number | Date | null;

export type ColumnType = "text" | "date" | "category" | "action";

export interface Column<T> {
  key: string;
  header: string;
  type: ColumnType;
  getValue: (row: T) => ColumnValue;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

