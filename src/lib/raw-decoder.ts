/**
 * Camera RAW and Apple HEIC Image Decoder
 * Extracts high-resolution previews from camera RAW files (Canon, Sony, Nikon, Fuji, Leica, DNG, etc.)
 * and decodes Apple HEIC/HEIF photos for real-time 3D LUT color grading.
 */

export const RAW_EXTENSIONS = [
  '.cr2', '.cr3',         // Canon
  '.arw', '.srf', '.sr2', // Sony
  '.nef', '.nrw',         // Nikon
  '.raf',                 // Fujifilm
  '.dng',                 // Adobe / Leica / Hasselblad / Mobile RAW
  '.orf',                 // Olympus / OM System
  '.rw2',                 // Panasonic Lumix
  '.pef',                 // Pentax
  '.3fr',                 // Hasselblad
  '.iiq',                 // Phase One
  '.heic', '.heif',       // Apple High Efficiency
];

export function isRawOrHeicFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    RAW_EXTENSIONS.some(ext => name.endsWith(ext)) ||
    file.type.includes('raw') ||
    file.type.includes('heic') ||
    file.type.includes('heif')
  );
}

export function getRawFormatName(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.cr2':
    case '.cr3':
      return 'Canon RAW';
    case '.arw':
    case '.srf':
    case '.sr2':
      return 'Sony Alpha RAW';
    case '.nef':
    case '.nrw':
      return 'Nikon RAW';
    case '.raf':
      return 'Fujifilm RAW';
    case '.dng':
      return 'Digital Negative (DNG)';
    case '.orf':
      return 'Olympus RAW';
    case '.rw2':
      return 'Panasonic Lumix RAW';
    case '.pef':
      return 'Pentax RAW';
    case '.heic':
    case '.heif':
      return 'Apple HEIC';
    default:
      return 'Camera RAW';
  }
}

interface JpegCandidate {
  offset: number;
  length: number;
  width: number;
  height: number;
  resolution: number;
  source: string;
}

/**
 * Inspects a JPEG header starting at `start` to check whether it is a standard
 * browser-decodable JPEG (8-bit Baseline DCT 0xC0 or Progressive DCT 0xC2)
 * and extracts its width and height.
 * 
 * IMPORTANT: Camera RAW files (such as Canon CR2) frequently compress raw Bayer
 * sensor data using Lossless JPEG (SOF3 / 0xC3). Browsers CANNOT decode SOF3
 * and will trigger img.onerror. This function strictly rejects 0xC3 and only
 * accepts browser-compatible 8-bit Baseline/Progressive JPEGs.
 */
function getJpegInfo(data: Uint8Array, start: number): { width: number; height: number; isBrowserCompatible: boolean } {
  const len = data.length;
  if (start < 0 || start >= len - 8) {
    return { width: 0, height: 0, isBrowserCompatible: false };
  }

  // Must begin with SOI (0xFF, 0xD8)
  if (data[start] !== 0xFF || data[start + 1] !== 0xD8) {
    return { width: 0, height: 0, isBrowserCompatible: false };
  }

  let pos = start + 2;
  let width = 0;
  let height = 0;
  let isBrowserCompatible = false;

  while (pos < len - 8) {
    if (data[pos] !== 0xFF) {
      pos++;
      continue;
    }

    while (pos < len && data[pos] === 0xFF) {
      pos++;
    }
    if (pos >= len) break;

    const marker = data[pos++];
    if (marker === 0xD9 || marker === 0xDA) break;
    if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) continue;

    if (pos + 2 > len) break;
    const segLen = (data[pos] << 8) | data[pos + 1];

    // SOF0 (0xC0, Baseline DCT) or SOF2 (0xC2, Progressive DCT)
    // We intentionally EXCLUDE 0xC3 (Lossless JPEG sensor Bayer stream)
    if ((marker === 0xC0 || marker === 0xC2) && pos + 8 <= len) {
      const precision = data[pos + 2];
      if (precision === 8) {
        height = (data[pos + 3] << 8) | data[pos + 4];
        width = (data[pos + 5] << 8) | data[pos + 6];
        isBrowserCompatible = true;
      }
    }

    pos += segLen;
  }

  return { width, height, isBrowserCompatible };
}

/**
 * Accurately finds the true End-of-Image (0xFF 0xD9) for a JPEG stream,
 * skipping entropy-encoded bytes and restart markers.
 */
