import React, { useEffect, useMemo, useRef } from "react";
import { FiUpload } from "react-icons/fi";

type UploadValue = File | string | null;

type Props = {
  value: UploadValue;
  onChange: (v: UploadValue) => void;
  error?: string;
};

const UploadPicker = ({ value, onChange, error }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const openPicker = () => inputRef.current?.click();

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    // để chọn lại cùng 1 file vẫn trigger onChange
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    onChange(file);
  };

  // Derived preview url (KHÔNG setState trong effect)
  const previewUrl = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") return value; // url ảnh cũ
    return URL.createObjectURL(value); // file mới
  }, [value]);

  // Cleanup objectURL khi value là File
  useEffect(() => {
    if (!value || typeof value === "string") return;
    return () => {
      // previewUrl lúc này chắc chắn là objectURL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [value, previewUrl]);

  const fileLabel = useMemo(() => {
    if (!value) return null;
    if (typeof value === "string") return "Ảnh hiện tại";
    return value.name;
  }, [value]);

  return (
    <div>
      <div className="d-flex align-items-center gap-3">
        <button
          type="button"
          className="upload-drop position-relative"
          onClick={openPicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="upload-preview" />
          ) : (
            <FiUpload size={22} />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="d-none"
          onChange={handlePick}
        />
      </div>

      {error && <div className="text-danger mt-2">{error}</div>}
    </div>
  );
};

export default UploadPicker;
