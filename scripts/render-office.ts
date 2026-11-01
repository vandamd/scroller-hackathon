import { readFile, writeFile } from 'node:fs/promises'
import * as k from '../src/components/iso/iso-kit'

const floor = { x: 0, y: 0, w: 420, d: 300, r: 4 }
const projection = k.fitProjection(k.boxCorners(floor, -12, 115), 900, 470, { pad: 24, elevation: 34, azimuth: 48 })
const parts: { depth: number; svg: string }[] = []
let solidCount = 0
let tannerArt = ''
const at = (x: number, y: number, z: number) => k.iso([x, y, z], projection)
const path = (points: k.Point3[], closed = false) => k.pathOf(points.map(p => k.iso(p, projection)), closed)
function slab(x: number, y: number, z: number, w: number, d: number, h: number, tone: k.Tone = 'mid', r = 1.5, extra = '') {
  solidCount++
  parts.push({ depth: k.depthOf([x + w / 2, y + d / 2, z + h / 2], projection), svg: k.solidSvg(k.slabOf({ x, y, w, d, r }, z, h, projection, 4, 0.4), { tone }) + extra })
}
function cylinder(x: number, y: number, z: number, radius: number, h: number, tone: k.Tone = 'mid') {
  solidCount++
  parts.push({ depth: k.depthOf([x, y, z + h / 2], projection), svg: k.solidSvg(k.cylinder(x, y, radius, z, h, projection, 24, 0.3), { tone }) })
}
function furniture(centre: k.Point3, draw: () => void) {
  const start = parts.length
  draw()
  const pieces = parts.splice(start)
  parts.push({ depth: k.depthOf(centre, projection), svg: pieces.map(piece => piece.svg).join('') })
}
function animated(className: string, pivot: k.Point3, duration: number, delay: number, draw: () => void) {
  const start = parts.length
  draw()
  const [cx, cy] = k.iso(pivot, projection)
  for (const piece of parts.slice(start)) {
    piece.svg = `<g class="${className}" style="transform-origin:${cx}px ${cy}px;animation-duration:${duration}s;animation-delay:${delay}s">${piece.svg}</g>`
  }
}
function desk(x: number, y: number, name: string, role: string, active: boolean) {
  const start = parts.length
  const screenY = y + 18
  const screenZ = 88
  const face = k.sideMatrix([x + 18, screenY], screenZ, projection, 'left')
  for (const [dx, dy] of [[3, 3], [85, 3], [3, 51], [85, 51]]) slab(x + dx, y + dy, 1, 4, 4, 41, 'lo')
  slab(x + 2, y + 3, 32, 88, 4, 8, 'lo')
  slab(x, y, 42, 94, 60, 4, 'hi', 2)
  slab(x + 28, y + 4, 46, 27, 15, 2, 'mid')
  slab(x + 39, y + 7, 48, 5, 4, 8, 'mid')
  const screen = `<g transform="${face}"><rect x="3" y="3" width="43" height="25" rx="1.2" fill="${active ? '#2457F5' : '#343941'}"/><path d="M8 9h21M8 13h30M8 17h18M8 21h25" fill="none" stroke="${active ? '#C4D2FF' : '#9DA2AE'}" stroke-width="1.1"/><rect x="37" y="22" width="4" height="2" fill="#FFFFFF"/></g>`
  slab(x + 18, y + 12, 56, 49, 6, 32, 'hi', 2, screen)
  slab(x + 17, y + 34, 46, 48, 17, 1.5, 'mid')
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) slab(x + 20 + col * 5.7, y + 36 + row * 4.2, 47.5, 4.3, 2.9, 0.9, 'lo', 0.4)
  slab(x + 72, y + 35, 46, 15, 17, 0.5, 'lo')
  slab(x + 77, y + 39, 46.5, 6, 9, 2.5, 'mid', 2)
  slab(x + 72, y + 10, 46, 12, 12, 10, 'mid', 1)
  slab(x + 73, y + 11, 56, 10, 10, 0.7, 'lo', 1)
  cylinder(x + 31, y + 76, 1, 14, 3, 'lo')
  cylinder(x + 31, y + 76, 4, 3, 17, 'lo')
  cylinder(x + 31, y + 76, 21, 18, 4, 'mid')
  const rhythm = role === 'Taste keeper' ? [4.8, -1.2] : role === 'Finder' ? [6.1, -3.4] : [5.4, -2.6]
  animated('office-bot-body', [x + 31, y + 76, 25], rhythm[0], rhythm[1], () => {
    slab(x + 20, y + 65, 25, 22, 18, 18, 'mid', 5)
  })
  const rearPanel = `<g transform="${k.sideMatrix([x + 17, y + 84], 63, projection, 'left')}">
    <rect x="6" y="5" width="15" height="8" rx="1.5" fill="var(--anatomy-shade-2)" stroke="var(--anatomy-lo)" stroke-width=".5"/>
    <path d="M9 7h9M9 9h9M9 11h9" fill="none" stroke="var(--anatomy-mid)" stroke-width=".7" stroke-linecap="round"/>
    <circle cx="23.5" cy="6" r="1" fill="#2457F5"/>
    <circle cx="4" cy="4" r=".6" fill="var(--anatomy-mid)"/><circle cx="24" cy="13" r=".6" fill="var(--anatomy-mid)"/>
  </g>`
  animated(`office-bot-head${role === 'Taste keeper' ? ' office-taste-head' : ''}`, [x + 31, y + 74, 46], rhythm[0], rhythm[1], () => {
    slab(x + 17, y + 64, 46, 28, 20, 17, 'hi', 4, rearPanel)
  })
  animated('office-bot-arm', [x + 18, y + 67, 43], 1.6, rhythm[1], () => {
    slab(x + 15, y + 48, 40, 6, 20, 7, 'mid', 2)
  })
  animated('office-bot-arm', [x + 46, y + 67, 43], 1.6, rhythm[1] - 0.16, () => {
    slab(x + 43, y + 48, 40, 6, 20, 7, 'mid', 2)
  })
  slab(x + 2, y + 12, 46, 9, 14, 0.7, 'lo', 0.4)
  const head = at(x + 31, y + 74, 63)
  const labelX = head[0] - 12
  const labelY = head[1] - 39
  const label = `<g class="${role === 'Taste keeper' ? 'office-taste-label' : 'office-agent-label'}" font-family="Public Sans, sans-serif" font-weight="400" text-anchor="middle">
    <path d="M${labelX + 5} ${labelY + 16}L${head[0]} ${head[1] - 9}" fill="none" stroke="var(--anatomy-faint)" stroke-width=".6"/>
    <rect x="${labelX - 40}" y="${labelY - 16}" width="80" height="32" rx="8" fill="var(--anatomy-face)" stroke="var(--anatomy-faint)" stroke-width=".5"/>
    <text x="${labelX}" y="${labelY - 2}" fill="var(--anatomy-strong)" font-size="10.5">${name}</text>
    <text x="${labelX}" y="${labelY + 10}" fill="var(--anatomy-text)" font-size="8.5">${role}</text>
  </g>`
  parts.push({ depth: 900, svg: label })
  if (role === 'Taste keeper') {
    tannerArt = parts.slice(start).filter(piece => piece.depth !== 900).sort((a, b) => a.depth - b.depth).map(piece => piece.svg).join('')
  }
}

