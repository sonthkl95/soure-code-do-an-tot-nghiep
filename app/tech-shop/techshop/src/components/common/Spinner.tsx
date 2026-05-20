import React from "react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "on-dark" | "danger";
  className?: string;
  "aria-label"?: string;
};

export default function Spinner({
  size = "md",
  tone = "default",
  className = "",
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  const toneClass =
    tone === "on-dark" ? "spinner--on-dark" : tone === "danger" ? "spinner--danger" : "";

  return (
    <span
      className={`spinner spinner--${size} ${toneClass} ${className}`}
      role="status"
      aria-label={ariaLabel}
    />
  );
}
