/**
 * Portada del informe en HTML: un cartel de proporción fija (como una hoja A4) que se
 * escala entero al ancho disponible, así se ve igual en el móvil, en el ordenador y al imprimir.
 * Las medidas se escriben en «px» de diseño (cartel de 820 de ancho) y se convierten a
 * `calc(var(--u) * N)`, donde `--u` es el ancho real dividido entre 820.
 */
import { esc } from '../charts/svg'
import type { ReportModel } from '../domain/report'
import { pawPath, type ReportArt } from './art'
import { BLUE, coverCharts, fichaRows, LIMITS, nameSize, NAVY, POSTER as P, rest, SECTIONS, statIcon, typeIconSvg, type SectionKey } from './cover'
import { glyph } from './glyphs'
import { tl } from '../i18n'

const PAD = 20
const DESIGN = `
.cover{position:relative;width:820px;height:${P.H + PAD * 2}px;margin:0 auto;background:#fff;color:#14203f;font-size:15px;line-height:1.25;overflow:hidden}
.cover *{box-sizing:border-box}
.cover .abs{position:absolute}
.cover .paws{position:absolute;left:0;top:0;width:820px;height:${P.hero.h + PAD * 2}px;pointer-events:none}
.cover .photo{left:${PAD}px;top:${PAD}px;width:${P.hero.photo}px;height:${P.hero.h}px;border-radius:30px;overflow:hidden}
.cover .photo img{width:100%;height:100%;object-fit:cover;display:block}
.cover .photo svg{width:100%;height:100%;display:block;background:linear-gradient(160deg,#ffe9cf,#ffd5a6)}
.cover .titles{left:${PAD + P.hero.titlesX}px;top:${PAD}px;width:${P.hero.titlesW}px;height:${P.hero.h}px;display:flex;flex-direction:column;justify-content:center}
.cover h1{margin:0;font-weight:900;letter-spacing:-.03em;line-height:.95;color:${NAVY};white-space:nowrap}
.cover .kind{margin-top:8px;font-size:29px;font-weight:800;line-height:1.12;letter-spacing:-.01em;color:${NAVY}}
.cover .range{margin-top:12px;display:flex;align-items:center;gap:7px;font-size:19px;font-weight:500;color:${NAVY};white-space:nowrap}
.cover .range svg{width:26px;height:26px;flex:none}
.cover .gen{margin-top:4px;padding-left:33px;font-size:15px;color:#33405e}
.cover .ficha{left:${PAD + P.hero.fichaX}px;top:${PAD}px;width:${P.W - P.hero.fichaX}px;height:${P.hero.h}px;margin:0;border-radius:26px;background:#dce8fb;padding:14px 16px;display:flex;flex-direction:column;justify-content:space-evenly}
.cover .ficha div{display:flex;align-items:center;gap:12px;font-size:16px;line-height:1.15;color:${NAVY}}
.cover .ficha svg{width:27px;height:27px;flex:none}
.cover .ficha dt{display:inline;font-weight:500}
.cover .ficha dd{display:inline;margin:0;font-weight:800}
.cover .ficha span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cover .card{border-radius:18px;border:2px solid var(--b);background:var(--s);overflow:hidden;display:flex;flex-direction:column}
.cover .ch{flex:none;height:${P.head}px;margin:0;padding:0 14px;border:0;display:flex;align-items:center;gap:10px;background:var(--c);color:var(--i);font-size:21px;font-weight:800;letter-spacing:-.01em;white-space:nowrap}
.cover .ch svg{width:27px;height:27px;flex:none}
.cover .ch small{font-size:13px;font-weight:600;opacity:.92;margin-left:auto;white-space:nowrap}
.cover .cb{flex:1;min-height:0;padding:10px 14px;display:flex;flex-direction:column}
.cover .stats{list-style:none;margin:0;padding:0;flex:1;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;column-gap:22px;position:relative}
.cover .stats::before{content:"";position:absolute;left:50%;top:4px;bottom:4px;border-left:2px solid #f6c48b}
.cover .stats li{display:flex;align-items:center;gap:9px;min-width:0}
.cover .ic{flex:none;width:38px;height:38px}
.cover .ic svg{width:100%;height:100%;display:block}
.cover .stats.dense .l{font-size:13px}
.cover .stats.dense b{font-size:16px;line-height:1.1}
.cover .stats.dense small{font-size:12px;line-height:1.1}
.cover .stats.dense .ic{width:34px;height:34px}
.cover .ficha.f7 div{font-size:14.5px}
.cover .ficha.f8 div{font-size:13.5px}
.cover .ficha.f7 svg,.cover .ficha.f8 svg{width:23px;height:23px}
.cover .stats span.t{min-width:0;display:block}
.cover .stats .l{display:block;font-size:14px;color:#27324f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .stats b{display:block;font-size:17px;font-weight:800;color:#101a36;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .stats small{display:block;font-size:13px;color:#27324f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .chart{flex:1;min-height:0;position:relative}
.cover .chart svg{position:absolute;left:0;top:0;width:100%;height:100%}
.cover .legend{flex:none;display:flex;flex-wrap:wrap;gap:2px 16px;font-size:14px;font-weight:600;color:#27324f}
.cover .legend i{display:inline-block;width:13px;height:13px;border-radius:50%;margin-right:6px;vertical-align:-1px}
.cover .freq{list-style:none;margin:0;padding:0;flex:1;display:grid;grid-auto-rows:1fr}
.cover .freq li{display:flex;align-items:center;gap:14px;font-size:18px;color:#101a36;border-bottom:1.5px solid #e3e8ef;padding:0 4px}
.cover .freq li:last-child{border-bottom:0}
.cover .freq .ic{width:32px;height:32px}
.cover .freq .l{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .freq b{font-size:20px;font-weight:800}
.cover .rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.cover .rows li{display:block;font-size:15px}
.cover .rows .w{display:flex;gap:7px;align-items:center;font-weight:600;font-size:14px;color:#27324f;white-space:nowrap}
.cover .rows .w svg{width:21px;height:21px;flex:none}
.cover .rows .w b{font-weight:800;color:var(--c)}
.cover .rows .x{margin-top:3px;padding-left:10px;border-left:2.5px solid var(--b);font-size:16px;font-weight:700;color:#101a36;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cover .facts{list-style:none;margin:0;padding:0;flex:1;display:flex;flex-direction:column;justify-content:space-evenly;gap:4px}
.cover .facts li{display:flex;gap:9px;align-items:flex-start;font-size:15px;font-weight:600;color:#101a36;line-height:1.2}
.cover .facts svg{width:22px;height:22px;flex:none}
.cover .facts span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cover .more{flex:none;margin:auto 0 0;padding-top:4px;font-size:12.5px;color:#4a556f}
.cover .none{margin:0;font-size:15px;font-style:italic;color:#4a556f}
.cover .cdisc{left:${PAD + 30}px;top:${PAD + P.discY}px;width:${P.W - 60}px;margin:0;text-align:center;font-size:12.5px;font-style:italic;color:#4a556f;line-height:1.3}
`