function findTrueJpegEnd(data: Uint8Array, start: number): number {
  const len = data.length;
  let pos = start + 2;

  while (pos < len - 4) {
    if (data[pos] !== 0xFF) {
      pos++;
      continue;
    }

    while (pos < len && data[pos] === 0xFF) pos++;
    if (pos >= len) break;

    const marker = data[pos++];
    if (marker === 0xD9) return pos;
    if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7)) continue;

    if (pos + 2 > len) break;
    const segLen = (data[pos] << 8) | data[pos + 1];

    if (marker === 0xDA) {
      // Skip Start of Scan header
      pos += segLen;
      // Scan entropy data for genuine EOI (0xFF 0xD9)
      while (pos < len - 1) {
        if (data[pos] === 0xFF) {
          const next = data[pos + 1];
          if (next === 0xD9) {
            return pos + 2;
          }
          if (next === 0x00 || (next >= 0xD0 && next <= 0xD7)) {
            pos += 2;
            continue;
          }
        }
        pos++;
      }
      break;
    }

    pos += segLen;
  }

  return -1;
}

/**
 * Parse TIFF IFD entries (used by Canon CR2, Nikon NEF, Sony ARW, Adobe DNG, Olympus ORF, etc.)
 * Extracts exact JPEG offsets and byte counts specified by the camera firmware.
 */
function parseTiffCandidates(data: Uint8Array): JpegCandidate[] {
  const len = data.length;
  if (len < 16) return [];

  const isLE = data[0] === 0x49 && data[1] === 0x49; // 'II'
  const isBE = data[0] === 0x4D && data[1] === 0x4D; // 'MM'
  if (!isLE && !isBE) return [];

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const candidates: JpegCandidate[] = [];
  let ifdOffset = view.getUint32(4, isLE);

  // Traverse IFD chain (IFD0, IFD1, IFD2, IFD3, and SubIFDs)
  let ifdCount = 0;
  const visited = new Set<number>();

  while (ifdOffset > 0 && ifdOffset < len - 14 && ifdCount < 16 && !visited.has(ifdOffset)) {
    visited.add(ifdOffset);
    ifdCount++;

    const numEntries = view.getUint16(ifdOffset, isLE);
    let entryPos = ifdOffset + 2;

    let stripOffset = 0;
    let stripByteCount = 0;
    let jpegOffset = 0;
    let jpegLength = 0;
    let width = 0;
    let height = 0;
    const subIfds: number[] = [];

    for (let e = 0; e < numEntries; e++) {
      if (entryPos + 12 > len) break;
      const tag = view.getUint16(entryPos, isLE);
      const type = view.getUint16(entryPos + 2, isLE);
      const count = view.getUint32(entryPos + 4, isLE);

      let val = 0;
      if (type === 3) {
        val = view.getUint16(entryPos + 8, isLE);
      } else if (type === 4 || type === 13) {
        val = view.getUint32(entryPos + 8, isLE);
      }

      if (tag === 0x0100) width = val;
      if (tag === 0x0101) height = val;

      // Tag 0x0111: StripOffsets (Canon CR2 IFD1 preview offset)
      if (tag === 0x0111) {
        if (count === 1) stripOffset = val;
        else if (count > 1 && val < len - 4) stripOffset = view.getUint32(val, isLE);
      }

      // Tag 0x0117: StripByteCounts (Canon CR2 IFD1 preview byte count)
      if (tag === 0x0117) {
        if (count === 1) stripByteCount = val;
        else if (count > 1 && val < len - 4) stripByteCount = view.getUint32(val, isLE);
      }

      // Tag 0x0201: JPEGInterchangeFormat (Sony ARW, Nikon NEF, DNG thumbnail/preview)
      if (tag === 0x0201) jpegOffset = val;
      // Tag 0x0202: JPEGInterchangeFormatLength
      if (tag === 0x0202) jpegLength = val;

      // SubIFDs tag
      if (tag === 0x014A) {
        if (count === 1) subIfds.push(val);
        else if (count > 1 && val < len - 4) {
          for (let s = 0; s < Math.min(count, 6); s++) {
            subIfds.push(view.getUint32(val + s * 4, isLE));
          }
        }
      }

      entryPos += 12;
    }

    // Check candidate pointed by this IFD
    const targetOffset = jpegOffset || stripOffset;
    let targetLength = jpegLength || stripByteCount;

    if (targetOffset > 0 && targetOffset < len - 100) {
      if (data[targetOffset] === 0xFF && data[targetOffset + 1] === 0xD8) {
        const info = getJpegInfo(data, targetOffset);
        if (info.isBrowserCompatible && info.width > 0 && info.height > 0) {
          if (targetLength <= 0 || targetOffset + targetLength > len) {
            const calculatedEnd = findTrueJpegEnd(data, targetOffset);
            if (calculatedEnd > targetOffset) {
              targetLength = calculatedEnd - targetOffset;
            }
          }

          if (targetLength > 100) {
            candidates.push({
              offset: targetOffset,
              length: targetLength,
              width: info.width || width,
              height: info.height || height,
              resolution: (info.width || width) * (info.height || height),
              source: `TIFF-IFD#${ifdCount}`,
            });
          }
        }
      }
    }

    // Also queue SubIFDs
    for (const sub of subIfds) {
      if (sub > 0 && sub < len && !visited.has(sub)) {
        visited.add(sub);
      }
    }

    // Step to next IFD
    if (entryPos + 4 <= len) {
      ifdOffset = view.getUint32(entryPos, isLE);
    } else {
      break;
    }
  }

  return candidates;
}

