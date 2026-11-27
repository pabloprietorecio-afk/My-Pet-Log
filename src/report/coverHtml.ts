/**
 * Portada del informe en HTML: una página A4 tipo infografía al imprimir y,
 * en pantallas estrechas (vista previa en el móvil), las mismas tarjetas apiladas.
 */
import { esc } from '../charts/svg'
import type { ReportModel } from '../domain/report'
import { pawPath, TYPE_TONE, type ReportArt } from './art'
import { coverCharts, fichaRows, LIMITS, rest, SECTIONS, statIcon, tint, typeIconSvg, type SectionKey } from './cover'
import { glyph } from './glyphs'

export const COVER_CSS = `
.cover{--r:16px;max-width:820px;margin:0 auto;padding:20px 16px 8px;display:flex;flex-direction:column;gap:12px;color:#14231f}
.cover .hero{display:grid;grid-template-columns:1fr;gap:12px}
.cover .hero-main{position:relative;overflow:hidden;min-width:0;border-radius:var(--r);background:linear-gradient(135deg,#fff3e4 0%,#fff8ef 45%,#eef1ff 100%);padding:16px;display:flex;gap:16px;align-items:center;min-height:150px}
.cover .paws{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.cover .avatar{position:relative;flex:none;width:132px;height:132px;border-radius:28px;overflow:hidden;background:#fff;border:4px solid #fff;box-shadow:0 6px 18px rgba(80,50,20,.16)}
.cover .avatar img{width:100%;height:100%;object-fit:cover;display:block}
.cover .avatar svg{width:100%;height:100%;display:block;background:linear-gradient(160deg,#ffe9cf,#ffd5a6)}
.cover .titles{position:relative;min-width:0}
.cover .brand{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#a24a0c}
.cover h1{font-size:44px;line-height:1;margin:4px 0 6px;font-weight:800;letter-spacing:-.02em;color:#13205c;overflow-wrap:anywhere}
.cover .kind{font-size:20px;font-weight:800;line-height:1.15;color:#13205c}
.cover .range{display:flex;align-items:flex-start;gap:6px;margin-top:8px;font-size:15px;font-weight:700;color:#13205c}
.cover .range>span{min-width:0}
.cover .range .pl{color:#a24a0c}
.cover .range svg{width:20px;height:20px;flex:none;margin-top:-1px}
.cover .gen{font-size:12.5px;color:#4f5d58;margin-top:2px}
.cover .ficha{grid-template-columns:1fr;margin:0;border-radius:var(--r);background:#eef1ff;padding:12px 14px;display:grid;gap:6px;align-content:center}
.cover .ficha div{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;font-size:13.5px;line-height:1.3}
.cover .ficha svg{width:20px;height:20px;margin-top:-1px}
.cover .ficha dt{display:inline;color:#3d4a6b}
.cover .ficha dd{display:inline;margin:0;font-weight:700;color:#13205c}
.cover .ficha .v{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cover .cgrid{display:grid;grid-template-columns:1fr;gap:12px}
.cover .card{background:#fff;border-radius:var(--r);border:1.5px solid var(--b);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.cover .ch{margin:0;display:flex;align-items:center;gap:8px;padding:8px 12px;color:#fff;font-size:15.5px;font-weight:800;letter-spacing:-.005em;background:var(--c);border:0}
.cover .ch svg{width:20px;height:20px;flex:none}
.cover .cb{padding:10px 12px;flex:1;min-height:0;display:flex;flex-direction:column;gap:6px}
.cover .stats{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px 12px}
.cover .stats li{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:center;min-width:0}
.cover .stats li>span{min-width:0}
.cover .ic svg{width:34px;height:34px;display:block}
.cover .stats .l{display:block;font-size:12px;color:#4f5d58;line-height:1.2}
.cover .stats b{display:block;font-size:15px;line-height:1.2}
.cover .stats small{display:block;font-size:11.5px;color:#4f5d58;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .big{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.cover .big b{font-size:26px;line-height:1;color:#3a1f99;letter-spacing:-.01em}
.cover .big span{font-size:12px;color:#4f5d58}
.cover .chip{display:inline-block;font-size:11.5px;font-weight:700;color:#3a1f99;background:#efe9ff;border-radius:999px;padding:2px 8px}
.cover .chart svg{width:100%;height:auto;display:block}
.cover .legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:#4f5d58}
.cover .legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.cover .freq{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.cover .freq li{display:grid;grid-template-columns:28px minmax(0,1fr) 54px 28px;gap:8px;align-items:center;font-size:13.5px;padding:2px 0;border-bottom:1px solid #eef1ee}
.cover .freq li:last-child{border-bottom:0}
.cover .freq .ic svg{width:28px;height:28px}
.cover .freq .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cover .freq .bar{height:8px;border-radius:4px;background:#edf1ee;overflow:hidden}
.cover .freq .bar i{display:block;height:100%;border-radius:4px}
.cover .freq b{text-align:right;font-size:15px}
.cover .items{list-style:none;margin:0;padding:0;display:grid;gap:7px}
.cover .items li{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:13px;line-height:1.3}
.cover .items .w{grid-column:1/-1;display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--c)}
.cover .items .w svg{width:14px;height:14px}
.cover .items .t{grid-column:1/-1;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cover .items .t b{font-weight:700}
.cover .items .s{grid-column:1/-1;font-size:11.5px;color:#4f5d58}
.cover .more{font-size:11.5px;color:#4f5d58;margin:auto 0 0}
.cover .none{font-size:13px;color:#4f5d58;font-style:italic;margin:0}
.cover .cdisc{margin:0;text-align:center;font-size:11px;font-style:italic;color:#4f5d58;line-height:1.35}
@media (min-width:700px){
  .cover .hero{grid-template-columns:1.62fr 1fr}
  .cover .cgrid{grid-template-columns:repeat(6,minmax(0,1fr))}
  .cover .s-sum,.cover .s-weight{grid-column:span 3}
  .cover .s-inc{grid-column:span 4}
  .cover .s-freq{grid-column:span 2}
  .cover .s-med,.cover .s-vet,.cover .s-notes{grid-column:span 2}
}
@media (max-width:420px){
  .cover{padding:12px 10px 6px}
  .cover .hero-main{padding:12px;gap:12px}
  .cover .avatar{width:96px;height:96px;border-radius:22px}
  .cover h1{font-size:34px}
  .cover .kind{font-size:17px}
}
@media print{
  .cover{max-width:none;height:276mm;padding:0;gap:3mm;break-after:page;page-break-after:always;font-size:10pt}
  .cover .hero{grid-template-columns:1.5fr 1fr;flex:none;height:58mm}
  .cover .hero-main{min-height:0;padding:4mm;gap:5mm}
  .cover .avatar{width:42mm;height:42mm}
  .cover .brand{font-size:8.5pt}
  .cover h1{font-size:32pt;margin:1mm 0 1.5mm}
  .cover .kind{font-size:12pt}
  .cover .range{font-size:9.5pt;margin-top:2mm}
  .cover .range svg{width:4.4mm;height:4.4mm}
  .cover .gen{font-size:8.5pt}
  .cover .ficha{padding:3mm 3.5mm;gap:1.3mm;overflow:hidden}
  .cover .ficha div{font-size:8.6pt;grid-template-columns:4.6mm 1fr;gap:2mm}
  .cover .ficha svg{width:4.4mm;height:4.4mm}
  .cover .ch{font-size:11pt;padding:2mm 3mm}
  .cover .ch svg{width:4.6mm;height:4.6mm}
  .cover .cb{padding:2.5mm 3mm;gap:1.5mm;overflow:hidden}
  .cover .stats{gap:2mm 3mm}
  .cover .stats li{grid-template-columns:8mm 1fr;gap:2mm}
  .cover .ic svg{width:8mm;height:8mm}
  .cover .stats .l,.cover .stats small{font-size:8pt}
  .cover .stats b{font-size:10.5pt}
  .cover .big b{font-size:18pt}
  .cover .freq{gap:0}
  .cover .freq li{grid-template-columns:6mm minmax(0,1fr) 12mm 6mm;gap:2mm;font-size:9.5pt;padding:.6mm 0}
  .cover .freq .ic svg{width:6mm;height:6mm}
  .cover .freq b{font-size:10.5pt}
  .cover .items li{font-size:9pt}
  .cover .items .w,.cover .items .s,.cover .more,.cover .legend{font-size:8pt}
  .cover .none{font-size:9pt}
  .cover .cdisc{font-size:7.5pt}
  .cover .cgrid{flex:1;min-height:0;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:1.05fr 1fr .95fr;gap:3mm}
  .cover .s-sum,.cover .s-weight{grid-column:span 3}
  .cover .s-inc{grid-column:span 4}
  .cover .s-freq{grid-column:span 2}
  .cover .s-med,.cover .s-vet,.cover .s-notes{grid-column:span 2}
  .cover .card{break-inside:avoid}
  .cover .chart{flex:1;min-height:0;position:relative}
  .cover .chart svg{position:absolute;inset:0;width:100%;height:100%}
}
`

