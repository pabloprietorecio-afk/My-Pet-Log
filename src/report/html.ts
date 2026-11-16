import { esc, PALETTE_LIGHT } from '../charts/svg'
import { reportCharts } from '../charts/reportCharts'
import type { ReportModel } from '../domain/report'

const CSS = `
:root{--ink:#0f2a26;--muted:#53665f;--line:#dbe3e0;--soft:#f1f5f3;--brand:#1c5cab}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
@page{size:A4;margin:14mm}
@media print{main{padding:0}details.alt{display:none}h2{break-after:avoid}}
`

const li = (items: string[]) =>
  items.length ? `<ul class="tags">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="empty">Sin datos registrados.</p>'

/** Informe como HTML autónomo (sin recursos externos). */
export function renderHtml(m: ReportModel): string {
  const p = m.pet
  const kv = (k: string, v?: string) => (v ? `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>` : '')
  const vetLine = [p.vet.name, p.vet.clinic, p.vet.phone].filter(Boolean).join(' · ')

  const petBlock = `<dl>
    ${kv('Especie', p.species)}${kv('Raza', p.breed)}${kv('Sexo', p.sex)}
    ${kv('Edad', p.age)}${kv('Nacimiento', p.birthDate)}
    ${kv('Último peso', p.weight ? `${p.weight.text} (${p.weight.date})` : undefined)}
    ${kv('Veterinario habitual', vetLine || undefined)}
  </dl>`

  const treatments = m.currentTreatments.length
    ? `<table><thead><tr><th>Medicamento</th><th>Dosis</th><th>Pauta</th><th>Desde</th><th>Notas</th></tr></thead><tbody>${m.currentTreatments
        .map(
          (t) =>
            `<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.dose)}</td><td>${esc(t.schedule)}</td><td>${esc(t.since)}${t.until ? ` – ${esc(t.until)}` : ''}</td><td>${esc(t.notes ?? '')}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '<p class="empty">Sin tratamientos activos registrados.</p>'

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
    : '<p class="empty">No hay registros en este periodo.</p>'

  const medRows = m.medication.rows
  const medTable = medRows.length
    ? `<table><thead><tr><th>Medicamento</th><th>Pauta</th><th class="n">Previstas</th><th class="n">A tiempo</th><th class="n">Con retraso</th><th class="n">Omitidas</th><th class="n">Sin registrar</th><th class="n">Adicionales</th></tr></thead><tbody>${medRows
        .map(
          (r) =>
            `<tr><td><b>${esc(r.name)}</b><br><span class="sub">${esc(r.dose)} · ${esc(r.period)}</span></td><td>${esc(r.schedule)}</td><td class="n">${r.planned}</td><td class="n">${r.given}</td><td class="n">${r.late}</td><td class="n">${r.skipped}</td><td class="n">${r.unrecorded}</td><td class="n">${r.extra}</td></tr>`,
        )
        .join('')}</tbody></table>${m.medication.adHoc ? `<p class="note">Además, ${m.medication.adHoc} toma(s) suelta(s) sin tratamiento asociado.</p>` : ''}`
    : '<p class="empty">Sin medicación en el periodo.</p>'

  const charts = reportCharts(m, PALETTE_LIGHT, 380)
  const chartsHtml = charts
    .map(
      (c) =>
        `<div class="chart"><h3>${esc(c.title)}</h3>${c.note ? `<p class="note">${esc(c.note)}</p>` : ''}${c.svg}${
          c.legend ? `<div class="legend">${c.legend.map((l) => `<span><i style="background:${l.color}"></i>${esc(l.label)}</span>`).join('')}</div>` : ''
        }<details class="alt"><summary>Ver datos</summary>${esc(c.text)}</details></div>`,
    )
    .join('')

  const notes = m.ownerNotes.length
    ? `<table><tbody>${m.ownerNotes.map((n) => `<tr><td class="n">${esc(n.when)}</td><td><b>${esc(n.label)}</b></td><td>${esc(n.text)}</td></tr>`).join('')}</tbody></table>`
    : '<p class="empty">Sin notas en el periodo.</p>'

  const photos = m.photos.length
    ? `<h2>Fotografías adjuntas</h2><div class="photos">${m.photos
        .map((f) => `<figure><img alt="${esc(f.label)} ${esc(f.when)}" src="${esc(f.dataUrl)}"><figcaption>${esc(f.label)} · ${esc(f.when)}</figcaption></figure>`)
        .join('')}</div>`
    : ''

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Informe de ${esc(p.name)} · ${esc(m.period.label)}</title><style>${CSS}</style></head>
<body><main>
<header class="top"><div class="app">PetLog · Informe para el veterinario</div>
<h1>${esc(p.name)}</h1>
<div class="sub">${esc(m.period.label)} · ${esc(m.period.fromText)} – ${esc(m.period.toText)}<br>Generado el ${esc(m.generatedAt)}</div></header>

<h2>1. Datos de la mascota</h2>${petBlock}
<h2>2. Patologías y alergias</h2>
<h3>Patologías (según el propietario)</h3>${li(p.conditions)}
<h3>Alergias</h3>${li(p.allergies)}
<h2>3. Medicación actual</h2>${treatments}
<h2>4. Resumen del periodo</h2>${summary}
<h2>5. Cronología de incidencias</h2>${timeline}
<h2>6. Tabla de medicación</h2>${medTable}
<h2>7–8. Peso y gráficas</h2>${chartsHtml || '<p class="empty">Sin datos para graficar.</p>'}
<h2>9. Observaciones del propietario</h2>${notes}
${photos}
<p class="disc">${esc(m.disclaimer)}</p>
</main></body></html>`
}
