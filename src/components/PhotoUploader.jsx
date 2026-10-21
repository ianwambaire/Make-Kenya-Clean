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
  disabled = false,
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
    if (disabled || !fileList?.length) return;
    onChange(fileList[0]);
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
        role="group"
        aria-label="Photo selection"
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
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
              disabled={disabled}
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

      <button type="button" className="btn secondary-btn" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Camera size={18} /> {hasValidFile ? "Choose another photo" : "Take or choose a photo"}
      </button>

      {validationMessage && (
        <p className="form-message error-message" role="alert">
          <ImageOff size={14} />
          {validationMessage}
        </p>
      )}

      {hasValidFile && <small role="status">Photo selected and ready. It will be processed and compressed when you submit.</small>}

      <small className="form-hint">{hint}</small>
    </div>
  );
}