const ic = (svg: string) => `<span class="ic" aria-hidden="true">${svg}</span>`

function card(k: SectionKey, body: string, title = SECTIONS[k].title): string {
  const s = SECTIONS[k]
  return `<section class="card s-${k}" style="--c:${s.color};--b:${tint(s.color, 0.72)}"><h2 class="ch" style="background:linear-gradient(90deg,${s.color} 55%,${tint(s.color, 0.22)})">${glyph(s.glyph, '#ffffff', 2)}${esc(title)}</h2><div class="cb">${body}</div></section>`
}

function heroPaws(): string {
  // Huellas decorativas (no informativas).
  const paws = [
    [14, 22, 9, -18],
    [40, 104, 7, 12],
    [150, 14, 6.5, 20],
    [262, 92, 11, -10],
    [228, 20, 6, 30],
    [180, 106, 5, -25],
  ]
  return `<svg class="paws" viewBox="0 0 280 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${paws
    .map(([x, y, r, a]) => `<path d="${pawPath(x, y, r)}" fill="#ffd8ad" opacity=".55" transform="rotate(${a} ${x} ${y})"/>`)
    .join('')}</svg>`
}

export function renderCoverHtml(m: ReportModel, art?: ReportArt): string {
  const p = m.pet
  const c = m.cover
  const charts = coverCharts(m, { weightW: 300, weightH: 125, incW: 480, incH: 165, fontSize: 11 })

  const avatar = p.photo
    ? `<img src="${esc(p.photo)}" alt="Foto de ${esc(p.name)}">`
    : art
      ? art.pet(p.speciesKey)
      : `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${pawPath(50, 56, 26)}" fill="#f2a65e"/></svg>`

  const hero = `<header class="hero">
  <div class="hero-main">${heroPaws()}
    <div class="avatar">${avatar}</div>
    <div class="titles">
      <div class="brand">PetLog</div>
      <h1>${esc(p.name)}</h1>
      <div class="kind">Informe para el veterinario</div>
      <div class="range">${glyph('calendar', '#13205c', 1.9)}<span><span class="pl">${esc(m.period.label)}</span> · ${esc(m.period.fromDay)} – ${esc(m.period.toDay)}</span></div>
      <div class="gen">Generado el ${esc(m.generatedAt)}</div>
    </div>
  </div>
  <dl class="ficha">${fichaRows(m)
    .map((r) => `<div>${glyph(r.glyph, '#2f44a0', 1.9)}<span class="v"><dt>${esc(r.label)}:</dt> <dd>${esc(r.value)}</dd></span></div>`)
    .join('')}</dl>
</header>`

  // Resumen
  const stats = c.stats.slice(0, LIMITS.stats)
  const more = rest(c.stats.length, stats.length)
  const sum = card(
    'sum',
    `<ul class="stats">${stats
      .map(
        (s) =>
          `<li>${ic(statIcon(art, s))}<span><span class="l">${esc(s.label)}</span><b>${esc(s.value)}</b>${s.detail ? `<small>${esc(s.detail)}</small>` : ''}</span></li>`,
      )
      .join('')}</ul>${more ? `<p class="more">Y ${more} más en «Resumen del periodo».</p>` : ''}`,
  )

  // Peso
  const w = c.weight
  const weight = card(
    'weight',
    w
      ? `<div class="big"><b>${esc(w.last)}</b><span>${esc(w.lastDate)}</span>${w.delta ? `<span class="chip">${esc(w.delta)} desde el ${esc(w.firstDate!)}</span>` : ''}</div><div class="chart">${charts.weight}</div>${m.weight.windowLabel === 'últimos 6 meses' ? '<p class="more">Gráfica: mediciones de los últimos 6 meses.</p>' : ''}`
      : '<p class="none">Sin pesos registrados.</p>',
  )

  // Episodios
  const inc = card(
    'inc',
    `${charts.legend.length ? `<div class="legend">${charts.legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''}<div class="chart">${charts.incidents}</div>`,
    charts.incTitle,
  )

  // Frecuencia
  const freqItems = m.frequency.slice(0, LIMITS.freq)
  const fmax = Math.max(1, ...freqItems.map((f) => f.count))
  const freqMore = rest(m.frequency.length, freqItems.length)
  const freq = card(
    'freq',
    freqItems.length
      ? `<ul class="freq">${freqItems
          .map(
            (f) =>
              `<li>${ic(typeIconSvg(art, f.key, f.label, f.emoji))}<span class="l">${esc(f.label)}</span><span class="bar"><i style="width:${Math.round((f.count / fmax) * 100)}%;background:${TYPE_TONE[f.key] ?? TYPE_TONE.custom}"></i></span><b>${f.count}</b></li>`,
          )
          .join('')}</ul>${freqMore ? `<p class="more">Y ${freqMore} tipos más.</p>` : ''}`
      : '<p class="none">Sin registros en el periodo.</p>',
  )

  // Medicación
  const meds = c.meds.slice(0, LIMITS.meds)
  const med = card(
    'med',
    meds.length
      ? `<ul class="items">${meds
          .map((t) => `<li><span class="t"><b>${esc(t.name)}</b> ${esc(t.dose)}</span><span class="s">${esc(t.schedule)}${t.adherence ? ` · ${esc(t.adherence)} dadas` : ''}</span></li>`)
          .join('')}</ul>${rest(c.meds.length, meds.length) ? `<p class="more">Y ${rest(c.meds.length, meds.length)} más en «Medicación actual».</p>` : ''}`
      : '<p class="none">Sin tratamientos activos registrados.</p>',
  )

  // Veterinario
  const visits = c.vetVisits.slice(0, LIMITS.vet)
  const vet = card(
    'vet',
    visits.length
      ? `<ul class="items">${visits
          .map((v) => `<li><span class="w">${glyph('calendar', SECTIONS.vet.color, 2)}${esc(v.when)}</span><span class="t">${v.text ? esc(v.text) : '<i>Sin nota</i>'}</span></li>`)
          .join('')}</ul>${rest(c.vetVisits.length, visits.length) ? `<p class="more">Y ${rest(c.vetVisits.length, visits.length)} más en la cronología.</p>` : ''}`
      : '<p class="none">Sin visitas veterinarias registradas en el periodo.</p>',
  )

  // Observaciones
  const notes = c.notes.slice(0, LIMITS.notes)
  const obs = card(
    'notes',
    notes.length
      ? `<ul class="items">${notes
          .map((n) => `<li><span class="w">${esc(n.when)} · ${esc(n.label)}</span><span class="t">${esc(n.text)}</span></li>`)
          .join('')}</ul>${rest(c.notes.length, notes.length) ? `<p class="more">Y ${rest(c.notes.length, notes.length)} más en «Observaciones del propietario».</p>` : ''}`
      : '<p class="none">Sin notas en el periodo.</p>',
  )

  return `<section class="cover" aria-label="Resumen visual del informe">
${hero}
<div class="cgrid">${sum}${weight}${inc}${freq}${med}${vet}${obs}</div>
<p class="cdisc">${esc(m.disclaimer)}</p>
</section>`
}
