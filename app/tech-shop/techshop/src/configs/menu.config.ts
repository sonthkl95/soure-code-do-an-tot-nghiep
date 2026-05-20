export type MenuItem = {
  key: string;
  label: string;
  to?: string;
  icon?: React.ReactNode;
  children?: MenuItem[];

  // rule
  anyPerms?: string[];   // có 1 trong các quyền này là thấy
  allPerms?: string[];   // cần đủ tất cả
  roles?: string[];      // hoặc theo role
};

export const MENU: MenuItem[] = [
  {
    key: "dashboard",
    label: "Tổng quan",
    to: "/admin",
    anyPerms: ["DASHBOARD_VIEW"],
  },
  {
    key: "users",
    label: "Users",
    anyPerms: ["USER_VIEW", "USER_EDIT"],
    children: [
      { key: "user_list", label: "Danh sách", to: "/admin/users", anyPerms: ["USER_VIEW"] },
      { key: "user_roles", label: "Phân quyền", to: "/admin/users/roles", anyPerms: ["USER_EDIT"] },
    ],
  },
  {
    key: "settings",
    label: "System Settings",
    to: "/admin/settings",
    roles: ["ADMIN"], // chỉ admin thấy
  },
];
