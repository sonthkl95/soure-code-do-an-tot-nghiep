
export interface Category {
  id: string;
  name: string;
  slug: string;
  level: number;
  active: boolean;
}

export interface CategoryDetail {
  id: string;
  name: string;
  parentName: string;
  parentId: string;
  active: boolean;
  icon: string;
  image: {
    imageUrl: string,
    imagePublicId: string
  };
  slug: string;
  attributeConfigs: AttributeConfigUI[]
}

export interface CategoryOption {
    id: string;
    name: string;
    level: number;
    parentId: string;
}
export interface OptionAttribute {
  id: string;
  value: string;
  label: string;
  active: boolean;
  deprecated: boolean;
  selected?: boolean;
}

export interface AttributeConfigUI {
  id: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
  label: string;
  code: string;
  dataType: string;
  unit: string;
  optionsValue: OptionAttribute[];
}

export interface CategoryEditFormUI {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  active: boolean;
  icon: string;
  attributeConfigs: AttributeConfigUI[];

  imageFile: File | null;
}
export interface CategoryCreateFormUI {
  name: string;
  slug: string;
  parentId: string;
  active: boolean;
  icon: string;
  attributeConfigs: AttributeConfigUI[];

  imageFile: File | null;
}


export interface AttributeConfig {
  id: string;
  code: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder: number;
  allowedOptionIds: string[];
}
export interface CategoryCreateForm {
  name: string;
  slug: string;
  parentId: string;
  active: boolean;
  icon: string;
  attributeConfigs: AttributeConfig[];

}

export interface CategoryUpdateForm {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  active: boolean;
  icon: string;
  attributeConfigs: AttributeConfig[];
}