/** «Npx» de diseño → unidades que escalan con el ancho. */
const scaled = DESIGN.replace(/(\d*\.?\d+)px/g, 'calc(var(--u)*$1)')

export const COVER_CSS = `
.cover{--u:calc(min(100vw,820px)/820)}
${scaled}
@media print{.cover{--u:calc(190mm/820);break-after:page;page-break-after:always}}
`

/** Tamaño del título para que quepa en la cabecera de una tarjeta de ancho `w`. */
export const titleSize = (title: string, w: number) => Math.min(21, Math.floor(((w - 62) / (title.length * 0.56)) * 10) / 10)

const box = (x: number, y: number, w: number, h: number) =>
  `left:calc(var(--u)*${PAD + x});top:calc(var(--u)*${PAD + y});width:calc(var(--u)*${w});height:calc(var(--u)*${h})`

function card(k: SectionKey, pos: string, body: string, title = SECTIONS[k].title, extra = '', w = 400): string {
  const s = SECTIONS[k]
  const fs = titleSize(title, w)
  return `<section class="card abs" style="${pos};--c:${s.color};--i:${s.ink};--b:${s.border};--s:${s.soft}"><h2 class="ch" style="font-size:calc(var(--u)*${fs})">${glyph(s.glyph, s.ink, 2.1)}${esc(title)}${extra}</h2><div class="cb">${body}</div></section>`
}

