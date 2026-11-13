/**
 * Zero-Dependency Binary JPEG EXIF Reader
 * Reads raw TIFF/EXIF tags from the first 128KB of any uploaded JPEG file.
 * Extracted tags:
 * - 0x010F Make
 * - 0x0110 Model
 * - 0x920A FocalLength
 * - 0x829D FNumber
 * - 0x829A ExposureTime
 * - 0x8827 PhotographicSensitivity (ISO)
 * - 0x9003 DateTimeOriginal / 0x0132 DateTime
 */

export interface ParsedExifMetadata {
  make?: string;
  model?: string;
  focalLength?: string;
  fNumber?: string;
  exposureTime?: string;
  iso?: string;
  dateTimeOriginal?: string;
  formattedSummary: string;
  formattedDate: string;
}

export const DEFAULT_FALLBACK_EXIF: ParsedExifMetadata = {
  make: 'LEICA',
  model: 'M6 TTL',
  focalLength: '50MM',
  fNumber: 'F/1.4',
  exposureTime: '1/250S',
  iso: 'ISO 400',
  formattedSummary: 'LEICA M6 TTL  ·  50MM SUMMILUX F/1.4  ·  1/250S',
  formattedDate: "'26 11 13",
};

export async function parseExifFromFile(file: File): Promise<ParsedExifMetadata> {
  try {
    const slice = file.slice(0, 131072); // Read first 128KB
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Check JPEG SOI marker (0xFFD8)
    if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
      return DEFAULT_FALLBACK_EXIF;
    }

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xffe1) {
        const length = view.getUint16(offset, false);
        if (offset + 8 >= view.byteLength) break;

        // Check ASCII "Exif\0\0"
        const isExif =
          view.getUint32(offset + 2, false) === 0x45786966 &&
          view.getUint16(offset + 6, false) === 0x0000;

        if (isExif) {
          return parseTiffHeader(view, offset + 8);
        }
        offset += length;
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }
  } catch {
    // Clean fallback if EXIF is stripped or non-JPEG
  }
  return DEFAULT_FALLBACK_EXIF;
}

function parseTiffHeader(view: DataView, tiffStart: number): ParsedExifMetadata {
  const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  const tags: Record<number, string | number> = {};

  const readIfd = (ifdOffset: number) => {
    const dirStart = tiffStart + ifdOffset;
    if (dirStart + 2 > view.byteLength) return;
    const numEntries = view.getUint16(dirStart, littleEndian);

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = dirStart + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tag = view.getUint16(entryOffset, littleEndian);
      const type = view.getUint16(entryOffset + 2, littleEndian);
      const count = view.getUint32(entryOffset + 4, littleEndian);
      const valueOffset = entryOffset + 8;

      if (type === 2 && count > 0) {
        const strPos =
          count <= 4
            ? valueOffset
            : tiffStart + view.getUint32(valueOffset, littleEndian);
        if (strPos + count <= view.byteLength) {
          let str = '';
          for (let c = 0; c < count - 1; c++) {
            const ch = view.getUint8(strPos + c);
            if (ch === 0) break;
            str += String.fromCharCode(ch);
          }
          tags[tag] = str.trim();
        }
      } else if (type === 3) {
        tags[tag] = view.getUint16(valueOffset, littleEndian);
      } else if (type === 4) {
        tags[tag] = view.getUint32(valueOffset, littleEndian);
      } else if (type === 5) {
        const ratPos = tiffStart + view.getUint32(valueOffset, littleEndian);
        if (ratPos + 8 <= view.byteLength) {
          const num = view.getUint32(ratPos, littleEndian);
          const den = view.getUint32(ratPos + 4, littleEndian);
          if (den !== 0) tags[tag] = num / den;
        }
      }
    }
  };

  readIfd(firstIfdOffset);
  if (typeof tags[0x8769] === 'number') {
    readIfd(tags[0x8769]); // Exif SubIFD
  }

  const make = typeof tags[0x010f] === 'string' ? tags[0x010f] : undefined;
  const model = typeof tags[0x0110] === 'string' ? tags[0x0110] : undefined;
  const focalLength =
    typeof tags[0x920a] === 'number' ? `${Math.round(tags[0x920a])}MM` : undefined;
  const fNumber =
    typeof tags[0x829d] === 'number' ? `F/${Number(tags[0x829d].toFixed(1))}` : undefined;
  const exposureTime =
    typeof tags[0x829a] === 'number'
      ? tags[0x829a] < 1
        ? `1/${Math.round(1 / tags[0x829a])}S`
        : `${tags[0x829a].toFixed(1)}S`
      : undefined;
  const iso = typeof tags[0x8827] === 'number' ? `ISO ${tags[0x8827]}` : undefined;

  let formattedDate = DEFAULT_FALLBACK_EXIF.formattedDate;
  const rawDate =
    typeof tags[0x9003] === 'string'
      ? tags[0x9003]
      : typeof tags[0x0132] === 'string'
      ? tags[0x0132]
      : undefined;

  if (rawDate && rawDate.length >= 10) {
    const parts = rawDate.slice(0, 10).split(/[: -]/);
    if (parts.length === 3) {
      formattedDate = `'${parts[0].slice(2)} ${parts[1]} ${parts[2]}`;
    }
  }

  const cameraLabel = [make, model].filter(Boolean).join(' ').toUpperCase();
  const summaryParts = [
    cameraLabel || 'LEICA M6 TTL',
    focalLength || '50MM',
    fNumber || 'F/1.4',
    exposureTime || '1/250S',
    iso,
  ].filter(Boolean);

  return {
    make,
    model,
    focalLength,
    fNumber,
    exposureTime,
    iso,
    dateTimeOriginal: rawDate,
    formattedSummary: summaryParts.join('  ·  '),
    formattedDate,
  };
}
