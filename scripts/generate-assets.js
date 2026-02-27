/**
 * Creates placeholder PNG assets for the Expo app:
 * - assets/icon.png (1024×1024)
 * - assets/adaptive-icon.png (1024×1024)
 * - assets/splash.png (1284×2778)
 * - assets/favicon.png (48×48)
 *
 * Uses only Node.js built-ins — no external dependencies.
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// ── Minimal PNG encoder ───────────────────────────────────────
function crc32(buf) {
  let crc = 0xffffffff;
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })();
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(buf) {
  let s1 = 1, s2 = 0;
  for (const b of buf) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
  return (s2 << 16) | s1;
}

function deflateRaw(data) {
  // Non-compressed DEFLATE blocks (type 00)
  const BSIZE = 65535;
  const blocks = [];
  for (let i = 0; i < data.length; i += BSIZE) {
    const chunk = data.subarray ? data.subarray(i, i + BSIZE) : data.slice(i, i + BSIZE);
    const last = (i + BSIZE >= data.length) ? 1 : 0;
    const len = chunk.length;
    const nlen = (~len) & 0xffff;
    const block = Buffer.alloc(5 + len);
    block[0] = last;
    block[1] = len & 0xff; block[2] = (len >> 8) & 0xff;
    block[3] = nlen & 0xff; block[4] = (nlen >> 8) & 0xff;
    Buffer.from(chunk).copy(block, 5);
    blocks.push(block);
  }
  return Buffer.concat(blocks);
}

function zlib(data) {
  const raw = deflateRaw(data);
  const adler = adler32(data);
  const header = Buffer.from([0x78, 0x01]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(adler, 0);
  return Buffer.concat([header, raw, checksum]);
}

function u32be(n) {
  const b = Buffer.alloc(4); b.writeUInt32BE(n, 0); return b;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf = u32be(data.length);
  const crc = crc32(Buffer.concat([typeBytes, data]));
  const crcBuf = u32be(crc);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function makePNG(width, height, r, g, b) {
  // Build raw scanlines (filter byte 0 + RGBA pixels)
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const base = y * (rowBytes + 1);
    raw[base] = 0; // filter=None
    for (let x = 0; x < width; x++) {
      const p = base + 1 + x * 4;
      raw[p] = r; raw[p+1] = g; raw[p+2] = b; raw[p+3] = 255;
    }
  }

  const IHDR_data = Buffer.alloc(13);
  IHDR_data.writeUInt32BE(width, 0);
  IHDR_data.writeUInt32BE(height, 4);
  IHDR_data[8] = 8;  // bit depth
  IHDR_data[9] = 2;  // color type RGB  -- use 6 for RGBA
  IHDR_data[9] = 6;  // RGBA
  IHDR_data[10] = 0; IHDR_data[11] = 0; IHDR_data[12] = 0;

  const compressed = zlib(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const IHDR = pngChunk('IHDR', IHDR_data);
  const IDAT = pngChunk('IDAT', compressed);
  const IEND = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, IHDR, IDAT, IEND]);
}

// ── Generate assets ───────────────────────────────────────────
const files = [
  { name: 'icon.png',          w: 1024, h: 1024, r: 108, g: 99,  b: 255 },  // #6C63FF
  { name: 'adaptive-icon.png', w: 1024, h: 1024, r: 108, g: 99,  b: 255 },
  { name: 'splash.png',        w: 1284, h: 2778, r: 26,  g: 16,  b: 68  },  // #1A1044
  { name: 'favicon.png',       w: 48,   h: 48,   r: 108, g: 99,  b: 255 },
];

for (const f of files) {
  const outPath = path.join(assetsDir, f.name);
  if (!fs.existsSync(outPath)) {
    const png = makePNG(f.w, f.h, f.r, f.g, f.b);
    fs.writeFileSync(outPath, png);
    console.log(`✅ Created ${f.name} (${f.w}×${f.h})`);
  } else {
    console.log(`⏭️  ${f.name} already exists — skipped`);
  }
}

console.log('\n🎨 All assets ready in client/assets/');
