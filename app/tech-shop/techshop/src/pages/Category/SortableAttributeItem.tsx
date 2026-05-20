import { useFormContext, useWatch } from "react-hook-form";
import type { CategoryCreateFormUI } from "../../types/category.type";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MdDragIndicator } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import "./sortItem.scss"

const SortableAttributeItem = (props: { index: number; itemId: string, onDelete: () => void }) => {
    const { index, onDelete } = props;
    const { register, control, trigger, formState: { errors } } = useFormContext<CategoryCreateFormUI>();

    const item = useWatch({ name: `attributeConfigs.${index}`, control });
    const options = item?.optionsValue ?? [];
    console.log(item);
    
    const isSelect = item?.dataType === "SELECT" || item?.dataType === "MULTI_SELECT";
    const mustPick = isSelect;

    const pickedCount = options.filter((x) => x.selected).length;

    const err = (errors.attributeConfigs?.[index] as any)?.optionsValue?.message as string | undefined;
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        background: "white",
        display: "flex",
        alignItems: "center",
        gap: 12,
    };

    return (
        <div ref={setNodeRef} style={style} className="sort-item-card d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="btn-app btn-app--sm btn-app--outline me-2"
                        aria-label="Drag"
                        title="Kéo để sắp xếp"
                    >
                        <MdDragIndicator />
                    </button>
                    <div className="d-flex flex-column">
                        <span className="fw-bold">{item.label}</span>
                        <span className="f-caption">{`${item.code} | ${item.dataType}`}</span>
                    </div>
                </div>
                <div>
                    <div className="d-flex gap-2">
                        <label className="d-flex align-items-center gap-2">
                            <input
                                className="rounded"
                                type="checkbox"
                                {...register(`attributeConfigs.${index}.isRequired`)}
                            />
                            <span className="f-caption">
                                Bắt buộc
                            </span>
                        </label>

                        <label className="d-flex align-items-center gap-2">
                            <input
                                className="rounded"
                                type="checkbox"
                                {...register(`attributeConfigs.${index}.isFilterable`)}
                            />
                            <span className="f-caption">
                                Lọc
                            </span>
                        </label>
                        <div className="d-flex align-items-center justify-content-center">
                            <input
                                type="text"
                                className="f-caption text-center"
                                style={{ width: 20 }}
                                readOnly
                                {...register(`attributeConfigs.${index}.displayOrder`, {
                                    valueAsNumber: true,
                                })}
                            />
                        </div>
                        <button onClick={onDelete} className="btn-app btn-app--sm btn-app--icon btn-app--destructive">
                            <RiDeleteBin6Line />
                        </button>
                    </div>
                </div>
            </div>
            {isSelect && options.length > 0 && (
                <>
                    <div className="w-100 row">
                        {options.map((opt, indexOpt) => (
                            <div key={opt.value} className="col-2">
                                <label className="label-option-select">
                                    <input
                                        type="checkbox"
                                        {...register(`attributeConfigs.${index}.optionsValue.${indexOpt}.selected`, {
                                            onChange: async () => {
                                                // mỗi lần tick option -> chạy lại validate
                                                if (mustPick) {
                                                    await trigger(`attributeConfigs.${index}.optionsValue` as any);
                                                }
                                            },
                                        })}
                                    />
                                    <span className="f-caption">{opt.label}</span>
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* field ẩn để RHF có "nơi" gắn lỗi */}
                    {mustPick && (
                        <input
                            type="hidden"
                            {...register(`attributeConfigs.${index}.optionsValue` as any, {
                                validate: () => pickedCount > 0 || "Chọn ít nhất 1 option",
                            })}
                        />
                    )}

                    {/* show lỗi theo RHF */}
                    {mustPick && err && <div className="text-danger mt-1">{err}</div>}
                </>
            )}

        </div>
    );
}

export default SortableAttributeItem