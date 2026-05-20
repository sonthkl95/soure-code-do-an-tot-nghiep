export interface SuggestOption {
  id: string;
  label: string;
  slug: string;
  imageUrl: string;
}
export interface SkuSuggest {
  skuId: string;
  skuCode: string;
  label: string;
  price: number;
  originalPrice: number;
  imageUrl: string;
  productId: string;
  productSlug: string;
}

export interface Suggest {
  skus: SkuSuggest[];
  brands: SuggestOption[];
  categories: SuggestOption[];
}

export interface Slider {
  id: string;
  imageUrl: string;
  type: "product" | "sku";
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string; // HTML string
  thumbnail: ImageAsset;
  warrantyMonth: number;

  brand: Brand;

  /** Theo response: mảng category (thực chất giống breadcrumb/path) */
  category: CategoryNode[];

  minPrice: number;
  maxPrice: number;
  defaultSkuId: string;

  numberOfReviews: number;
  averageRating: number;

  gallery: ImageAsset[];

  specs: SpecItem[];

  variantGroups: VariantGroup[];

  skus: SkuItem[];
}

export interface ImageAsset {
  imageUrl: string;
  imagePublicId: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
}

export interface SpecItem {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  displayOrder: number;
}

export interface VariantGroup {
  id: string;
  label: string;
  values: VariantValue[];
}

export interface VariantValue {
  id: string;
  value: string;
  active: boolean;
}

export interface SkuItem {
  id: string;
  name: string;
  skuCode: string;

  price: number;
  originalPrice: number;

  selections: SkuSelection[];

  thumbnail: ImageAsset;
}

export interface SkuSelection {
  groupId: string;
  valueId: string;
}

export interface VariantValue {
  id: string;
  value: string; // VD: "Đen", "128GB"
}

export interface VariantGroup {
  id: string;
  label: string; // VD: "Màu sắc", "Dung lượng"
  values: VariantValue[];
}

// 2. Định nghĩa các kiểu con cho SKU
export interface SkuSelection {
  groupId: string;
  valueId: string;
}

export interface ProductSku {
  skuId: string;
  skuCode: string;
  name: string; // VD: "Iphone 17 Đen 256GB"
  price: number;
  originalPrice?: number;
  thumbnail?: {
    url: string;
    publicId?: string;
  };
  selections: SkuSelection[]; // Để map xem SKU này thuộc màu nào, size nào
  active?: boolean;
  status?: string;
}
export interface RelatedProductItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  brandName?: string;
  brandSlug?: string;
  rating: number;
  ratingCount: number;
  variantGroups?: VariantGroup[];
  skus?: ProductSku[];
}

export interface ProductSpecParam {
  key: string; // Ví dụ: "RAM", "Color", "Size"
  value: string; // Ví dụ: "16GB", "Red", "XL"
}
export interface ProductsQueryArgs {
  q?: string;
  brandIds?: string[];
  categoryId?: string;
  categoryAncestorId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sort?: string;
  rating?: number;
  minDiscount?: number;
  specs?: ProductSpecParam[];
}

export interface ImageRef {
  url: string;
}

export interface BrandRef {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ProductListItem {
  productId: string;
  name: string;
  slug: string;
  numberOfReviews: number;
  averageRating: number;
  thumbnail: ImageRef;
  minPrice: number; // sẽ parse từ 2.489E7 thành number
  maxPrice: number;
  brand: BrandRef;
  category: CategoryRef;
  variantGroups?: VariantGroup[];
  skus?: ProductSku[];
}

export interface PaginatedResponse<TItem, BTIem> {
  page: number;
  size: number;
  total: number;
  items: TItem[];
  brands: BTIem[];
  priceRange: {
    max: number;
    min: number;
  };
}

export interface BrandItem {
  name: string;
  count: number;
  id: string;
  slug: string;
}

export type ProductListResponse = PaginatedResponse<ProductListItem, BrandItem>;



export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  rating?: number;
  ratingCount?: number;
  isWishlisted: boolean;
  // NEW
  variantGroups?: VariantGroup[];
  skus?: ProductSku[];
};
