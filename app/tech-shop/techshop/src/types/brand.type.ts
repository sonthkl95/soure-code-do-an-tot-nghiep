import type { CategoryOption } from "./category.type";


export interface Brand {
    id: string;
    name: string;
    categories: string[];
    status: StatusKey;
}

export interface BrandOption {
    id: string;
    name: string;
}

export interface BrandDetail {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: {
        imageUrl: string;
        imagePublicId: string;
    }
    status: StatusKey;
    categories: CategoryOption[],
    createdDate: string,
    updatedDate: string
}

export interface BrandCreateForm {
    name: string;
    slug: string;
    status: string;
    categories: string[]
}

export type StatusKey = "active" | "hidden";

export interface BrandEditFormUI {
    id: string;
    name: string;
    slug: string;
    status: StatusKey;
    description: string;
    logo: File | null | string;
    categories: string[]
}

export interface BrandCreateFormUI {
    name: string;
    slug: string;
    status: StatusKey;
    description: string;
    logo: File | null;
    categories: string[]
}