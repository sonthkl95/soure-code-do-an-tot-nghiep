import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { ProductFormUI } from '../../types/product.type';
import Select from 'react-select';
import { selectStyles } from '../../features/data/select.data';
type Opt = { id: string, value: string; label: string };
const AttributeTabs = ({updating}: {updating: boolean}) => {
    const { control, formState: { errors } } = useFormContext<ProductFormUI>();
    const { fields } = useFieldArray({
        name: "attributes",
        control,
        keyName: "atId"
    })
    const attributesOptions = useWatch({ name: "attributeOptions", control })
    // const attributes = useWatch({ name: "attributes", control })
    const sortList = [...(attributesOptions ?? [])].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    return (
        <div className='px-4'>
            <div className="f-section">Thông số kỹ thuật</div>
            <div className='f-caption'>Các trường này thay đổi dựa trên danh mục bạn chọn ở tab "Thông tin chung".</div>
            {
                attributesOptions != null && attributesOptions.length > 0 ? (
                    <div className='row gy-2'>
                        {(sortList ?? []).map((opt) => {
                            const attrIndex = fields.findIndex(a => a.id === opt.id);
                            if (attrIndex === -1) return null;
                            if (opt.dataType === "SELECT" || opt.dataType === "MULTI_SELECT") {
                                const isMulti = opt.dataType === "MULTI_SELECT";

                                const selectOptions = (opt.options ?? []).map(o => ({ id: o.id, value: o.value, label: o.label }));
                                return (
                                    <Controller
                                        key={opt.id}
                                        control={control}
                                        name={`attributes.${attrIndex}.value`}
                                        rules={{
                                            required: opt.isRequired ? `${opt.label} là bắt buộc` : false,
                                        }}
                                        render={({ field, fieldState }) => {
                                            const isStringArray = (v: unknown): v is string[] =>
                                                Array.isArray(v) && v.every(x => typeof x === "string");

                                            const isString = (v: unknown): v is string => typeof v === "string";
                                            const values = isStringArray(field.value) ? field.value : [];
                                            const selectedForMulti: readonly Opt[] =
                                                selectOptions.filter(o => values.includes(o.value));
                                            const singleValue = isString(field.value) ? field.value : null;
                                            const selectedForSingle: Opt | null =
                                                singleValue ? (selectOptions.find(o => o.value === singleValue) ?? null) : null;
                                            return (
                                                <div className='col-6'>
                                                    <label htmlFor={opt.id} className='form-label'>{`${opt.label}:`} {opt.isRequired && (<span className='text-danger'>*</span>)}</label>
                                                    {isMulti ? (
                                                        <Select<Opt, true>
                                                            options={selectOptions}
                                                            value={(selectedForMulti ?? []) as readonly Opt[]}
                                                            placeholder={`Chọn ${opt.label}`}
                                                            isClearable
                                                            isSearchable
                                                            isDisabled={updating}
                                                            isMulti={true}
                                                            styles={selectStyles}
                                                            onChange={(selected) => {
                                                                const arr = selected.map(s => s.value);
                                                                field.onChange(arr);

                                                            }}
                                                        />
                                                    ) : (
                                                        <Select<Opt, false>
                                                            options={selectOptions}
                                                            value={(selectedForSingle) as Opt | null}
                                                            placeholder={`Chọn ${opt.label}`}
                                                            isClearable
                                                            isDisabled={updating}
                                                            isSearchable
                                                            isMulti={false}
                                                            styles={selectStyles}
                                                            onChange={(selected) => field.onChange(selected?.value ?? null)}
                                                        />
                                                    )}
                                                    {fieldState.error && (
                                                        <div className="form-message-error">{fieldState.error.message}</div>
                                                    )}
                                                </div>
                                            )
                                        }
                                        }
                                    />
                                )
                            }
                            else if (opt.dataType == "BOOLEAN") {
                                return (
                                    <div key={opt.id} className='col-6 d-flex flex-column'>
                                        <label htmlFor={opt.id} className='form-label'>{`${opt.label}:`} {opt.isRequired && (<span className='text-danger'>*</span>)}</label>
                                        <Controller
                                            control={control}
                                            name={`attributes.${attrIndex}.value`}
                                            rules={{
                                                validate: (v) => (!opt.isRequired ? true : !!v === true ? true : `${opt.label} là bắt buộc`),
                                            }}
                                            render={({ field, fieldState }) => (
                                                <input
                                                    id={opt.id}
                                                    className={`form-check-input ${fieldState.error ? "is-invalid" : ""}`}
                                                    type='checkbox'
                                                    checked={Boolean(field.value)}
                                                    onChange={(e) => {
                                                        const v = e.target.checked;
                                                        field.onChange(v);
                                                    }}
                                                />

                                            )}
                                        />
                                        {errors.attributes?.[attrIndex]?.value && (
                                            <span className="form-message-error">
                                                {String(errors.attributes[attrIndex]?.value?.message)}
                                            </span>
                                        )}
                                    </div>
                                )

                            } else {
                                return (
                                    <div key={opt.id} className='col-6 d-flex flex-column'>
                                        <label htmlFor={opt.id} className='form-label'>{`${opt.label}:`} {opt.isRequired && (<span className='text-danger'>*</span>)}</label>
                                        <Controller
                                            control={control}
                                            name={`attributes.${attrIndex}.value`}
                                            rules={{
                                                validate: (v) => (!opt.isRequired ? true : v != null && v != "" ? true : `${opt.label} là bắt buộc`),
                                            }}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <input
                                                        id={opt.id}
                                                        className={`form-control ${fieldState.error ? "is-invalid" : ""}`}
                                                        type={opt.dataType.toLocaleLowerCase()}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            field.onChange(v);
                                                        }}
                                                    />
                                                    {fieldState.error && <span className="form-message-error">{fieldState.error.message}</span>}
                                                </>
                                            )}
                                        />
                                    </div>
                                )
                            }
                        })}
                    </div>
                ) : (
                    <div className='d-flex align-items-center justify-content-center p-5 bg-neutral-100 rounded mt-4'>
                        <span>Vui lòng chọn danh mục trước.</span>
                    </div>
                )
            }
        </div>
    )
}

export default AttributeTabs