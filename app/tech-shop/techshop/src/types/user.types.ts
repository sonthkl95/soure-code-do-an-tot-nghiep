export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    // role: Array<String>()
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  verifyEmail: boolean;
  createdAt: string;
}

// Định nghĩa kiểu dữ liệu gửi đi khi cập nhật
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UserSummary {
  id: string; // UUID
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  roleName: string;
  status: number;
  createdAt: string;
}

export interface UserDetail extends UserSummary {
  firstName: string;
  lastName: string;
  verifyEmail: boolean;
  updatedAt: string;
  // Bạn có thể thêm addresses: any[] nếu muốn hiển thị địa chỉ
}

export interface UserStatusRequest {
  status: number;
}
export interface Role {
  id: number;
  name: string;
  description?: string;
}

