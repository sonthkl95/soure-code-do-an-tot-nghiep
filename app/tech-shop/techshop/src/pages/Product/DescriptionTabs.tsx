import { Controller, useFormContext } from 'react-hook-form';
import type { ProductFormUI } from '../../types/product.type';
import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
const DescriptionTabs = ({updating}: {updating: boolean}) => {
    const { register, control, formState: { errors } } = useFormContext<ProductFormUI>();
    const editorRef = useRef(null);
    return (
        <div className='px-4'>
            <div>
                <label htmlFor='shortDescription' className='form-label'>Mô tả ngắn<span className="text-danger">*</span></label>
                <textarea {...register("shortDescription", {
                    required: {
                        value: true,
                        message: "Mô tả ngắn không được để trống."
                    }
                })} id="shortDescription" rows={3} className='form-control' placeholder='Mô tả tóm tắt sản phẩm...' />
                {errors.shortDescription && <span className='form-message-error'>{errors.shortDescription?.message}</span>}
            </div>
            <div className='mt-3'>
                <label htmlFor="description" className='form-label'>Mổ tả chi tiết: <span className="text-danger">*</span></label>
                <Controller
                    name="description"
                    control={control}
                    rules={{ required: "Vui lòng nhập mô tả" }}
                    render={({ field, fieldState }) => (
                        <>
                            <Editor
                                id='description'
                                disabled={updating}
                                apiKey={import.meta.env.VITE_API_KEY_TINY ?? ""}
                                value={field.value || ""}
                                onEditorChange={(content) => field.onChange(content)}
                                // đừng truyền field.onChange trực tiếp vào prop onChange của Editor
                                init={{ height: 300, menubar: false }}
                            />
                            {fieldState.error && <p className="text-danger">{fieldState.error.message}</p>}
                        </>
                    )}
                />
            </div>
        </div>
    )
}

export default DescriptionTabs