export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  avatarPublicId: string;
  joinDate: string;
  walletBalance: number;
}
export interface UpdateProfile {
    firstName: string;
    lastName: string;
    phone: string;
    avatar: File | null;
}