desk(35, 29, 'Tanner', 'Taste keeper', false)
desk(229, 29, 'Felix', 'Finder', true)
desk(154, 165, 'Eddie', 'Editor', false)

furniture([366.5, 49, 33], () => {
  slab(345, 30, 0, 43, 38, 66, 'mid', 2)
  for (let i = 0; i < 3; i++) {
    slab(346, 64, 4 + i * 20, 41, 4, 18, 'mid', 0.6)
    slab(361, 68, 14 + i * 20, 11, 2, 2, 'hi', 0.5)
  }
})

furniture([19, 177, 28], () => {
  const face = k.sideMatrix([30, 199], 59, projection, 'right')
  const rows = [18, 35, 52].map(bottom => (
    Array.from({ length: 6 }, (_, i) => {
      const height = [12, 14, 11, 15, 13, 12][i]
      return `<rect x="${6 + i * 5}" y="${bottom - height}" width="3.8" height="${height}" rx=".4" fill="var(--anatomy-paper)" stroke="var(--anatomy-mid)" stroke-width=".4"/>`
    }).join('')
  )).join('')
  const shelves = `<g transform="${face}">
    <rect x="3" y="3" width="38" height="50" rx=".8" fill="var(--anatomy-shade-0)" stroke="var(--anatomy-mid)" stroke-width=".5"/>
    ${rows}
    <path d="M3 19h38M3 36h38" fill="none" stroke="var(--anatomy-mid)" stroke-width="1"/>
  </g>`
  slab(8, 155, 3, 22, 44, 56, 'mid', 0.8, shelves)
  cylinder(20, 170, 59, 7, 1, 'lo')
  cylinder(20, 170, 60, 6, 9, 'mid')
  const root = at(20, 170, 69)
  const leaves = [
    [9, 169, 83], [13, 175, 92], [22, 170, 97], [31, 166, 88], [31, 178, 80],
  ].map(([x, y, z]) => {
    const tip = at(x, y, z)
    const base = at(20 + (x - 20) * 0.35, 170 + (y - 170) * 0.35, 69 + (z - 69) * 0.35)
    const mid = [(base[0] + tip[0]) / 2, (base[1] + tip[1]) / 2]
    const angle = Math.atan2(tip[1] - base[1], tip[0] - base[0])
    const dx = -Math.sin(angle) * 3
    const dy = Math.cos(angle) * 3
    return `<path d="M${root}Q${root[0]} ${base[1]} ${base}" fill="none" stroke="var(--anatomy-mid)" stroke-width=".6"/>
      <path d="M${base}Q${mid[0] + dx} ${mid[1] + dy} ${tip}Q${mid[0] - dx} ${mid[1] - dy} ${base}Z" fill="var(--anatomy-shade-1)" stroke="var(--anatomy-mid)" stroke-width=".5"/>`
  }).join('')
  parts.push({ depth: 0, svg: leaves })
})

