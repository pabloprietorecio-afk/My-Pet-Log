import { esc, PALETTE_LIGHT } from '../charts/svg'
import { reportCharts } from '../charts/reportCharts'
import type { ReportModel } from '../domain/report'
import type { ReportArt } from './art'
import { COVER_CSS, renderCoverHtml } from './coverHtml'
import { lang, tl } from '../i18n'

const CSS = `
:root{--ink:#0f2a26;--muted:#53665f;--line:#dbe3e0;--soft:#f1f5f3;--brand:#1c5cab}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:14px/1.5 PetLogSans,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
main{max-width:820px;margin:0 auto;padding:24px 20px 40px}
header.top{border-bottom:3px solid var(--brand);padding-bottom:14px;margin-bottom:6px}
header.top .app{font-size:12px;color:var(--muted);letter-spacing:.02em}
h1{margin:2px 0 2px;font-size:26px;line-height:1.15}
.sub{color:var(--muted)}
h2{font-size:16px;margin:26px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--line);color:var(--brand)}
h3{font-size:14px;margin:14px 0 4px}
dl{display:grid;grid-template-columns:max-content 1fr;gap:3px 16px;margin:0}
dt{color:var(--muted)}dd{margin:0;font-weight:600}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--soft);font-weight:700;font-size:12px}
td.n,th.n{text-align:right;white-space:nowrap}
.day{margin:12px 0 0;font-weight:700}
.tl{list-style:none;margin:2px 0 0;padding:0}
.tl li{display:grid;grid-template-columns:48px 1fr;gap:8px;padding:3px 0;border-bottom:1px dotted var(--line)}
.tl time{color:var(--muted);font-variant-numeric:tabular-nums}
.tl .l{font-weight:600}
.chart{margin:12px 0;break-inside:avoid}
.chart svg{max-width:100%;height:auto}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin:2px 0 0}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.note{font-size:12px;color:var(--muted);margin:0 0 2px}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.tags li{background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-weight:600}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.photos figure{margin:0;break-inside:avoid}
.photos img{width:100%;height:150px;object-fit:cover;border-radius:6px;border:1px solid var(--line)}
.photos figcaption{font-size:11px;color:var(--muted)}
.disc{margin-top:30px;padding:10px 12px;background:var(--soft);border-left:3px solid var(--muted);font-size:12px;color:var(--muted)}
details.alt{font-size:12px;color:var(--muted)}
.empty{color:var(--muted);font-style:italic}
@page{size:A4;margin:10mm}
.sep{max-width:820px;margin:18px auto 0;padding:0 16px;display:flex;align-items:center;gap:10px;color:var(--muted);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.sep::before,.sep::after{content:"";flex:1;border-top:1px dashed var(--line)}
@media print{main{padding:0 2mm}details.alt{display:none}h2{break-after:avoid}.sep{display:none}}
`

const li = (items: string[]) =>
  items.length ? `<ul class="tags">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="empty">${tl('Sin datos registrados.')}</p>`

/**
 * Informe como HTML autónomo (sin recursos externos).
 * Primera página: infografía (`coverHtml.ts`). Después, el informe detallado con las 9 secciones.
 * `art` son las ilustraciones de la app ya en SVG; sin ellas se usan iconos sencillos.
 */
