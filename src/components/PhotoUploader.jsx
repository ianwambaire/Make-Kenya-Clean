import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImageOff, X } from "lucide-react";
import {
  formatBytes,
  validateImageFile,
} from "../utils/imageCompression";

export default function PhotoUploader({
  id,
  label,
  file,
  onChange,
  required = false,
  hint = "Use a JPEG, PNG, or WebP image. Avoid faces, documents, ID cards, and unrelated personal information.",
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const validationMessage = useMemo(
    () => (file ? validateImageFile(file) : ""),
    [file]
  );

  const previewUrl = useMemo(() => {
    if (!file || validationMessage) return "";
    return URL.createObjectURL(file);
  }, [file, validationMessage]);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFiles(fileList) {
    onChange(fileList?.[0] || null);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragOver(false);
    handleFiles(event.dataTransfer?.files);
  }

  function handleRemove(event) {
    event.stopPropagation();
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const hasValidFile = file && !validationMessage;

  return (
    <div className="form-group photo-uploader">
      <label htmlFor={id}>{label}</label>

      <div
        className={`photo-dropzone ${
          isDragOver ? "is-dragover" : ""
        } ${hasValidFile ? "has-file" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          required={required}
          className="photo-dropzone-input"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {previewUrl ? (
          <div className="photo-preview-wrap">
            <img
              src={previewUrl}
              alt="Selected upload preview"
              className="photo-preview"
            />

            <button
              type="button"
              className="photo-remove-btn"
              onClick={handleRemove}
              aria-label="Remove selected photo"
            >
              <X size={16} />
            </button>

            <div className="photo-upload-meta">
              <span>{file.name}</span>
              <span>{formatBytes(file.size)}</span>
            </div>
          </div>
        ) : (
          <div className="photo-dropzone-empty">
            <Camera size={26} />
            <p>
              <strong>Tap to take a photo</strong> or choose one
              from your gallery
            </p>
            <span>You can also drag a file here</span>
          </div>
        )}
      </div>

      {validationMessage && (
        <p className="form-message error-message">
          <ImageOff size={14} />
          {validationMessage}
        </p>
      )}

      <small className="form-hint">{hint}</small>
    </div>
  );
}