furniture([355, 155, 22], () => {
  for (const x of [311, 394]) for (const y of [137, 167]) slab(x, y, 0, 4, 4, 6, 'lo', 0.5)
  slab(306, 132, 6, 98, 45, 10, 'mid', 4)
  slab(306, 132, 16, 98, 8, 26, 'mid', 4)
  slab(306, 138, 6, 10, 39, 26, 'mid', 3)
  for (const x of [316, 356]) {
    slab(x, 138, 24, 37, 6, 16, 'hi', 2.5)
    slab(x, 143, 16, 38, 32, 9, 'mid', 3)
  }
  const cushion = k.roundedPlan({ x: 0, y: 0, w: 15, d: 14, r: 3 }, 8)
    .map(([u, v]) => at(320 + u, 143 + v * 0.5, 39 - v))
  const throwOutline = path([[378, 147, 25.5], [391, 147, 25.5], [391, 175, 25.5], [391, 177, 9], [378, 177, 9], [378, 175, 25.5]], true)
  const throwStripes = [381, 384, 388].map(x => path([[x, 148, 25.7], [x, 175, 25.7], [x, 177.2, 10]])).join('')
  parts.push({ depth: 0, svg: `<path d="${throwOutline}" fill="var(--anatomy-shade-2)" stroke="var(--anatomy-mid)" stroke-width=".6" stroke-linejoin="round"/>
    <path d="${throwStripes}" fill="none" stroke="var(--anatomy-lo)" stroke-width=".5"/>
    <path d="${k.pathOf(cushion, true)}" fill="#2457F5" stroke="#1740C0" stroke-width=".6"/>` })
  slab(394, 138, 6, 10, 39, 26, 'mid', 3)
})

