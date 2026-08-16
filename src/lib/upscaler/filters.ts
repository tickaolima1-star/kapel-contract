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

  const amount = Math.min(1.5, Math.max(0, factor));
  const rowStride = width * 4;

  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * rowStride;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOffset + x * 4;

      const upIdx = idx - rowStride;
      const downIdx = idx + rowStride;
      const leftIdx = idx - 4;
      const rightIdx = idx + 4;

      // Red channel
      const rCenter = src[idx];
      const rLaplacian = 4 * rCenter - (src[upIdx] + src[downIdx] + src[leftIdx] + src[rightIdx]);
      output[idx] = Math.min(255, Math.max(0, rCenter + amount * rLaplacian));

      // Green channel
      const gCenter = src[idx + 1];
      const gLaplacian = 4 * gCenter - (src[upIdx + 1] + src[downIdx + 1] + src[leftIdx + 1] + src[rightIdx + 1]);
      output[idx + 1] = Math.min(255, Math.max(0, gCenter + amount * gLaplacian));

      // Blue channel
      const bCenter = src[idx + 2];
      const bLaplacian = 4 * bCenter - (src[upIdx + 2] + src[downIdx + 2] + src[leftIdx + 2] + src[rightIdx + 2]);
      output[idx + 2] = Math.min(255, Math.max(0, bCenter + amount * bLaplacian));
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
