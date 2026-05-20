import { hasAny, hasAll, hasRole } from "../auth/perm";
import type { MenuItem } from "./menu.config";

function canSee(user: any, item: MenuItem) {
  // ưu tiên rule nào có
  if (item.roles && !hasRole(user, item.roles)) return false;
  if (item.allPerms && !hasAll(user, item.allPerms)) return false;
  if (item.anyPerms && !hasAny(user, item.anyPerms)) return false;
  return true;
}

export function filterMenu(user: any, items: MenuItem[]): MenuItem[] {
  return items
    .filter((it) => canSee(user, it))
    .map((it) => {
      if (!it.children?.length) return it;
      const children = filterMenu(user, it.children);
      // nếu group không còn con nào thì ẩn luôn
      if (children.length === 0 && !it.to) return null;
      return { ...it, children };
    })
    .filter(Boolean) as MenuItem[];
}
