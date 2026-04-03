import { useState, useEffect } from "react";

// Module-level cache — persists across renders and component remounts
const colorCache = new Map<string, string>();

function extractVibrantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    if (colorCache.has(src)) {
      resolve(colorCache.get(src)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 80;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("100,100,120");
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // Weighted average biased toward saturated, mid-brightness pixels
      let totalWeight = 0;
      let wr = 0, wg = 0, wb = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max;

        // Ignore near-black and near-white
        if (brightness < 0.15 || brightness > 0.92) continue;

        const weight = saturation * brightness;
        totalWeight += weight;
        wr += r * weight;
        wg += g * weight;
        wb += b * weight;
      }

      let result: string;
      if (totalWeight === 0) {
        result = "100,100,120";
      } else {
        const r = Math.round((wr / totalWeight) * 255);
        const g = Math.round((wg / totalWeight) * 255);
        const b = Math.round((wb / totalWeight) * 255);
        result = `${r},${g},${b}`;
      }

      colorCache.set(src, result);
      resolve(result);
    };

    img.onerror = () => resolve("100,100,120");
    img.src = src;
  });
}

export function useStrikerColor(splashSrc: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(
    splashSrc && colorCache.has(splashSrc) ? colorCache.get(splashSrc)! : null,
  );

  useEffect(() => {
    if (!splashSrc) {
      setColor(null);
      return;
    }
    extractVibrantColor(splashSrc).then(setColor);
  }, [splashSrc]);

  return color;
}
