export interface SubFunctionCreateForm {
    code: string,
    name: string,
    description: string,
    functionId?: string | null
}

export interface SubFunctionEditForm {
    id: string,
    code: string,
    name: string,
    description: string,
    functionId?: string | null
}

export interface SubFunction {
    id: string,
    code: string,
    name: string,
    description: string,
    function?: {
        id: string,
        code: string;
        name: string
    }
}
export interface SubFunctionForm {
    id: string,
    code: string,
    name: string,
    description: string,
    functionId?: string | null
}