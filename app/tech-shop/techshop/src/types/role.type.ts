export interface Role {
  id: string;
  code: string;
  description: string;
  name: string;
  quantity: number;
  quantityPermission: number;
}

export interface RoleCreateForm {
  code: string;
  name: string;
  description: string;
  subFunctions: string[];
}

export interface RoleForm {
  id: string;
  code: string;
  name: string;
  description: string;
  subFunctions: string[];
}


