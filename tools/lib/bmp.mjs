// Minimal decoder for the uncompressed Windows BMPs used by the original game
// (24-bit, plus 8-bit palettised and 32-bit for safety). Returns RGBA pixels.

export function decodeBmp(buf) {
  if (buf.toString('ascii', 0, 2) !== 'BM') throw new Error('not a BMP');
  const dataOffset = buf.readUInt32LE(10);
  const dibSize = buf.readUInt32LE(14);
  const width = buf.readInt32LE(18);
  const rawHeight = buf.readInt32LE(22);
  const bpp = buf.readUInt16LE(28);
  const compression = dibSize >= 40 ? buf.readUInt32LE(30) : 0;
  if (compression !== 0 && !(compression === 3 && bpp === 32)) {
    throw new Error(`unsupported BMP compression ${compression}`);
  }

  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  const stride = Math.floor((bpp * width + 31) / 32) * 4;

  let palette = null;
  if (bpp <= 8) {
    const used = dibSize >= 40 ? buf.readUInt32LE(46) : 0;
    const count = used || 1 << bpp;
    palette = [];
    const palStart = 14 + dibSize;
    for (let i = 0; i < count; i++) {
      const p = palStart + i * 4;
      palette.push([buf[p + 2], buf[p + 1], buf[p]]);
    }
  }

  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = dataOffset + (topDown ? y : height - 1 - y) * stride;
    for (let x = 0; x < width; x++) {
      let r, g, b;
      if (bpp === 24 || bpp === 32) {
        const p = srcRow + x * (bpp / 8);
        b = buf[p];
        g = buf[p + 1];
        r = buf[p + 2];
      } else if (bpp === 8) {
        [r, g, b] = palette[buf[srcRow + x]];
      } else if (bpp === 4) {
        const byte = buf[srcRow + (x >> 1)];
        [r, g, b] = palette[x & 1 ? byte & 0x0f : byte >> 4];
      } else {
        throw new Error(`unsupported BMP bit depth ${bpp}`);
      }
      const o = (y * width + x) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = 255;
    }
  }
  return { width, height, data: out };
}

// DirectDraw colour key used by the original: pure black is transparent.
export function applyBlackColorKey(rgba) {
  const d = rgba.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0) d[i + 3] = 0;
  }
  return rgba;
}
