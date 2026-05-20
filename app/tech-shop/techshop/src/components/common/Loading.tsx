import React from "react";
import "../../styles/components/_loading.scss";

type Variant = "overlay" | "inline";

export type LoadingProps = {
  open?: boolean;
  variant?: Variant;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export default function Loading({
  open = true,
  variant = "overlay",
  title = "Đang tải…",
  subtitle = "Vui lòng đợi giây lát…",
  className,
  children,
}: LoadingProps) {
  if (!open) return <>{children}</>;

  const rootClass = ["ui-loading2", `ui-loading2--${variant}`, className].filter(Boolean).join(" ");

  const card = (
    <div className="card shadow-sm border-0 ui-loading2__card" role="status" aria-live="polite" aria-busy="true">
      <div className="card-body ui-loading2__body d-flex gap-3 align-items-center">
        {/* Dot chạy quanh card-body */}
        {/* <div className="ui-loading2__runner" aria-hidden="true">
          <span className="ui-loading2__runnerDot" />
        </div> */}

        {/* Spinner tròn */}
        <div className="ui-loading2__spinner" aria-hidden="true" />

        <div className="flex-grow-1">
          <div className="fw-semibold ui-loading2__title">{title}</div>
          {subtitle ? <div className="small ui-loading2__subtitle">{subtitle}</div> : null}
        </div>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className={rootClass}>
        <div className="position-relative ui-loading2__wrap">
          {children}
          <div className="position-absolute top-0 start-0 w-100 h-100 ui-loading2__mask">
            <div className="d-flex justify-content-center align-items-center w-100 h-100 p-3">{card}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div className="d-flex justify-content-center align-items-center w-100 h-100 p-3">{card}</div>
    </div>
  );
}