/** Huellas decorativas de la cabecera (posición, tamaño y giro), compartidas con el PDF. */
export const HERO_PAWS: [number, number, number, number][] = [
  [44, 44, 26, -20],
  [18, 196, 22, 14],
  [300, 232, 20, -12],
  [505, 58, 30, 18],
]

export function renderCoverHtml(m: ReportModel, art?: ReportArt): string {
  const p = m.pet
  const c = m.cover
  const r1 = P.r1
  const r2 = P.r2
  const r3 = P.r3
  const wW = P.W - r1.split - P.gap
  const charts = coverCharts(m, { weightW: wW - 32, weightH: r1.h - P.head - 24, incW: r2.split - 32, incH: r2.h - P.head - 50 })

  const avatar = p.photo
    ? `<img src="${esc(p.photo)}" alt="${tl('Foto de {0}', esc(p.name))}">`
    : art
      ? art.pet(p.speciesKey)
      : `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${pawPath(50, 56, 26)}" fill="#f2a65e"/></svg>`

  const hero = `<svg class="paws" viewBox="0 0 820 ${P.hero.h + PAD * 2}" aria-hidden="true">${HERO_PAWS.map(([x, y, r, a]) => `<path d="${pawPath(x, y, r)}" fill="#fbe3c8" transform="rotate(${a} ${x} ${y})"/>`).join('')}</svg>
<div class="photo abs">${avatar}</div>
<div class="titles abs">
  <h1 style="font-size:calc(var(--u)*${nameSize(p.name)})">${esc(p.name)}</h1>
  <div class="kind">${tl('Informe de salud ·')}<br>${esc(m.period.label)}</div>
  <div class="range">${glyph('calendar', NAVY, 2)}<span>${esc(m.period.fromDay)} – ${esc(m.period.toDay)}</span></div>
  <div class="gen">${tl('Generado: {0}', esc(m.generatedAt))}</div>
</div>
<dl class="ficha abs f${fichaRows(m).length}">${fichaRows(m)
    .map((r) => `<div>${glyph(r.glyph, NAVY, 2.2)}<span><dt>${esc(r.label)}:</dt> <dd>${esc(r.value)}</dd></span></div>`)
    .join('')}</dl>`

  const stats = c.stats.slice(0, LIMITS.stats)
  // Se rellena por columnas (como en una lista de dos columnas): mitad izquierda, mitad derecha.
  const half = Math.ceil(stats.length / 2)
  const ordered = Array.from({ length: half * 2 }, (_, i) => (i % 2 === 0 ? stats[i / 2] : stats[half + (i - 1) / 2]))
  const sum = card(
    'sum',
    box(0, r1.y, r1.split, r1.h),
    `<ul class="stats${half >= 4 ? ' dense' : ''}">${ordered
      .map((s) =>
        s
          ? `<li><span class="ic" aria-hidden="true">${statIcon(art, s)}</span><span class="t"><span class="l">${esc(s.label)}</span><b>${esc(s.value)}</b>${s.detail ? `<small>(${esc(s.detail)})</small>` : ''}</span></li>`
          : `<li></li>`,
      )
      .join('')}</ul>${rest(c.stats.length, stats.length) ? `<p class="more">${tl('Y {0} más en «Resumen del periodo».', rest(c.stats.length, stats.length))}</p>` : ''}`,
  )

  const weight = card(
    'weight',
    box(r1.split + P.gap, r1.y, wW, r1.h),
    charts.weight ? `<div class="chart">${charts.weight}</div>` : `<p class="none">${tl('Sin pesos registrados.')}</p>`,
    undefined,
    !!m.weight.sixMonths && m.weight.points.length > 1 ? `<small>${tl('Últimos 6 meses')}</small>` : '',
  )

  const inc = card(
    'inc',
    box(0, r2.y, r2.split, r2.h),
    `${charts.legend.length ? `<div class="legend">${charts.legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''}<div class="chart">${charts.incidents}</div>`,
    charts.incTitle,
    `<small>${tl('Vómitos, deposiciones y síntomas')}</small>`,
  )

  const freqItems = m.frequency.slice(0, LIMITS.freq)
  const freq = card(
    'freq',
    box(r2.split + P.gap, r2.y, P.W - r2.split - P.gap, r2.h),
    freqItems.length
      ? `<ul class="freq">${freqItems
          .map((f) => `<li><span class="ic" aria-hidden="true">${typeIconSvg(art, f.key, f.label, f.emoji)}</span><span class="l">${esc(f.label)}</span><b>${f.count}</b></li>`)
          .join('')}</ul>${rest(m.frequency.length, freqItems.length) ? `<p class="more">Y ${rest(m.frequency.length, freqItems.length)} tipos más.</p>` : ''}`
      : `<p class="none">${tl('Sin registros en el periodo.')}</p>`,
    undefined,
    '',
    P.W - r2.split - P.gap,
  )

  const visits = c.vetVisits.slice(0, LIMITS.vet)
  const vet = card(
    'vet',
    box(0, r3.y, r3.a, r3.h),
    visits.length
      ? `<ul class="rows">${visits
          .map((v) => `<li><span class="w">${glyph('calendar', SECTIONS.vet.color, 2)}<span>${esc(v.when)}</span></span><span class="x">${v.text ? esc(v.text) : `<i>${tl('Sin nota')}</i>`}</span></li>`)
          .join('')}</ul>${rest(c.vetVisits.length, visits.length) ? `<p class="more">Y ${rest(c.vetVisits.length, visits.length)} más en la cronología.</p>` : ''}`
      : `<p class="none">${tl('Sin visitas veterinarias registradas en el periodo.')}</p>`,
    undefined,
    '',
    r3.a,
  )

  const notes = c.notes.slice(0, LIMITS.notes)
  const obs = card(
    'notes',
    box(r3.a + P.gap, r3.y, r3.b - r3.a - P.gap, r3.h),
    notes.length
      ? `<ul class="rows">${notes
          .map((n) => `<li><span class="w">${glyph('calendar', SECTIONS.notes.color, 2)}<span>${esc(n.when)} · <b>${esc(n.label)}</b></span></span><span class="x">${esc(n.text)}</span></li>`)
          .join('')}</ul>${rest(c.notes.length, notes.length) ? `<p class="more">Y ${rest(c.notes.length, notes.length)} más en el informe detallado.</p>` : ''}`
      : `<p class="none">${tl('Sin notas en el periodo.')}</p>`,
  )

  const facts = c.keyFacts.slice(0, LIMITS.key)
  const key = card(
    'key',
    box(r3.b + P.gap, r3.y, P.W - r3.b - P.gap, r3.h),
    `<ul class="facts">${facts.map((f) => `<li>${glyph('check', '#2e9d57', 2.4)}<span>${esc(f)}</span></li>`).join('')}</ul>`,
  )

  return `<section class="cover" aria-label="${tl('Resumen visual del informe')}">
${hero}
${sum}${weight}${inc}${freq}${vet}${obs}${key}
<p class="cdisc abs">${esc(m.disclaimer)}</p>
</section>`
}

export { BLUE }
