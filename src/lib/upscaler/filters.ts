export interface TileRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function calculateUpscaleDimensions(width: number, height: number, scale: 2 | 4): { newWidth: number; newHeight: number } {
  return {
    newWidth: Math.round(width * scale),
    newHeight: Math.round(height * scale),
  };
}

export function calculateTileGrid(width: number, height: number, tileSize: number = 1024, overlap: number = 16): TileRect[] {
  const tiles: TileRect[] = [];
  const step = tileSize - overlap;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const tileWidth = Math.min(tileSize, width - x);
      const tileHeight = Math.min(tileSize, height - y);
      tiles.push({ x, y, width: tileWidth, height: tileHeight });
    }
  }
  return tiles;
}

export function applyUnsharpMasking(imageData: ImageData, factor: number): ImageData {
  if (factor <= 0) return imageData;

  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const output = new Uint8ClampedArray(src.length);
  output.set(src);

  // Kernel de nitidez adaptativo (Laplaciano)
  const amount = Math.min(1.5, Math.max(0, factor));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const up = src[((y - 1) * width + x) * 4 + c];
        const down = src[((y + 1) * width + x) * 4 + c];
        const left = src[(y * width + (x - 1)) * 4 + c];
        const right = src[(y * width + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (up + down + left + right);
        const sharpened = center + amount * laplacian;
        output[idx + c] = Math.min(255, Math.max(0, sharpened));
      }
      output[idx + 3] = src[idx + 3]; // Alpha channel
    }
  }

  return {
    width,
    height,
    data: output,
  } as unknown as ImageData;
}

export function applyDenoiseFilter(imageData: ImageData, radius: number): ImageData {
  if (radius <= 0) return imageData;
  return imageData;
}
