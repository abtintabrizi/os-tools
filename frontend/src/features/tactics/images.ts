const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const loading = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode();
        resolve(image);
      } catch {
        reject(new Error(`Could not decode ${src}`));
      }
    };
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  }).catch((error: unknown) => {
    imageCache.delete(src);
    throw error;
  });

  imageCache.set(src, loading);

  return loading;
}
