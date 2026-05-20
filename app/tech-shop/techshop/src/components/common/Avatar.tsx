import React from "react";

export type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  src?: string;
  alt?: string;
  name?: string; // dùng để tạo initials
  size?: AvatarSize;
  badge?: "dot" | "check" | "none";
  badgeColor?: "dark" | "success" | "danger";
  className?: string;
};

function getInitials(name?: string) {
  if (!name) return "CN";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const initials = (first + last).toUpperCase();
  return initials || "CN";
}

function badgeBg(color: AvatarProps["badgeColor"]) {
  if (color === "success") return "#16a34a";
  if (color === "danger") return "#ef4444";
  return "#111827";
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  badge = "none",
  badgeColor = "dark",
  className = "",
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <span className={`avatar avatar--${size} ${className}`}>
      {src ? (
        <img className="avatar__img" src={src} alt={alt ?? name ?? "avatar"} />
      ) : (
        <span className="avatar__fallback" aria-label={name ?? "avatar"}>
          {initials}
        </span>
      )}

      {badge !== "none" && (
        <span
          className={`avatar__badge ${badge === "check" ? "avatar__badge--icon" : ""}`}
          style={{ background: badgeBg(badgeColor) }}
          aria-hidden
        >
          {badge === "check" && (
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M20 6L9 17l-5-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
    </span>
  );
}

/** Group */
type AvatarGroupProps = {
  size?: AvatarSize;
  max?: number; // số avatar hiển thị trước khi +N
  items: Array<{ src?: string; name?: string }>;
  showCountAsIcon?: boolean; // true => dấu "+"
  className?: string;
};

export function AvatarGroup({
  size = "md",
  max = 3,
  items,
  showCountAsIcon = false,
  className = "",
}: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const remaining = Math.max(items.length - visible.length, 0);

  return (
    <span className={`avatar-group avatar-group--${size} ${className}`}>
      {visible.map((it, idx) => (
        <Avatar key={idx} size={size} src={it.src} name={it.name} />
      ))}

      {remaining > 0 && (
        <span className={`avatar avatar--${size} ${showCountAsIcon ? "avatar--iconcount" : "avatar--count"}`}>
          {showCountAsIcon ? (
            <svg viewBox="0 0 24 24" fill="none" aria-label="more">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <span className="avatar__fallback">+{remaining}</span>
          )}
        </span>
      )}
    </span>
  );
}
