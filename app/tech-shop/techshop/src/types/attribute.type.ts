export interface Usage {
  usedInCategories: boolean;
  usedInProducts: boolean;
  categoryCount: number;
  productCount: number;
}

export interface Capabilities {
  canDelete: boolean;
  canChangeCode: boolean;
  canChangeDataType: boolean;
  canEditLabel: boolean;
  canToggleActive: boolean;

  canAddOptions: boolean;
  canEditOptionLabel: boolean;
  canToggleOptionActive: boolean;

  canRemoveOptions: boolean;
  canHardDeleteOptions: boolean;
}
export interface Attribute {
  id: string;
  code: string;
  label: string;
  active: boolean;
  dataType: string;
  deleted: boolean;
  usage: Usage;
  capabilities: Capabilities;
}

export interface AttributeOptionForm {
  attributeIds: string[];
  keyword: string;
}

export interface AttributeDetail {
  id: string;
  code: string;
  label: string;
  active: boolean;
  dataType: string;
  deleted: boolean;
  unit: string;
  options: OptionAttributeUI[];
  usage: Usage;
  capabilities: Capabilities;
}

export interface AttributeFormUI {
  id?: string;
  code?: string;
  label: string;
  dataType: string;
  options: OptionAttributeUI[];
  unit?: string | null;
  deleted?: boolean;
  active: boolean;
  usage?: Usage;
  capabilities?: Capabilities;
}

export interface OptionAttributeUI {
  id?: string;
  label: string;
  displayOrder: number;
  active: boolean;
  deprecated?: boolean;
}

export interface AttributeCreateForm {
  label: string;
  dataType: string;
  options?: OptionAttributeCreate[];
  unit?: string | null;
  active: boolean;
}

export interface OptionAttributeCreate {
  label: string;
  displayOrder: number;
  active: boolean;
}
export interface AttributeEditForm {
  id: string;
  code: string;
  label: string;
  dataType: string;
  active: boolean;
  options?: OptionAttributeUI[];
  unit?: string | null;
}
