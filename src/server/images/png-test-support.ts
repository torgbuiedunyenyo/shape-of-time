import { deflateSync } from "node:zlib";

export function validPng(width: number, height: number, color: readonly [number, number, number]): Uint8Array {
  const rowLength = 1 + width * 3;
  const raw = Buffer.alloc(rowLength * height);
  for (let row = 0; row < height; row += 1) {
    const offset = row * rowLength;
    raw[offset] = 0;
    for (let column = 0; column < width; column += 1) {
      const pixel = offset + 1 + column * 3;
      raw[pixel] = color[0];
      raw[pixel + 1] = color[1];
      raw[pixel + 2] = color[2];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function pngWithoutImageData(width: number, height: number): Uint8Array {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function pngWithTrailingCompressedByte(width: number, height: number): Uint8Array {
  const original = validPng(width, height, [7, 11, 13]);
  const idatOffset = 33;
  const idatLength = Buffer.from(original).readUInt32BE(idatOffset);
  const idatDataStart = idatOffset + 8;
  const idatDataEnd = idatDataStart + idatLength;
  const compressed = Buffer.concat([Buffer.from(original.subarray(idatDataStart, idatDataEnd)), Buffer.from([0])]);
  return Buffer.concat([
    Buffer.from(original.subarray(0, idatOffset)),
    chunk("IDAT", compressed),
    Buffer.from(original.subarray(idatDataEnd + 4)),
  ]);
}

export function pngWithReservedBitChunk(width: number, height: number): Uint8Array {
  const original = validPng(width, height, [7, 11, 13]);
  const afterHeader = 33;
  return Buffer.concat([
    Buffer.from(original.subarray(0, afterHeader)),
    chunk("abca", Buffer.alloc(0)),
    Buffer.from(original.subarray(afterHeader)),
  ]);
}

export function pngWithTransparencyAfterImageData(width: number, height: number): Uint8Array {
  const original = validPng(width, height, [7, 11, 13]);
  const idatOffset = 33;
  const idatLength = Buffer.from(original).readUInt32BE(idatOffset);
  const afterImageData = idatOffset + 12 + idatLength;
  return Buffer.concat([
    Buffer.from(original.subarray(0, afterImageData)),
    chunk("tRNS", Buffer.alloc(0)),
    Buffer.from(original.subarray(afterImageData)),
  ]);
}

export function transparentRgbaPng(width: number, height: number): Uint8Array {
  const rowLength = 1 + width * 4;
  const raw = Buffer.alloc(rowLength * height);
  for (let row = 0; row < height; row += 1) {
    const offset = row * rowLength;
    raw[offset] = 0;
    for (let column = 0; column < width; column += 1) {
      const pixel = offset + 1 + column * 4;
      raw[pixel] = 7;
      raw[pixel + 1] = 11;
      raw[pixel + 2] = 13;
      raw[pixel + 3] = 0;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function indexedPngWithDuplicatePalette(width: number, height: number): Uint8Array {
  const rowLength = 1 + width;
  const raw = Buffer.alloc(rowLength * height);
  for (let row = 0; row < height; row += 1) raw[row * rowLength] = 0;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 3, 0, 0, 0], 8);
  const palette = Buffer.from([17, 19, 23]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("PLTE", palette),
    chunk("PLTE", palette),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function indexedPngWithOversizedPalette(width: number, height: number): Uint8Array {
  return indexedPng(width, height, 1, [
    [17, 19, 23],
    [29, 31, 37],
    [41, 43, 47],
  ], 0);
}

export function indexedPngWithOutOfRangeSample(width: number, height: number): Uint8Array {
  return indexedPng(width, height, 2, [
    [17, 19, 23],
    [29, 31, 37],
  ], 3);
}

function indexedPng(
  width: number,
  height: number,
  bitDepth: 1 | 2 | 4 | 8,
  palette: readonly (readonly [number, number, number])[],
  sample: number,
): Uint8Array {
  const rowBytes = Math.ceil((width * bitDepth) / 8);
  const rowLength = 1 + rowBytes;
  const raw = Buffer.alloc(rowLength * height);
  const samplesPerByte = 8 / bitDepth;
  const sampleMask = (1 << bitDepth) - 1;
  for (let row = 0; row < height; row += 1) {
    const offset = row * rowLength;
    raw[offset] = 0;
    for (let column = 0; column < width; column += 1) {
      const byteIndex = offset + 1 + Math.floor(column / samplesPerByte);
      const shift = 8 - bitDepth * ((column % samplesPerByte) + 1);
      raw[byteIndex] = raw[byteIndex]! | ((sample & sampleMask) << shift);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([bitDepth, 3, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("PLTE", Buffer.from(palette.flat())),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, "ascii");
  const result = Buffer.alloc(12 + data.byteLength);
  result.writeUInt32BE(data.byteLength, 0);
  typeBytes.copy(result, 4);
  Buffer.from(data).copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([typeBytes, Buffer.from(data)])), 8 + data.byteLength);
  return result;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
