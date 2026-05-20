export interface ILocationResponse {
  code: string;
  name: string;
}


export interface IUserAddressRequest {
  receiverName: string;
  phone: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  detailAddress: string;
  isDefault: boolean;
  type: 'HOME' | 'WORK'; // Khớp với Enum AddressType ở Backend
}

export interface IUserAddress {
  id: string; // UUID từ Backend
  receiverName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailAddress: string;
  isDefault: boolean;
  type: 'HOME' | 'WORK';
  createdAt: string;
  updatedAt: string;
}


export interface ICreateAddressRequest {
  receiverName: string;
  phone: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  detailAddress: string;
  isDefault: boolean;
  type: "HOME" | "WORK";
}

export interface IUpdateAddressRequest extends ICreateAddressRequest {
  id: string; // Bắt buộc có ID để biết cập nhật bản ghi nào
}

export type AddressIdRequest = string;

export interface ILocationResponse {
  code: string;
  name: string;
  codeName?: string;
  divisionType?: string;
}