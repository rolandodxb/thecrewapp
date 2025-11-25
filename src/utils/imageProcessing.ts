export interface ProcessedImage {
  base64: string;
  width: number;
  height: number;
  size: number;
  hasTransparency: boolean;
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const removeWhiteBackground = async (
  base64Image: string,
  tolerance: number = 20
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isWhite = r > (255 - tolerance) &&
                       g > (255 - tolerance) &&
                       b > (255 - tolerance);

        if (isWhite) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};

export const processProductImage = async (
  file: File,
  removeBackground: boolean = true,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<ProcessedImage> => {
  try {
    let base64 = await convertImageToBase64(file);

    if (removeBackground) {
      base64 = await removeWhiteBackground(base64);
    }

    const resized = await resizeImage(base64, maxWidth, maxHeight);

    return resized;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

export const resizeImage = (
  base64Image: string,
  maxWidth: number,
  maxHeight: number
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const processedBase64 = canvas.toDataURL('image/png');
      const hasTransparency = checkImageTransparency(ctx, width, height);

      const sizeInBytes = Math.round((processedBase64.length * 3) / 4);

      resolve({
        base64: processedBase64,
        width: Math.round(width),
        height: Math.round(height),
        size: sizeInBytes,
        hasTransparency
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};

const checkImageTransparency = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): boolean => {
  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking transparency:', error);
    return false;
  }
};

export const validateImageSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateImageType = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
};

export const getImageDimensions = (base64Image: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};

export const compressImage = async (
  base64Image: string,
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Image;
  });
};
