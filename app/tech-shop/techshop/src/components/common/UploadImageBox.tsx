import React, { useEffect, useMemo, useRef } from "react";

type UploadItem = File | string;
type UploadSingle = UploadItem | null;
type UploadMultiple = UploadItem[];

type CommonProps = {
  error?: string;
  picker: boolean;
  Icon: React.ReactElement;
  message: string;
  disabled?: boolean;
  width: string;
  height: string;
  max?: number; // chỉ dùng khi multiple=true
};

type Props =
  | (CommonProps & {
      multiple?: false;
      value: UploadSingle;
      onChange: (v: UploadSingle) => void;
    })
  | (CommonProps & {
      multiple: true;
      value: UploadMultiple;
      onChange: (v: UploadMultiple) => void;
    });

const UploadImageBox = (props: Props) => {
  const {
    error,
    picker,
    Icon,
    message,
    width,
    height,
    disabled = false,
    max = 10,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const openPicker = () => inputRef.current?.click();

  const isMultiple = props.multiple === true;

  const currentList: UploadMultiple = useMemo(() => {
    if (!isMultiple) {
      const v = props.value;
      return v ? [v] : [];
    }
    return props.value ?? [];
  }, [isMultiple, props.value]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    if (isMultiple) {
      const next = [...currentList, ...arr].slice(0, max);
      (props as Extract<Props, { multiple: true }>).onChange(next);
    } else {
      (props as Extract<Props, { multiple?: false }>).onChange(arr[0] ?? null);
    }
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeAt = (idx: number) => {
    if (isMultiple) {
      const next = currentList.filter((_, i) => i !== idx);
      (props as Extract<Props, { multiple: true }>).onChange(next);
    } else {
      (props as Extract<Props, { multiple?: false }>).onChange(null);
    }
  };

  // previews: File => objectURL; string => url
  const previews = useMemo(() => {
    return currentList.map((item) => {
      if (typeof item === "string") return { src: item, isObjectUrl: false };
      const src = URL.createObjectURL(item);
      return { src, isObjectUrl: true };
    });
  }, [currentList]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        if (p.isObjectUrl) URL.revokeObjectURL(p.src);
      });
    };
  }, [previews]);

  const canAddMore = isMultiple ? currentList.length < max : currentList.length === 0;

  return (
    <div>
      <div
        className={isMultiple ? "upload-multi" : "d-flex align-items-center gap-3"}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop as any}
      >
        {/* MULTIPLE UI: grid + ô add */}
        {isMultiple ? (
          <>
            {previews.map((p, idx) => (
              <div
                key={`${p.src}-${idx}`}
                className="upload-item"
                style={{ width, height }}
              >
                <img src={p.src} alt="preview" className="upload-preview" />
                <button
                  type="button"
                  className="upload-remove"
                  onClick={() => removeAt(idx)}
                  aria-label="remove"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                type="button"
                className="upload-drop upload-drop--add"
                style={{ width, height,  borderColor: error ? "#ef4444" : "#cbd5e1" }}
                onClick={openPicker}
                disabled={disabled}
                onDrop={handleDrop as any}
              >
                <div className="upload-add-inner">
                  {Icon}
                  {message && <span>{message}</span>}
                </div>
              </button>
            )}
          </>
        ) : (
          /* SINGLE UI: 1 box */
          <button
            type="button"
            className="upload-drop position-relative"
            style={{ width, height, borderColor: error ? "#ef4444" : "#cbd5e1" }}
            onClick={openPicker}
            disabled={disabled}
            onDrop={handleDrop as any}
          >
            {previews[0]?.src ? (
              <>
                <img
                  src={previews[0].src}
                  alt="preview"
                  className="upload-preview"
                />
                <button
                  type="button"
                  disabled={disabled}
                  className="upload-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(0);
                  }}
                  aria-label="remove"
                >
                  ×
                </button>
              </>
            ) : (
              <div className="d-flex align-items-center flex-column gap-2" style={{color: "#9ca3af"}}>
                {Icon}
                {message && <span>{message}</span>}
              </div>
            )}
          </button>
        )}

        {/* phần info + button chọn ảnh (giữ behavior cũ: picker=false => hiện) */}
        {!picker && (
          <div className="d-flex flex-column">
            <button
              type="button"
              className="btn-sm w-fit btn-app btn-app--ghost"
              onClick={openPicker}
              disabled={!canAddMore}
            >
              Chọn ảnh từ thiết bị
            </button>

            <small className="text-muted mt-1">
              Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
              {isMultiple && (
                <> ({currentList.length}/{max})</>
              )}
            </small>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={isMultiple} // ✅ bật/tắt bằng props
        accept="image/jpeg,image/png,image/webp"
        className="d-none"
        onChange={handlePick}
      />

    </div>
  );
};

export default UploadImageBox;
