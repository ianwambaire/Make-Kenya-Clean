import { useEffect, useMemo } from "react";
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

  return (
    <div className="form-group photo-uploader">
      <label htmlFor={id}>{label}</label>

      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required}
        onChange={(event) =>
          onChange(event.target.files?.[0] || null)
        }
      />

      {file && (
        <div className="photo-upload-meta" aria-live="polite">
          <span>{file.name}</span>
          <span>{formatBytes(file.size)}</span>
        </div>
      )}

      {validationMessage && (
        <p className="form-message error-message">
          {validationMessage}
        </p>
      )}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Selected upload preview"
          className="photo-preview"
        />
      )}

      <small className="form-hint">{hint}</small>
    </div>
  );
}
