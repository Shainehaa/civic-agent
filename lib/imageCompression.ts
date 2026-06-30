// Shared image compression helper. Resizes an image file down to a max
// dimension and re-encodes it as JPEG, returning a base64 data URL.
//
// Why this matters: phone camera photos can be several MB at full
// resolution. Once base64-encoded, that inflates further (~33% larger).
// We store images directly in Firestore documents, which have a hard
// 1 MiB per-document limit — so uncompressed photos can silently fail
// to save. Compressing client-side, before the image ever leaves the
// browser, keeps every upload comfortably under that limit.

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

export function fileToCompressedBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          // Canvas unsupported for some reason — fall back to the
          // original, uncompressed image rather than failing entirely.
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };

      img.onerror = () => reject(new Error("Could not load image."));
      img.src = reader.result as string;
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
