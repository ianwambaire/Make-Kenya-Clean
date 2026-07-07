export const IMAGE_UPLOAD_LIMITS = {
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxOriginalBytes: 12 * 1024 * 1024,
  maxProcessedBytes: 3 * 1024 * 1024,
  maxDimension: 1600,
  quality: 0.82,
};

const EXTENSIONS_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFile(file) {
  if (!file) return "Choose an image first.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > IMAGE_UPLOAD_LIMITS.maxOriginalBytes) {
    return `The original image is too large. Choose an image under ${formatBytes(IMAGE_UPLOAD_LIMITS.maxOriginalBytes)}.`;
  }
  if (!IMAGE_UPLOAD_LIMITS.acceptedTypes.includes(file.type)) {
    return "Unsupported image type. Use JPEG, PNG, or WebP.";
  }
  return "";
}

export function extensionForImage(file) {
  return EXTENSIONS_BY_TYPE[file?.type] || "jpg";
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected image could not be read."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function prepareImageForUpload(file) {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImageFromFile(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    largestSide > IMAGE_UPLOAD_LIMITS.maxDimension
      ? IMAGE_UPLOAD_LIMITS.maxDimension / largestSide
      : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot process images.");
  }

  context.drawImage(image, 0, 0, width, height);

  const outputType =
    file.type === "image/png" ? "image/png" : file.type || "image/jpeg";
  const blob = await canvasToBlob(
    canvas,
    outputType,
    IMAGE_UPLOAD_LIMITS.quality
  );

  if (blob.size > IMAGE_UPLOAD_LIMITS.maxProcessedBytes) {
    throw new Error(
      `The processed image is still too large (${formatBytes(blob.size)}). Try a smaller or clearer crop.`
    );
  }

  return {
    blob,
    extension: EXTENSIONS_BY_TYPE[outputType] || "jpg",
    originalBytes: file.size,
    processedBytes: blob.size,
    width,
    height,
  };
}
