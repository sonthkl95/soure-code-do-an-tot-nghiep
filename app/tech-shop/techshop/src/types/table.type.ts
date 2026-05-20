import type { ReactElement, ReactNode } from "react";
import type React from "react";

export type Align = "left" | "right";

export type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => React.ReactNode;
  align?: Align;
  width?: number | string;
  strong?: boolean;
  muted?: boolean;
};

export type TableAction<T> = {
  key: string;
  label?: string | ReactNode;
  labelOption?: (row: T) => ReactNode;
  tone?: "default" | "danger";
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  onClick: (row: T) => void;
};

export type DataTableActions<T> = {
  title?: string; // default "Actions"
  width?: number | string; // default 260
  items: TableAction<T>[];
};

export type DataTableSelection<T> = {
  /** Bật selection hay không */
  enabled: boolean;

  /** Lấy id duy nhất cho row */
  getRowId: (row: T) => string;

  /** Danh sách id đang selected */
  selectedIds: string[];

  /** Toggle chọn 1 row */
  onToggleRow: (id: string) => void;

  /** Toggle chọn tất cả (trong page hiện tại) */
  onToggleAll: (idsOnPage: string[], nextChecked: boolean) => void;

  /** disable row selection theo điều kiện (optional) */
  disabled?: (row: T) => boolean;
};

export type DataTableProps<T> = {
  title?: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];

  footerRow?: React.ReactNode;
  actions?: DataTableActions<T>;

  selection?: DataTableSelection<T>;

  emptyText?: string;
  loading?: boolean;
};