furniture([355, 271.5, 22], () => {
  for (const x of [312, 395]) for (const y of [255, 285]) slab(x, y, 0, 4, 4, 6, 'lo', 0.5)
  slab(306, 249, 6, 98, 45, 10, 'mid', 4)
  slab(306, 249, 6, 10, 39, 26, 'mid', 3)
  for (const x of [316, 356]) {
    slab(x, 251, 16, 38, 32, 9, 'mid', 3)
    slab(x + 1, 282, 24, 37, 6, 16, 'hi', 2.5)
  }
  slab(394, 249, 6, 10, 39, 26, 'mid', 3)
  slab(306, 286, 16, 98, 8, 26, 'mid', 4)
})

furniture([352, 216, 14], () => {
  cylinder(352, 216, 0.8, 15, 2, 'lo')
  cylinder(352, 216, 2.8, 3.5, 20, 'mid')
  cylinder(352, 216, 22.8, 22, 3, 'hi')
  slab(353, 209, 25.8, 16, 12, 1, 'lo', 0.5)
  slab(354, 209.5, 26.8, 14, 11, 0.5, 'hi', 0.4)
  cylinder(341, 215, 25.8, 3.5, 5, 'hi')
  cylinder(341, 215, 30.8, 2.6, 0.2, 'lo')
})

let base = k.solidSvg(k.slabOf(floor, -12, 12, projection, 4, 1), { tone: 'lo' })
base += k.lineSvg(k.planOutline(k.insetPlan(floor, 6), 0.1, projection), { tone: 'faint' })
for (let x = 50; x < 420; x += 50) base += k.lineSvg(path([[x, 6, 0.2], [x, 294, 0.2]]), { tone: 'faint' })
for (let y = 50; y < 300; y += 50) base += k.lineSvg(path([[6, y, 0.2], [414, y, 0.2]]), { tone: 'faint' })
const rug = { x: 294, y: 126, w: 112, d: 170, r: 4 }
base += k.solidSvg(k.slabOf(rug, 0.3, 0.4, projection, 6, 0), { tone: 'faint' })
base += k.lineSvg(k.planOutline(k.insetPlan(rug, 4), 0.8, projection), { tone: 'faint' })
for (let x = 300; x <= 400; x += 4) {
  base += k.lineSvg(path([[x, 295, 0.8], [x, 298, 0.8]]), { tone: 'lo' })
}
const css = await readFile(new URL('../src/components/iso/iso.css', import.meta.url), 'utf8')
  + await readFile(new URL('../src/components/iso/office-motion.css', import.meta.url), 'utf8')
const art = base + parts.sort((a,b) => a.depth - b.depth).map(p => p.svg).join('')
await writeFile(new URL('../src/components/iso/office-art.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" width="900" height="470"><style>${css}</style>${art}</svg>`)
for (const theme of ['light', 'dark']) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 470" width="900" height="470" class="iso iso-svg" data-theme="${theme}"><title>Scroller’s little internet office</title><style>${css}</style>${art}</svg>`
  await writeFile(new URL(`../public/office-${theme}.svg`, import.meta.url), svg)
  const loading = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="315 80 180 150" width="360" height="300" class="iso" data-theme="${theme}"><title>Tanner working at his desk</title><style>${css}</style>${tannerArt}</svg>`
  await writeFile(new URL(`../public/tanner-loading-${theme}.svg`, import.meta.url), loading)
}
console.log(`Office illustration: ${solidCount} furniture and desk solids`)