/**
 * Parse Fujifilm RAF embedded preview JPEG (found at offset 84/0x54)
 */
function parseFujiRafCandidates(data: Uint8Array): JpegCandidate[] {
  const len = data.length;
  if (len < 120) return [];

  // Check header 'FUJIFILMCCD-RAW'
  const isFuji =
    data[0] === 0x46 &&
    data[1] === 0x55 &&
    data[2] === 0x4a &&
    data[3] === 0x49 &&
    data[4] === 0x46;

  if (!isFuji) return [];

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const candidates: JpegCandidate[] = [];

  // Embedded JPEG offset is at offset 84, length at offset 88 (Big Endian)
  const jpegOffset = view.getUint32(84, false);
  const jpegLength = view.getUint32(88, false);

  if (jpegOffset > 0 && jpegOffset < len && jpegLength > 100) {
    if (data[jpegOffset] === 0xFF && data[jpegOffset + 1] === 0xD8) {
      const info = getJpegInfo(data, jpegOffset);
      if (info.isBrowserCompatible) {
        candidates.push({
          offset: jpegOffset,
          length: Math.min(jpegLength, len - jpegOffset),
          width: info.width,
          height: info.height,
          resolution: info.width * info.height,
          source: 'Fuji-RAF-Header',
        });
      }
    }
  }

  return candidates;
}

/**
 * Parse Canon CR3 ISOBMFF boxes (looking for 'PRVW' or 'prvw' preview box)
 */
function parseCr3Candidates(data: Uint8Array): JpegCandidate[] {
  const len = data.length;
  if (len < 32) return [];

  // Check for 'ftyp' box and 'crx '
  const isCr3 =
    data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70 && // 'ftyp'
    data[8] === 0x63 && data[9] === 0x72 && data[10] === 0x78; // 'crx'

  if (!isCr3) return [];

  const candidates: JpegCandidate[] = [];
  let pos = 0;

  // Walk top-level boxes
  while (pos < len - 8) {
    const boxSize = (data[pos] << 24) | (data[pos + 1] << 16) | (data[pos + 2] << 8) | data[pos + 3];
    const boxType = String.fromCharCode(data[pos + 4], data[pos + 5], data[pos + 6], data[pos + 7]);

    if (boxSize <= 0 || pos + boxSize > len) break;

    // PRVW box contains embedded JPEG preview
    if (boxType.toLowerCase() === 'prvw' || boxType.toLowerCase() === 'thmb') {
      const boxData = data.subarray(pos + 8, pos + boxSize);
      // Search for 0xFF 0xD8 inside box
      for (let j = 0; j < boxData.length - 4; j++) {
        if (boxData[j] === 0xFF && boxData[j + 1] === 0xD8 && boxData[j + 2] === 0xFF) {
          const absOffset = pos + 8 + j;
          const info = getJpegInfo(data, absOffset);
          if (info.isBrowserCompatible) {
            const end = findTrueJpegEnd(data, absOffset);
            const actualLength = end > absOffset ? end - absOffset : boxSize - (8 + j);
            candidates.push({
              offset: absOffset,
              length: actualLength,
              width: info.width,
              height: info.height,
              resolution: info.width * info.height,
              source: `CR3-${boxType}`,
            });
          }
          break;
        }
      }
    }

    pos += boxSize;
  }

  return candidates;
}