export function renderHtml(m: ReportModel, art?: ReportArt): string {
  const p = m.pet
  const kv = (k: string, v?: string) => (v ? `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>` : '')
  const vetLine = [p.vet.name, p.vet.clinic, p.vet.phone].filter(Boolean).join(' · ')

  const petBlock = `<dl>
    ${kv(tl('Especie'), p.species)}${kv(tl('Raza'), p.breed)}${kv(tl('Sexo'), p.sex)}
    ${kv(tl('Edad'), p.age)}${kv(tl('Nacimiento'), p.birthDate)}
    ${kv(tl('Último peso'), p.weight ? `${p.weight.text} (${p.weight.date})` : undefined)}
    ${kv(tl('Veterinario habitual'), vetLine || undefined)}
  </dl>`

  const treatments = m.currentTreatments.length
    ? `<table><thead><tr><th>${tl('Medicamento')}</th><th>${tl('Dosis')}</th><th>${tl('Pauta')}</th><th>${tl('Desde')}</th><th>${tl('Notas')}</th></tr></thead><tbody>${m.currentTreatments
        .map(
          (t) =>
            `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.dose)}</td><td>${esc(t.schedule)}</td><td>${esc(t.since)}${t.until ? ` – ${esc(t.until)}` : ''}</td><td>${esc(t.notes ?? '')}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : `<p class="empty">${tl('Sin tratamientos activos registrados.')}</p>`

  const summary = `<dl>${m.summary.map((s) => `<dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>`).join('')}</dl>`

  const timeline = m.timeline.length
    ? m.timeline
        .map(
          (d) =>
            `<div class="day">${esc(d.title)}</div><ul class="tl">${d.items
              .map(
                (i) =>
                  `<li><time>${esc(i.time)}</time><span><span class="l">${esc(i.emoji)} ${esc(i.label)}</span>${i.detail ? ` – ${esc(i.detail)}` : ''}</span></li>`,
              )
              .join('')}</ul>`,
        )
        .join('')
    : `<p class="empty">${tl('No hay registros en este periodo.')}</p>`

  const medRows = m.medication.rows
  const medTable = medRows.length
    ? `<table><thead><tr><th>${tl('Medicamento')}</th><th>${tl('Pauta')}</th><th class="n">${tl('Previstas')}</th><th class="n">${tl('A tiempo')}</th><th class="n">${tl('Con retraso')}</th><th class="n">${tl('Omitidas')}</th><th class="n">${tl('Sin registrar')}</th><th class="n">${tl('Adicionales')}</th></tr></thead><tbody>${medRows
        .map(
          (r) =>
            `<tr><td><b>${esc(r.name)}</b><br><span class="sub">${esc(r.dose)} · ${esc(r.period)}</span></td><td>${esc(r.schedule)}</td><td class="n">${r.planned}</td><td class="n">${r.given}</td><td class="n">${r.late}</td><td class="n">${r.skipped}</td><td class="n">${r.unrecorded}</td><td class="n">${r.extra}</td></tr>`,
        )
        .join('')}</tbody></table>${m.medication.adHoc ? `<p class="note">${tl('Además, {0} toma(s) suelta(s) sin tratamiento asociado.', m.medication.adHoc)}</p>` : ''}`
    : `<p class="empty">${tl('Sin medicación en el periodo.')}</p>`

  const charts = reportCharts(m, PALETTE_LIGHT, 380)
  const chartsHtml = charts
    .map(
      (c) =>
        `<div class="chart"><h3>${esc(c.title)}</h3>${c.note ? `<p class="note">${esc(c.note)}</p>` : ''}${c.svg}${
          c.legend ? `<div class="legend">${c.legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''
        }<details class="alt"><summary>${tl('Ver datos')}</summary>${esc(c.text)}</details></div>`,
    )
    .join('')

  const notes = m.ownerNotes.length
    ? `<table><tbody>${m.ownerNotes.map((n) => `<tr><td class="n">${esc(n.when)}</td><td><b>${esc(n.label)}</b></td><td>${esc(n.text)}</td></tr>`).join('')}</tbody></table>`
    : `<p class="empty">${tl('Sin notas en el periodo.')}</p>`

  const photos = m.photos.length
    ? `<h2>${tl('Fotografías adjuntas')}</h2><div class="photos">${m.photos
        .map((f) => `<figure><img alt="${esc(f.label)} ${esc(f.when)}" src="${esc(f.dataUrl)}"><figcaption>${esc(f.label)} · ${esc(f.when)}</figcaption></figure>`)
        .join('')}</div>`
    : ''

  return `<!doctype html>
<html lang="${lang()}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tl('Informe de {0}', esc(p.name))} · ${esc(m.period.label)}</title><style>${art?.fontCss ?? ''}${CSS}${COVER_CSS}</style></head>
<body>
${renderCoverHtml(m, art)}
<div class="sep" aria-hidden="true">${tl('Informe detallado')}</div>
<main>
<header class="top"><div class="app">${tl('PetLog · Informe detallado para el veterinario')}</div>
<h1>${esc(p.name)}</h1>
<div class="sub">${esc(m.period.label)} · ${esc(m.period.fromText)} – ${esc(m.period.toText)}<br>${tl('Generado el {0}', esc(m.generatedAt))}</div></header>

<h2>${tl('1. Datos de la mascota')}</h2>${petBlock}
<h2>${tl('2. Patologías y alergias')}</h2>
<h3>${tl('Patologías (según el propietario)')}</h3>${li(p.conditions)}
<h3>${tl('Alergias')}</h3>${li(p.allergies)}
<h2>${tl('3. Medicación actual')}</h2>${treatments}
<h2>${tl('4. Resumen del periodo')}</h2>${summary}
<h2>${tl('5. Cronología de incidencias')}</h2>${timeline}
<h2>${tl('6. Tabla de medicación')}</h2>${medTable}
<h2>${tl('7–8. Peso y gráficas')}</h2>${chartsHtml || `<p class="empty">${tl('Sin datos para graficar.')}</p>`}
<h2>${tl('9. Observaciones del propietario')}</h2>${notes}
${photos}
<p class="disc">${esc(m.disclaimer)}</p>
</main></body></html>`
}
