import { api } from "../../lib/axios";

export type User = {
  userId: string;
  userName: string;
  permissions: string[];
};

export async function getMe() {
  const res = await api.get<User>("/auth/me");
  
  return res.data;
}

export async function logoutRequest() {
  await api.post("/api/auth/logout");
}
