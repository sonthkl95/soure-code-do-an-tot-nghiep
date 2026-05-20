export interface Category {
    id: string,
    name: string,
    icon: string,
    slug: string,
    children?: Category[]
    brands: Brand[]
}

export interface Brand {
    id: string,
    name: string,
    slug: string,
    logo: {
        imageUrl: string,
        imagePublicId: string
    }
}
export type FilterDataType = "SELECT" | "BOOLEAN" | "MULTI_SELECT";

export interface FilterOptionDTO {
  id: string;
  label: string;
}

export interface FilterDTO {
  code: string;
  label: string;
  dataType: FilterDataType;
  displayOrder?: number;
  options: FilterOptionDTO[];
}

export interface CategoryFilterResponse {
  categoryId: string;
  filters: FilterDTO[];
}