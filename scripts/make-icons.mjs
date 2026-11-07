// Génère les icônes PWA « anneaux de gym » sans dépendance : zlib suffit à écrire un PNG.
// Relancer après modification : npm run icons
// Le dessin reprend la maquette retenue (grille de 108 unités, comme une icône adaptative Android).
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const CREME = [0xff, 0xf7, 0xee] // --bg (thème clair)
const BARRE = [0x2a, 0x1b, 0x12] // --ink
const SANGLE = [0x6e, 0x56, 0x46] // --muted
const ANNEAU = [0xa9, 0x42, 0x0e] // --accent (terracotta)

/** Distance d'un point à un segment. */
const distToSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/**
 * Couleur du motif en coordonnées de la grille 108×108.
 * Tout le motif tient dans un rayon de 41 unités autour du centre, donc dans la zone sûre
 * des icônes « maskable » (rayon 43,2) : Android peut le découper en rond sans rien couper.
 */
const sample = (x, y) => {
  for (const cx of [42, 66]) if (Math.abs(Math.hypot(x - cx, y - 65) - 11) < 3) return ANNEAU
  if (distToSeg(x, y, 24, 32, 84, 32) < 3.5) return BARRE
  for (const sx of [42, 66]) if (Math.abs(x - sx) < 1.5 && y > 32 && y < 54) return SANGLE
  return CREME
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

const png = (size) => {
  const SS = 4 // suréchantillonnage : lisse les bords des anneaux
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1)
    raw[row] = 0 // filtre None
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0]
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = sample(((x + (sx + 0.5) / SS) / size) * 108, ((y + (sy + 0.5) / SS) / size) * 108)
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]
        }
      const o = row + 1 + x * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS))
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // 8 bits par canal
  ihdr[9] = 2 // truecolor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, png(size))
  console.log(`public/icon-${size}.png`)
}
writeFileSync('public/favicon.png', png(48))
console.log('public/favicon.png')