/**
 * Universal byte-stream scanner fallback
 * Scans the file for all valid JPEG streams and strictly filters for
 * browser-compatible (8-bit Baseline 0xC0 or Progressive 0xC2) images.
 */
function universalScanCandidates(data: Uint8Array): JpegCandidate[] {
  const len = data.length;
  const candidates: JpegCandidate[] = [];
  let i = 0;

  while (i < len - 8) {
    if (data[i] === 0xFF && data[i + 1] === 0xD8 && data[i + 2] === 0xFF) {
      const start = i;
      const info = getJpegInfo(data, start);

      if (info.isBrowserCompatible && info.width > 0 && info.height > 0) {
        const end = findTrueJpegEnd(data, start);
        if (end > start) {
          candidates.push({
            offset: start,
            length: end - start,
            width: info.width,
            height: info.height,
            resolution: info.width * info.height,
            source: 'Universal-Scanner',
          });
          i = end;
          continue;
        }
      }
      i = start + 3;
    } else {
      i++;
    }
  }

  return candidates;
}

function loadImgFromBlob(blob: Blob, format: string): Promise<{ img: HTMLImageElement; url: string; format: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ img, url, format });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode image from blob (${format}).`));
    };
    img.src = url;
  });
}

/**
 * Decodes camera RAW or HEIC file to an HTMLImageElement
 */
export async function decodeCameraRawOrHeic(
  file: File
): Promise<{ img: HTMLImageElement; url: string; format: string }> {
  const name = file.name.toLowerCase();
  const format = getRawFormatName(file.name);

  // 1. Apple HEIC / HEIF
  if (name.endsWith('.heic') || name.endsWith('.heif') || file.type.includes('heic') || file.type.includes('heif')) {
    try {
      const heic2any = (await import('heic2any')).default;
      const resultBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.96,
      });
      const blob = Array.isArray(resultBlob) ? resultBlob[0] : resultBlob;
      return await loadImgFromBlob(blob, 'Apple HEIC');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to decode HEIC photo: ${msg}`);
    }
  }

  // 2. Camera RAW formats (.CR2, .CR3, .ARW, .NEF, .RAF, .DNG, .ORF, .RW2, etc.)
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Aggregate candidate previews from all parsing strategies
  const allCandidates: JpegCandidate[] = [];

  // Strategy A: TIFF IFD tags (Canon CR2, Nikon NEF, Sony ARW, Adobe DNG, Olympus ORF, etc.)
  try {
    allCandidates.push(...parseTiffCandidates(uint8));
  } catch (e) {
    console.warn('TIFF IFD parser error:', e);
  }

  // Strategy B: Canon CR3 ISOBMFF boxes
  try {
    allCandidates.push(...parseCr3Candidates(uint8));
  } catch (e) {
    console.warn('CR3 box parser error:', e);
  }

  // Strategy C: Fujifilm RAF headers
  try {
    allCandidates.push(...parseFujiRafCandidates(uint8));
  } catch (e) {
    console.warn('Fuji RAF parser error:', e);
  }

  // Strategy D: Universal stream scanner (fallback)
  if (allCandidates.length === 0) {
    try {
      allCandidates.push(...universalScanCandidates(uint8));
    } catch (e) {
      console.warn('Universal scanner error:', e);
    }
  }

  if (allCandidates.length === 0) {
    throw new Error(
      `No browser-compatible preview image found in ${file.name}. Ensure the RAW file was saved with an embedded JPEG preview.`
    );
  }

  // Deduplicate candidates by offset
  const uniqueMap = new Map<number, JpegCandidate>();
  for (const c of allCandidates) {
    if (!uniqueMap.has(c.offset) || uniqueMap.get(c.offset)!.resolution < c.resolution) {
      uniqueMap.set(c.offset, c);
    }
  }

  // Sort candidates by resolution descending (largest full preview first, then medium preview, etc.)
  const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.resolution - a.resolution);

  // Try decoding each candidate in order of resolution (cascading fallback)
  let lastError: Error | null = null;
  for (const candidate of sorted) {
    try {
      const slice = uint8.subarray(candidate.offset, candidate.offset + candidate.length);
      const blob = new Blob([slice], { type: 'image/jpeg' });
      return await loadImgFromBlob(blob, format);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Candidate preview from ${candidate.source} (${candidate.width}x${candidate.height}) failed to decode, trying next...`);
    }
  }

  throw lastError || new Error(`Failed to decode any preview from ${file.name}.`);
}
