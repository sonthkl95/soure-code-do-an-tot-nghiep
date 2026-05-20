import type { SkuSelection } from "../types/product.type"; // chỉnh path

type SelectionMap = Record<string, string>; // groupId -> valueId

export const toSelectionMap = (selections: SkuSelection[]): SelectionMap =>
  selections.reduce<SelectionMap>((acc, s) => {
    acc[s.groupId] = s.valueId;
    return acc;
  }, {});

export const extractIdFromSegment = (seg: string) => {
  const idx = seg.lastIndexOf("i-");
  return idx >= 0 ? seg.slice(idx + 2) : null;
};

export const getLastCategoryId = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  return last ? extractIdFromSegment(last) : null;
};


const specKey = (code: string, value: string) => `${code}:${value}`;

export const getAllSpecs = (sp: URLSearchParams) => {
  return sp.getAll("spec");
}

export const setAllSpecs = (next: URLSearchParams, specs: string[]) => {
  next.delete("spec");
  specs.forEach((s) => next.append("spec", s));
}

export const hasSpec = (sp: URLSearchParams, code: string, value: string) => {
  return getAllSpecs(sp).includes(specKey(code, value));
}

// MULTI_SELECT: toggle từng option
export const toggleMulti = (
  sp: URLSearchParams,
  setSp: any,
  code: string,
  value: string
) => {
  const next = new URLSearchParams(sp);
  const key = specKey(code, value);
  const all = getAllSpecs(next);

  const specs = all.includes(key) ? all.filter((x) => x !== key) : [...all, key];
  setAllSpecs(next, specs);

  next.set("page", "0");
  setSp(next, { replace: true });
}

// SELECT: chỉ giữ 1 option cho code
export const getSingleSpec = (sp: URLSearchParams, code: string) => {
  const found = getAllSpecs(sp).find((x) => x.startsWith(`${code}:`));
  return found ? found.split(":")[1] : "";
}

export const setSingleSpec = (
  sp: URLSearchParams,
  setSp: any,
  code: string,
  value: string // "" => clear
) => {
  const next = new URLSearchParams(sp);
  const remain = getAllSpecs(next).filter((x) => !x.startsWith(`${code}:`));
  const specs = value ? [...remain, specKey(code, value)] : remain;
  setAllSpecs(next, specs);

  next.set("page", "0");
  setSp(next, { replace: true });
}

// BOOLEAN: lưu true/false theo dạng code:true | code:false
export const getBoolSpec = (sp: URLSearchParams, code: string): boolean | null => {
  const v = getSingleSpec(sp, code);
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

export const setBoolSpec = (
  sp: URLSearchParams,
  setSp: any,
  code: string,
  value: boolean
) => {
  setSingleSpec(sp, setSp, code, value ? "true" : "false");
}

export const clearSpecCode = (sp: URLSearchParams, setSp: any, code: string) => {
  setSingleSpec(sp, setSp, code, "");
}


export const setBrandParam = (sp: URLSearchParams, setSp: any, slug: string, id: string) => {
  const next = new URLSearchParams(sp);
  next.set("brand", `${slug}.i-${id}`);
  next.set("page", "0");
  setSp(next, { replace: true });
}

export const clearBrandParam = (sp: URLSearchParams, setSp: any) => {
  const next = new URLSearchParams(sp);
  next.delete("brand");
  next.set("page", "0");
  setSp(next, { replace: true });
}

export const setRating = (sp: URLSearchParams, setSp: any, r: number) => {
  const next = new URLSearchParams(sp);
  next.set("rating", String(r));
  next.set("page", "0");
  setSp(next, { replace: true });
}

export const clearRating = (sp: URLSearchParams, setSp: any) => {
  const next = new URLSearchParams(sp);
  next.delete("rating");
  next.set("page", "0");
  setSp(next, { replace: true });
}