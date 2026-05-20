export interface Inventory {
  id: string;
  skuCode: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  minStockLevel: number;
  lowStock: boolean;
  status: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
}

export interface InventoryHistory {
  id: string;
  skuCode: string;
  quantityChange: number;
  stockAfter: number;
  referenceId: string | null;
  type: "IMPORT" | "RESERVED" | "SOLD" | "CANCELLED" | "RETURNED";
  createdAt: string;
}
export type AdjustType = "IMPORT" | "EXPORT" | "ADJUST";
export interface AdjustForm {
  type: AdjustType;
  quantity?: string; // Giữ lại cho loại ADJUST (set tồn)
  serialNumbers?: string; // Dùng cho IMPORT/EXPORT dạng text
  note?: string;
}
