export const toSection = (fct: FunctionEntity[] | undefined | null): Section[] => {
  if (!fct) return [];

  return fct.map((f) => ({
    key: f.id,
    eventKey: f.id,
    id: f.id,
    title: f.name,
    description: f.description,
    order: f.sortOrder,
    options: (f.subFunctions ?? []).map((sf) => ({
      id: sf.id,
      label: sf.name,
      description: sf.description ?? "",
      order: sf.sortOrder,
    })),
  }));
};
export interface SubFunction {
  id: string;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}
export interface FunctionCreateForm {
  code: string;
  name: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  subFunctions: SubFunction[] | null;
}
export interface FunctionEntity {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  subFunctions: SubFunction[] | null;
}
export interface FunctionOption {
  id: string,
  name: string
}
export interface FunctionData {
  id: string;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  quantityPermission: number
}
