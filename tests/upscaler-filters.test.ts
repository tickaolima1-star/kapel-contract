import { describe, it, expect } from 'vitest';
import {
  calculateUpscaleDimensions,
  calculateTileGrid,
  applyUnsharpMasking,
  applyDenoiseFilter,
} from '../src/lib/upscaler/filters';

describe('Upscaler Filters & Grid Engine', () => {
  it('deve calcular corretamente as dimensões de 2x e 4x', () => {
    expect(calculateUpscaleDimensions(800, 600, 2)).toEqual({ newWidth: 1600, newHeight: 1200 });
    expect(calculateUpscaleDimensions(800, 600, 4)).toEqual({ newWidth: 3200, newHeight: 2400 });
  });

  it('deve calcular a grade de blocos (tiles) para imagens grandes', () => {
    const tiles = calculateTileGrid(3000, 2000, 1024, 16);
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles[0]).toHaveProperty('x');
    expect(tiles[0]).toHaveProperty('y');
    expect(tiles[0]).toHaveProperty('width');
    expect(tiles[0]).toHaveProperty('height');
  });

  it('deve aplicar filtro de nitidez Unsharp Masking em ImageData sem alterar dimensões', () => {
    const mockImageData = {
      width: 10,
      height: 10,
      data: new Uint8ClampedArray(10 * 10 * 4).fill(128),
    } as unknown as ImageData;

    const result = applyUnsharpMasking(mockImageData, 0.5);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
    expect(result.data.length).toBe(400);
  });
});
