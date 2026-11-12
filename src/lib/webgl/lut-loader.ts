/**
 * Parses .cube LUT files and returns 3D texture data
 */

export interface LUTData {
  size: number;
  data: Float32Array;
}

export async function loadCubeLUT(url: string): Promise<LUTData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load LUT from ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseCubeLUT(text);
}

export function parseCubeLUT(text: string): LUTData {
  const lines = text.split('\n');
  let size = 0;
  const dataPoints: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue;
    
    // Parse LUT size
    if (trimmed.startsWith('LUT_3D_SIZE')) {
      size = parseInt(trimmed.split(/\s+/)[1], 10);
      continue;
    }
    
    // Skip other metadata
    if (trimmed.startsWith('TITLE') || 
        trimmed.startsWith('DOMAIN_') ||
        trimmed.startsWith('LUT_1D_SIZE')) {
      continue;
    }
    
    // Parse RGB data points
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        dataPoints.push(r, g, b);
      }
    }
  }

  if (size === 0) {
    const numPoints = dataPoints.length / 3;
    size = Math.round(Math.pow(numPoints, 1/3));
  }

  const expectedSize = size * size * size * 3;
  if (dataPoints.length !== expectedSize) {
    console.warn(`LUT data size mismatch: expected ${expectedSize}, got ${dataPoints.length}`);
  }

  return {
    size,
    data: new Float32Array(dataPoints),
  };
}

export function createIdentityLUT(size = 8): LUTData {
  const data = new Float32Array(size * size * size * 3);
  let idx = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        data[idx++] = r / (size - 1);
        data[idx++] = g / (size - 1);
        data[idx++] = b / (size - 1);
      }
    }
  }
  return { size, data };
}

/**
 * Convert 3D LUT data to a 2D texture strip for WebGL compatibility
 * Arranges the 3D LUT as a horizontal strip of 2D slices
 */
export function lutToTextureStrip(lut: LUTData): { 
  width: number; 
  height: number; 
  data: Uint8Array 
} {
  const { size, data } = lut;
  const width = size * size;
  const height = size;
  const strip = new Uint8Array(width * height * 4);

  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        const lutIndex = (b * size * size + g * size + r) * 3;
        const stripIndex = (g * width + b * size + r) * 4;
        
        strip[stripIndex + 0] = Math.round(data[lutIndex + 0] * 255);
        strip[stripIndex + 1] = Math.round(data[lutIndex + 1] * 255);
        strip[stripIndex + 2] = Math.round(data[lutIndex + 2] * 255);
        strip[stripIndex + 3] = 255;
      }
    }
  }

  return { width, height, data: strip };
}
