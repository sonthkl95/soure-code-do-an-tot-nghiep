import type { Option } from "./select.type";

export interface Attribute {
  id: string;
  code: string;
  dataType: DataType;
  label: string;
  displayOrder: number;
  unit: string;
  value: string | number | boolean | Options[] | Options | null;
}

export interface AttributeDetail {
  id: string;
  code: string;
  dataType: DataType;
  label: string;
  displayOrder: number;
  unit: string;
  value: string | number | boolean | Options[] | Options | null;
  valueSelect: Option;
  valueMultiSelect: Option[];
}

export interface Options {
  id: string;
  value: string;
  label: string;
}
export type DataType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT";
export interface AttributeOptions {
  id: string;
  code: string;
  dataType: DataType;
  isRequired: boolean;
  isFilterable: boolean;
  label: string;
  displayOrder: number;
  unit: string;
  options?: Options[];
}

export interface SKU {
  key: string;
  id: string;
  image: File | null | string;
  skuCode: string;
  name: string;
  price: number;
  costPrice: number;
  originalPrice: number;
  active: boolean;
  discontinued?: boolean; // thêm
  discontinuedReason?: string;
  stock: number;
  attributes: Val[];
}

export interface CategoryDetail {
  id: string;
  slug?: string;
  name: string;
}
export interface ProductFormUI {
  id?: string;
  name: string;
  slug: string;
  brandId: string;
  category: CategoryDetail;
  warrantyMonth: number;
  shortDescription: string;
  description: string;
  hasVariants: boolean;
  price?: number;
  originalPrice?: number;
  costPrice?: number;
  stock?: number;
  bulk: {
    price: number;
    originalPrice: number;
    costPrice: number;
    stock: number;
  };
  image: File | null | string | Image;
  gallery: (File | string | Image)[] | null;
  attributes: Attribute[];
  skus: SKU[];
  attributeOptions: AttributeOptions[];
  skuOptions: Group[];
  draft?: {
    name: string;
    value: string;
  };
}

export interface Group {
  id: string;
  name: string;
  value: string;
  values: Val[];
}
export interface Val {
  groupId: string;
  id: string;
  value: string;
  active: boolean;
  isOldData?: boolean;
}

export interface SkuCreateForm {
  image: File | null | string;
  skuCode: string;
  name: string;
  price: number;
  costPrice: number;
  originalPrice: number;
  active: boolean;
  stock: number;
  attributes: Val[];
}
interface GroupCreateForm {
  id: string;
  name: string;
  values: Val[];
}
export interface ProductCreateForm {
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  specs: Attribute[];
  attributes: GroupCreateForm[];
  warrantyMonth: number;
  description: string;
  shortDescription: string;
  hasVariants: boolean;
  thumbnail: File;
  gallery: File[];
  skus: SkuCreateForm[];
}
export interface ProductUpdateForm {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  specs: Attribute[];
  attributes: GroupCreateForm[];
  warrantyMonth: number;
  description: string;
  shortDescription: string;
  hasVariants: boolean;
  thumbnail: File | null;
  gallery: File[] | null;
  skus: SkuUpdateForm[];
}

export interface SkuUpdateForm {
  id: string;
  image: File | null;
  skuCode: string;
  name: string;
  price: number;
  costPrice: number;
  originalPrice: number;
  active: boolean;
  attributes: Val[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  status: string;
}

export interface Image {
  imageUrl: string;
  imagePublicId: string;
}
export interface SkuDetail {
  id: string;
  spuId: string;
  skuCode: string;
  name: string;
  price: number;
  originalPrice: number;
  costPrice: number;
  thumbnail: Image;
  active: string;
  discontinued: string;
  discontinuedReason: string;
  stock: number;
  soldCount: number;
  selections: SkuSelect[];
}
export interface SkuSelect {
  groupId: string;
  valueId: string;
}
export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  category: {
    id: string;
    name: string;
  };
  brand: {
    id: string;
    name: string;
  };
  warrantyMonth: number;
  description: string;
  shortDescription: string;
  thumbnail: Image;
  gallery: Image[];
  status: string;
  avgRating: number;
  numOfReviews: number;
  minPrice: number;
  maxPrice: number;
  hasVariants: boolean;
  variantGroups: VariantGroup[];
  specs: AttributeDetail[];
  skus: SkuDetail[];
}

export interface DiscontinuedForm {
  discontinued: boolean;
  reason: string;
}
export interface OptionItem {
  id: string;
  value: string;
  active: boolean;
  deprecated: boolean;
}
export interface VariantGroup {
  id: string;
  label: string;
  values: OptionItem[];
}
