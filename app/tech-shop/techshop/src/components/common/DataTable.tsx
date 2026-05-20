import React from "react";
import type { Column, DataTableProps, TableAction } from "../../types/table.type";

function cellClass<T>(c: Column<T>) {
    return [
        c.align === "right" ? "is-right" : "",
        c.strong ? "is-strong" : "",
        c.muted ? "is-muted" : "",
    ]
        .filter(Boolean)
        .join(" ");
}

function actionBtnClass(a: TableAction<any>) {
    return `action-btn ${a.tone === "danger" ? "action-btn--danger" : ""}`;
}

export default function DataTable<T>({
    title,
    description,
    columns,
    rows,
    footerRow,
    actions,
    selection,
    emptyText = "No results.",
    loading = false,
}: DataTableProps<T>) {
    const hasActions = !!actions?.items?.length;
    const hasSelection = !!selection?.enabled;

    const enabledIdsOnPage = hasSelection
        ? rows
            .filter((r) => !(selection!.disabled?.(r) ?? false))
            .map(selection!.getRowId)
        : [];

    const selectedSet = new Set(selection?.selectedIds ?? []);
    const selectedCountOnPage = hasSelection
        ? enabledIdsOnPage.filter((id) => selectedSet.has(id)).length
        : 0;

    const allChecked = hasSelection && enabledIdsOnPage.length > 0 && selectedCountOnPage === enabledIdsOnPage.length;
    const indeterminate = hasSelection && selectedCountOnPage > 0 && selectedCountOnPage < enabledIdsOnPage.length;

    const finalColumns: Column<T>[] = [
        ...(hasSelection
            ? ([
                {
                    key: "__select__",
                    title: "", // header checkbox render separately
                    width: 44,
                    render: (row: T) => {
                        const id = selection!.getRowId(row);
                        const disabled = selection!.disabled?.(row) ?? false;
                        const checked = selectedSet.has(id);

                        return (
                            <label className="cb">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => selection!.onToggleRow(id)}
                                />
                                <span className="cb__box" />
                            </label>
                        );
                    },
                },
            ] as Column<T>[])
            : []),

        ...columns,

        ...(hasActions
            ? ([
                {
                    key: "__actions__",
                    title: actions?.title ?? "Actions",
                    align: "right",
                    width: actions?.width ?? 260,
                    render: (row: T) => (
                        <div className="table-actions">
                            {actions!.items.map((a) => {
                                if (a.visible && !a.visible(row)) return null;

                                const isDisabled = a.disabled?.(row) ?? false;
                                const labelNode = a.labelOption ? a.labelOption(row) : a.label;
                                return (
                                    <button
                                        key={a.key}
                                        type="button"
                                        className={actionBtnClass(a)}
                                        disabled={isDisabled}
                                        onClick={() => a.onClick(row)}
                                    >
                                        {labelNode}
                                    </button>
                                );
                            })}
                        </div>
                    ),
                },
            ] as Column<T>[])
            : []),
    ];

    return (
        <div className="table-card">
            {title && <div className="table-card__title">{title}</div>}

            <div className="table-responsive">
                <table className="table-app">
                    <thead>
                        <tr>
                            {finalColumns.map((c) => {
                                // custom header cell for selection column (checkbox)
                                if (c.key === "__select__" && hasSelection) {
                                    return (
                                        <th key={c.key} style={{ width: 44 }}>
                                            <label className="cb">
                                                <input
                                                    type="checkbox"
                                                    checked={allChecked}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = indeterminate;
                                                    }}
                                                    onChange={(e) => selection!.onToggleAll(enabledIdsOnPage, e.target.checked)}
                                                />
                                                <span className="cb__box" />
                                            </label>
                                        </th>
                                    );
                                }

                                return (
                                    <th
                                        key={c.key}
                                        className={c.align === "right" ? "is-right" : ""}
                                        style={{ width: c.width }}
                                    >
                                        {c.title}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ?

                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="placeholder-glow">
                                    {/* checkbox */}
                                    <td>
                                        <span className="placeholder rounded-2" style={{ width: 16, height: 16 }} />
                                    </td>

                                    {/* name */}
                                    <td>
                                        <span className="placeholder col-7"></span>
                                    </td>

                                    {/* code */}
                                    <td>
                                        <span className="placeholder col-4"></span>
                                    </td>

                                    {/* status */}
                                    <td>
                                        <span className="placeholder col-3"></span>
                                    </td>

                                    {/* actions */}
                                    <td className="text-end">
                                        <span className="placeholder rounded-3 me-2" style={{ width: 56, height: 34 }} />
                                        <span className="placeholder rounded-3 me-2" style={{ width: 56, height: 34 }} />
                                        <span className="placeholder rounded-3" style={{ width: 56, height: 34 }} />
                                    </td>
                                </tr>
                            ))

                            : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={finalColumns.length} className="table-empty">
                                        {emptyText}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, idx) => (
                                    <tr key={idx}>
                                        {finalColumns.map((c) => (
                                            <td key={c.key} className={cellClass(c)}>
                                                {c.render(row)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                    </tbody>

                    {footerRow && <tfoot>{footerRow}</tfoot>}
                </table>
            </div>

            {description && <div className="table-card__desc">{description}</div>}
        </div>
    );
}
