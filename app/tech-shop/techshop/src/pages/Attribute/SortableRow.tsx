import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFormContext, useWatch } from "react-hook-form";
import type { AttributeFormUI } from "../../types/attribute.type";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdDragIndicator } from "react-icons/md";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";


const SortableRow = ({ id, index, onRemove, onUpdate }: {
    id: string;
    index: number;
    onRemove: (index: number) => void,
    onUpdate: (value: Partial<AttributeFormUI["options"][number]>) => void;
 }) => {

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        cursor: "grab",
    };
    const { register, control, formState: { errors } } = useFormContext<AttributeFormUI>();
    const optionActive = useWatch({
        control,
        name: `options.${index}.active`
    })
    return (
        <tr ref={setNodeRef} style={style}>
            {/* Drag handle cell */}
            <td>
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-label="Kéo để sắp xếp"
                    className="d-flex align-items-center justify-content-center border-0 bg-transparent"
                    style={{
                        width: 32,
                        height: 32,
                        cursor: "grab",
                    }}
                >
                    <MdDragIndicator size={30} />
                </button>
            </td>

            <td scope="2">
                <input
                    className={`form-control form-control-sm ${errors.options?.[index]?.label && "is-invalid"}`}
                    {...register(`options.${index}.label` as const, {
                        validate: (v) => {
                            return (v?.trim()?.length ?? 0) > 0 || "Tên hiển thị không được để trống.";
                        },
                    })}
                />
            </td>

            <td>
                <div className="d-flex justify-content-center">
                    <button
                        type="button"
                        className="btn border-0 bg-transparent"
                        onClick={() => onUpdate({active: !optionActive})}
                    >
                        {optionActive ? <PiEyeThin /> : <PiEyeSlashThin />}
                    </button>
                    <button
                        type="button"
                        className="btn border-0 bg-transparent text-danger"
                        onClick={() => onRemove(index)}
                    >
                        <RiDeleteBin6Line />
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default SortableRow;
