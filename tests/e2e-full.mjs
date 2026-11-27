// Prueba funcional completa en Chrome a tamaño de móvil, simulando el teclado de Android
// (al enfocar un campo la ventana encoge, como con adjustResize).
// Uso: npm run dev -- --port 5199  y después  node tests/e2e-full.mjs
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import { execSync } from 'node:child_process'

const BASE = process.env.PETLOG_URL ?? 'http://localhost:5199/'
const W = 390
const H = 844
const KEYBOARD = 320
const OUT = new URL('./.out/', import.meta.url).pathname
fs.mkdirSync(OUT, { recursive: true })
const PHOTO = OUT + 'foto-prueba.png'

let pass = 0
const fails = []
const ok = (cond, msg) => {
  if (cond) pass++
  else fails.push(msg)
  console.log(cond ? '  ✓' : '  ✗', msg)
}
const section = (t) => console.log('\n' + t)

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  locale: 'es-ES',
  timezoneId: 'Europe/Madrid',
  acceptDownloads: true,
  permissions: ['clipboard-read', 'clipboard-write'],
})
await ctx.route(/wa\.me/, (r) => r.fulfill({ status: 200, body: 'wa' }))
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.addInitScript(() => {
  window.__mail = []
  const orig = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    if (this.href.startsWith('mailto:')) return void window.__mail.push(this.href)
    return orig.call(this)
  }
})
const wait = (ms = 300) => page.waitForTimeout(ms)
const tab = (n) => page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: n })
const repo = (fn, arg) => page.evaluate(fn, arg)
const dialog = (name) => page.getByRole('dialog', { name })

/** Escribe como en un móvil: enfoca, aparece el teclado (la ventana encoge), escribe y comprueba que el foco no se pierde. */
async function kb(locator, text, label) {
  await locator.click()
  await page.setViewportSize({ width: W, height: H - KEYBOARD })
  await wait(450)
  const still = await locator.evaluate((el) => el === document.activeElement)
  await locator.fill(text)
  await wait(250)
  const after = await locator.evaluate((el) => el === document.activeElement)
  const val = await locator.inputValue()
  await page.setViewportSize({ width: W, height: H })
  await wait(200)
  ok(still && after && val === text, `${label}: se puede escribir con el teclado abierto (foco estable, valor «${text}»)`)
}

const petId = () => page.url().match(/pet\/([^/]+)/)?.[1]

// ─────────────────────────────────────────────────────────────────────────
section('1. Alta de mascota')
await page.goto(BASE)
await wait(500)
// Foto de prueba dibujada por el propio navegador (PNG válido de 320×240).
const png = await page.evaluate(() => {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 240
  const g = c.getContext('2d')
  g.fillStyle = '#f6c08a'
  g.fillRect(0, 0, 320, 240)
  g.fillStyle = '#8a5a2b'
  g.beginPath()
  g.arc(160, 120, 70, 0, 7)
  g.fill()
  return c.toDataURL('image/png').split(',')[1]
})
fs.writeFileSync(PHOTO, Buffer.from(png, 'base64'))
ok(await page.getByRole('link', { name: 'Añadir mi mascota' }).isVisible(), 'bienvenida con «Añadir mi mascota»')
await page.getByRole('link', { name: 'Añadir mi mascota' }).click()
await page.getByRole('button', { name: 'Crear mascota' }).click()
ok(await page.getByRole('alert').filter({ hasText: 'nombre' }).isVisible(), 'sin nombre avisa en vez de guardar')
await kb(page.getByLabel('Nombre'), 'Oso', 'Nombre')
await page.getByRole('radio', { name: 'Perro' }).click()
await page.getByRole('radio', { name: 'Macho' }).click()
await page.getByLabel('Nacimiento').fill('2026-08-10')
await kb(page.getByLabel('Peso (kg)'), '11,9', 'Peso inicial')
await kb(page.getByLabel('Raza (opcional)'), 'Mestizo', 'Raza')
// Añadir foto pregunta primero: cámara o galería
await page.getByRole('button', { name: 'Añadir foto' }).click()
ok(await page.getByRole('button', { name: /Hacer foto/ }).isVisible(), 'Foto: ofrece hacer la foto con la cámara')
const fc = page.waitForEvent('filechooser')
await page.getByRole('button', { name: /Elegir de la galería/ }).click()
await (await fc).setFiles(PHOTO)
await wait(400)
ok(await page.locator('.photo-pick img').count() === 1, 'foto de la mascota añadida')
await page.getByRole('radio', { name: /^Salud/ }).click()
await kb(page.getByLabel('Patologías').last(), 'Displasia', 'Patologías')
await page.getByLabel('Patologías').last().press('Enter')
await kb(page.getByLabel('Alergias').last(), 'Pollo', 'Alergias')
await page.getByLabel('Alergias').last().press('Enter')
ok(await page.getByRole('button', { name: 'Quitar Displasia' }).isVisible() && (await page.getByRole('button', { name: 'Quitar Pollo' }).isVisible()), 'etiquetas de salud añadidas')
await kb(page.getByLabel('Notas generales'), 'Muy activo', 'Notas')
await page.getByRole('radio', { name: /^Veterinario/ }).click()
await kb(page.getByLabel('Veterinario'), 'Dra. Prueba', 'Veterinario')
await kb(page.getByLabel('Teléfono'), '600000000', 'Teléfono')
await page.getByRole('button', { name: 'Crear mascota' }).click()
await page.waitForURL(/\/hoy$/)
await page.waitForFunction(() => /kg/.test(document.querySelector('.who .meta')?.textContent ?? ''), null, { timeout: 4000 }).catch(() => {}); const metaTxt = await page.locator('.who .meta').innerText(); ok(metaTxt.includes('11,9 kg') && metaTxt.includes('Perro'), 'cabecera: especie y peso inicial (' + metaTxt + ')')

// ─────────────────────────────────────────────────────────────────────────
section('2. Registro rápido (Hoy)')
for (const name of ['Vómito', 'Deposición', 'Comida', 'Agua', 'Estado']) {
  await page.getByRole('button', { name: new RegExp('^' + name) }).click()
  await wait(250)
  const toastOk = await page.locator('.toast-head').filter({ hasText: name }).isVisible()
  const opts = page.locator('.toast-opts .chip')
  if ((await opts.count()) > 0) await opts.nth(1).click()
  await wait(200)
  ok(toastOk, `${name}: un toque registra y confirma con la hora`)
}
const evList = await repo(async (id) => {
  const r = window.__petlog.repo
  const t = new Map((await r.listEventTypes(id)).map((x) => [x.id, x.label]))
  return (await r.listEvents(id)).map((e) => t.get(e.typeId))
}, petId())
let evs = evList.length
ok(evs === 6 && evList.filter((l) => l === 'Peso').length === 1, `5 registros + el peso inicial de la ficha (${evList.join(', ')})`)
const vomitLevel = await repo(async (id) => {
  const r = window.__petlog.repo
  const t = (await r.listEventTypes(id)).find((x) => x.key === 'vomit')
  return (await r.listEvents(id)).find((e) => e.typeId === t.id)?.level
}, petId())
ok(vomitLevel !== undefined, 'la intensidad elegida en el aviso se guarda')
// Deshacer
await page.getByRole('button', { name: /^Agua/ }).click()
await wait(200)
await page.locator('.toast').getByRole('button', { name: 'Deshacer' }).click()
await wait(300)
evs = await repo(async (id) => (await window.__petlog.repo.listEvents(id)).length, petId())
ok(evs === 6, 'Deshacer elimina el último registro')
// Añadir nota desde el aviso
await page.getByRole('button', { name: /^Comida/ }).click()
await wait(200)
await page.locator('.toast').getByRole('button', { name: 'Añadir nota o foto' }).click()
await kb(page.getByLabel(/^Nota/), 'Dejó la mitad', 'Nota tras registrar')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar cambios' }).click()
await wait(300)
ok(await repo(async (id) => (await window.__petlog.repo.listEvents(id)).some((e) => e.note === 'Dejó la mitad'), petId()), 'la nota se guarda en el registro')

// PESO (el fallo del bucle)
await page.getByRole('button', { name: /^Peso/ }).click()
await wait(300)
ok(await dialog('Peso').isVisible(), 'Peso abre su hoja')
await kb(page.getByLabel('Valor (kg)'), '12,4', 'Peso')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
await wait(400)
ok(!(await dialog('Peso').isVisible()), 'la hoja de Peso se cierra al guardar')
ok(await page.locator('.who .meta').innerText().then((t) => t.includes('12,4 kg')), 'la cabecera muestra el nuevo peso (12,4 kg)')
await page.getByRole('button', { name: /^Peso/ }).click()
await page.getByLabel('Valor (kg)').fill('abc')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
ok(await page.getByRole('alert').isVisible(), 'un peso no numérico avisa y no se guarda')
await page.getByRole('button', { name: 'Cerrar' }).click()

// Síntoma
await page.getByRole('button', { name: /^Síntoma/ }).click()
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
ok(await page.getByRole('alert').isVisible(), 'Síntoma sin elegir avisa')
await page.getByRole('button', { name: 'Cojera' }).click()
await page.getByRole('radio', { name: 'Leve' }).click()
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
await wait(300)
ok(await repo(async (id) => (await window.__petlog.repo.listEvents(id)).some((e) => e.note === 'Cojera' && e.level === 1), petId()), 'Síntoma «Cojera, leve» guardado')

// Veterinario con fecha futura y foto
await page.getByRole('button', { name: /^Veterinario/ }).click()
await kb(page.getByLabel('Motivo o resultado'), 'Revisión anual', 'Veterinario')
await page.getByRole('button', { name: 'Añadir foto' }).click()
const fc2 = page.waitForEvent('filechooser')
await page.getByRole('button', { name: /Hacer foto/ }).click()
const chooser = await fc2
ok((await chooser.element().getAttribute('capture')) === 'environment', 'Foto: «Hacer foto» pide la cámara (capture)')
await chooser.setFiles(PHOTO)
await wait(300)
const future = new Date(Date.now() + 3 * 86400e3)
const pad = (n) => String(n).padStart(2, '0')
await page.getByLabel(/Fecha y hora/).fill(`${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T10:30`)
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
await wait(300)
ok(await repo(async (id) => (await window.__petlog.repo.listEvents(id)).some((e) => e.note === 'Revisión anual' && e.photo && e.at > new Date().toISOString()), petId()), 'Veterinario: cita futura con foto guardada')

// Otro: requiere texto
await page.getByRole('button', { name: /^Otro/ }).click()
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
ok(await page.getByRole('alert').isVisible(), 'Otro sin texto avisa')
await kb(page.getByLabel(/Nota/), 'Se escapó al jardín', 'Otro')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
await wait(300)
ok(!(await page.locator('.scrim').count()), 'Otro se guarda y la hoja se cierra')

// Resumen del día
await page.getByRole('button', { name: /^Hoy:/ }).click()
await wait(300)
ok((await page.getByRole('list', { name: 'Registros de hoy' }).getByRole('listitem').count()) >= 6, 'la hoja «Hoy» lista lo registrado')
await page.getByRole('button', { name: 'Cerrar' }).click()

// ─────────────────────────────────────────────────────────────────────────
section('3. Medicación')
await page.getByRole('button', { name: /^Medicación/ }).first().click()
await wait(300)
await page.getByRole('button', { name: 'Toma suelta' }).click()
await kb(page.getByLabel('Medicamento'), 'Meloxicam', 'Toma suelta')
await page.getByLabel('Dosis').fill('0,5')
await page.getByRole('button', { name: /Registrar|Guardar/ }).last().click()
await wait(300)
ok(await repo(async (id) => (await window.__petlog.repo.listDoseLogs(id)).some((l) => l.adHoc?.name === 'Meloxicam'), petId()), 'toma suelta registrada')
if (await page.locator('.scrim').count()) await page.keyboard.press('Escape')
await tab('Medicación').click()
await wait(300)
await page.getByRole('button', { name: /Crear tratamiento|Nuevo tratamiento/ }).click()
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar tratamiento' }).click()
ok(await page.getByRole('alert').isVisible(), 'tratamiento sin nombre avisa')
await kb(page.getByLabel('Medicamento'), 'Prednisona', 'Tratamiento: medicamento')
await kb(page.getByLabel('Dosis'), '5', 'Tratamiento: dosis')
await page.getByLabel('Nueva hora').fill('00:01')
await page.getByRole('button', { name: 'Añadir', exact: true }).click()
await page.getByLabel('Nueva hora').fill('23:59')
await page.getByRole('button', { name: 'Añadir', exact: true }).click()
await kb(page.getByLabel(/^Notas/), 'Con comida', 'Tratamiento: notas')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar tratamiento' }).click()
await wait(400)
ok((await repo(async (id) => (await window.__petlog.repo.listTreatments(id)).length, petId())) === 1, 'tratamiento creado')
await page.getByRole('radio', { name: /^Tomas de hoy/ }).click()
await wait(300)
const slots = page.getByRole('list', { name: 'Tomas de hoy' }).getByRole('listitem')
ok((await slots.count()) >= 2, `tomas de hoy listadas (${await slots.count()})`)
await page.getByRole('button', { name: /^Dar Prednisona de las 00:01/ }).click()
await wait(300)
ok(await page.getByRole('list', { name: 'Tomas de hoy' }).getByText(/Dada|Con retraso/).first().isVisible(), 'toma marcada como dada')
await page.getByRole('button', { name: /^Deshacer Prednisona de las 00:01/ }).click()
await wait(300)
await page.getByRole('button', { name: /^Omitir Prednisona de las 00:01/ }).click()
await wait(300)
ok(await page.getByRole('list', { name: 'Tomas de hoy' }).getByText('Omitida').isVisible(), 'toma omitida')
await page.getByRole('radio', { name: /^Tratamientos/ }).click()
await page.getByRole('list', { name: 'Tratamientos' }).getByRole('listitem').first().click()
await kb(page.getByLabel('Dosis'), '2,5', 'Editar dosis')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar tratamiento' }).click()
await wait(400)
ok(await repo(async (id) => (await window.__petlog.repo.listTreatments(id)).some((t) => t.dose === 2.5), petId()), 'dosis editada a 2,5')
await page.getByRole('list', { name: 'Tratamientos' }).getByRole('listitem').first().click()
await page.getByRole('button', { name: /Finalizar tratamiento/ }).click()
await wait(400)
ok(await page.getByText('Finalizados').isVisible(), 'tratamiento finalizado pasa a «Finalizados»')

// ─────────────────────────────────────────────────────────────────────────
section('4. Historial')
await tab('Historial').click()
await wait(400)
const rows = page.getByRole('list', { name: 'Historial' }).getByRole('listitem')
ok((await rows.count()) > 0, `historial con registros (${await rows.count()} en la página)`)
await page.getByRole('button', { name: /Todos los tipos/ }).click()
await page.getByRole('dialog', { name: 'Mostrar' }).getByRole('button', { name: /Vómito/ }).click()
await page.getByRole('button', { name: 'Aplicar' }).click()
await wait(300)
const onlyVomit = await rows.allInnerTexts()
ok(onlyVomit.length > 0 && onlyVomit.every((t) => t.includes('Vómito')), 'filtro por tipo: solo vómitos')
await page.getByRole('button', { name: /Vómito/ }).first().click()
await wait(200)
await page.getByRole('button', { name: 'Ver todo' }).click()
await page.getByRole('button', { name: 'Aplicar' }).click()
for (const p of ['Hoy', '30 días', 'Todo', '7 días']) {
  await page.getByRole('radio', { name: p }).click()
  await wait(150)
}
ok(true, 'cambio de periodo sin errores')
await page.getByRole('radio', { name: 'Todo' }).click()
await wait(200)
if (await page.getByRole('button', { name: 'Página siguiente' }).count()) {
  const p1 = await rows.first().innerText()
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await wait(200)
  ok((await rows.first().innerText()) !== p1 && /^(Página\s+)?2 de/.test((await page.locator('.pager .dots').innerText()).trim()), 'paginación del historial')
  await page.getByRole('button', { name: 'Página anterior' }).click()
}
async function only(type) {
  await page.locator('.bar .chip').click()
  const dlg = page.getByRole('dialog', { name: 'Mostrar' })
  if (await dlg.getByRole('button', { name: 'Ver todo' }).isEnabled()) await dlg.getByRole('button', { name: 'Ver todo' }).click()
  await dlg.getByRole('button', { name: new RegExp(type) }).click()
  await dlg.getByRole('button', { name: 'Aplicar' }).click()
  await wait(250)
}
await only('Comida')
await rows.filter({ hasText: 'Comida' }).first().click()
await kb(page.getByLabel(/^Nota/), 'Editada desde historial', 'Editar registro')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar cambios' }).click()
await wait(300)
ok(await repo(async (id) => (await window.__petlog.repo.listEvents(id)).some((e) => e.note === 'Editada desde historial'), petId()), 'registro editado desde el historial')
const before = await repo(async (id) => (await window.__petlog.repo.listEvents(id)).length, petId())
await only('Estado')
await rows.filter({ hasText: 'Estado' }).first().click()
await page.getByRole('button', { name: 'Eliminar registro' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click()
await wait(300)
ok((await repo(async (id) => (await window.__petlog.repo.listEvents(id)).length, petId())) === before - 1, 'registro eliminado con confirmación')

// ─────────────────────────────────────────────────────────────────────────
section('5. Gráficas')
await tab('Gráficas').click()
await wait(500)
const total = Number((await page.locator('.chart-pick small').innerText()).split(' de ')[1])
ok(total >= 3, `${total} gráficas disponibles`)
let seen = 0
for (let i = 0; i < total; i++) {
  if ((await page.locator('.stage svg').count()) > 0) seen++
  if (i < total - 1) await page.getByRole('button', { name: 'Gráfica siguiente' }).click()
  await wait(150)
}
ok(seen === total, 'todas las gráficas se dibujan')
await page.getByRole('button', { name: 'Ver datos' }).click()
ok((await page.locator('.data-text').innerText()).length > 5, '«Ver datos» muestra los valores')
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.locator('.chart-pick').click()
await page.getByRole('dialog', { name: 'Gráficas' }).getByRole('button').filter({ hasText: /peso/i }).first().click()
ok((await page.locator('.chart-pick b').innerText()).toLowerCase().includes('peso'), 'selector de gráfica')
for (const p of ['7 días', '90 días']) await page.getByRole('radio', { name: p }).click()

// ─────────────────────────────────────────────────────────────────────────
section('6. Informe y envíos')
await tab('Informe').click()
await wait(600)
await page.getByRole('button', { name: 'Ver informe completo' }).click()
await wait(600)
const frame = page.frameLocator('iframe.preview')
ok(await frame.getByText('Oso').first().isVisible(), 'vista previa del informe')
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('radio', { name: 'Fechas' }).click()
await page.getByLabel('Desde').fill('2026-11-01')
await wait(300)
ok(await page.getByText('01/11/2026', { exact: false }).first().isVisible(), 'periodo personalizado')
await page.getByRole('radio', { name: '7 días' }).click()
await wait(300)
for (const [name, ext] of [['PDF', 'pdf'], ['HTML', 'html'], [/Compartir informe/, 'pdf']]) {
  const dl = page.waitForEvent('download', { timeout: 30000 }).catch(() => null)
  await page.getByRole('button', { name, exact: typeof name === 'string' }).click()
  const d = await dl
  if (!d) {
    ok(false, `${name} descarga`)
    continue
  }
  const f = `${OUT}informe.${ext}`
  await d.saveAs(f)
  const txt = ext === 'pdf' ? execSync(`pdftotext ${f} -`).toString() : fs.readFileSync(f, 'utf8')
  ok(txt.includes('Oso') && txt.includes('Prednisona') && /12,4/.test(txt), `${String(name)}: archivo con mascota, medicación y peso`)
  ok(!/diagn[oó]stico:|recomendamos|debería tratarse/i.test(txt), `${String(name)}: sin diagnósticos ni recomendaciones`)
}
const pop = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
await page.getByRole('button', { name: 'WhatsApp' }).click()
const w = await pop
ok(!!w && decodeURIComponent(w.url()).includes('Informe de Oso'), 'WhatsApp abre wa.me con el resumen')
if (w) await w.close()
await page.getByRole('button', { name: 'Correo' }).click()
await wait(200)
ok((await page.evaluate(() => window.__mail[0] ?? '')).startsWith('mailto:'), 'Correo abre un mailto con el resumen')
await page.evaluate(() => (window.open = () => null))
await page.getByRole('button', { name: 'WhatsApp' }).click()
await wait(300)
await page.getByRole('button', { name: 'Copiar texto' }).click()
await wait(200)
ok((await page.evaluate(() => navigator.clipboard.readText())).includes('Informe de Oso'), 'si se bloquea WhatsApp: copiar texto funciona')
await page.getByRole('button', { name: 'Cerrar' }).click()

// ─────────────────────────────────────────────────────────────────────────
section('7. Ficha y botones')
await page.locator('.who').click()
await page.getByRole('button', { name: /Ficha de Oso/ }).click()
await wait(300)
await kb(page.getByLabel('Raza'), 'Labrador', 'Ficha: raza')
await page.getByRole('radio', { name: /^Salud/ }).click()
await page.getByRole('button', { name: 'Quitar Pollo' }).click()
await page.getByRole('button', { name: 'Guardar ficha' }).click()
await wait(400)
ok(await repo(async (id) => {
  const p = await window.__petlog.repo.getPet(id)
  return p.breed === 'Labrador' && !p.allergies.includes('Pollo')
}, petId()), 'ficha editada (raza y alergias)')
await page.locator('.who').click()
await page.getByRole('button', { name: /Personalizar botones/ }).click()
await wait(300)
await page.getByRole('button', { name: 'Ocultar Agua' }).click()
await page.getByRole('button', { name: 'Bajar Medicación' }).click()
await page.getByRole('button', { name: 'Botón nuevo' }).click()
await kb(page.locator('#b-label'), 'Glucosa', 'Botón nuevo: nombre')
await page.getByRole('radio', { name: 'Un número' }).click()
await kb(page.locator('#b-unit'), 'mg/dl', 'Botón nuevo: unidad')
await page.locator('.sheet-foot').getByRole('button', { name: 'Crear botón' }).click()
await wait(300)
const types = await repo(async (id) => (await window.__petlog.repo.listEventTypes(id)).map((t) => `${t.key}:${t.label}:${t.hidden ? 'oculto' : ''}`), petId())
ok(types.some((t) => t.includes('Glucosa')) && types.some((t) => t === 'water:Agua:oculto') && types[0].startsWith('vomit'), 'ocultar, reordenar y crear botón')
await page.getByRole('link', { name: 'Volver' }).click()
await wait(300)
ok(!(await page.getByRole('button', { name: /^Agua/ }).count()), 'Agua oculto en Hoy')
await page.getByRole('button', { name: /^Glucosa/ }).click()
await kb(page.getByLabel(/Valor/), '95', 'Glucosa')
await page.locator('.sheet-foot').getByRole('button', { name: 'Guardar' }).click()
await wait(300)
await tab('Gráficas').click()
await page.locator('.chart-pick').click()
ok(await page.getByRole('dialog', { name: 'Gráficas' }).getByText(/Glucosa/).first().isVisible(), 'el botón propio tiene su gráfica')
await page.getByRole('button', { name: 'Cerrar' }).click()

// ─────────────────────────────────────────────────────────────────────────
section('8. Varias mascotas')
await page.locator('.who').click()
await page.getByRole('button', { name: 'Añadir mascota' }).click()
await kb(page.getByLabel('Nombre'), 'Mia', 'Segunda mascota')
await page.getByRole('radio', { name: 'Gato' }).click()
await page.getByRole('button', { name: 'Crear mascota' }).click()
await page.waitForURL(/\/hoy$/)
ok((await page.locator('.who h1').innerText()).includes('Mia'), 'segunda mascota creada')
await page.locator('.who').click()
await page.getByRole('dialog', { name: 'Mascotas' }).getByRole('button', { name: /^Oso/ }).click()
await wait(300)
ok((await page.locator('.who h1').innerText()).includes('Oso'), 'cambio de mascota')

// ─────────────────────────────────────────────────────────────────────────
section('9. Ajustes y copia de seguridad')
await page.getByRole('link', { name: 'Ajustes' }).click()
await page.getByRole('button', { name: /^Apariencia/ }).click()
await page.getByRole('radio', { name: 'Oscuro' }).click()
await wait(300)
ok((await page.evaluate(() => document.documentElement.dataset.theme)) === 'dark', 'tema oscuro')
await page.getByRole('radio', { name: 'Claro' }).click()
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('button', { name: /^Al tocar un botón/ }).click()
await page.getByRole('radio', { name: /Pedir detalles antes/ }).click()
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('button', { name: 'Volver' }).click()
await wait(300)
await page.getByRole('button', { name: /^Vómito/ }).click()
ok(await dialog('Vómito').isVisible(), 'modo «pedir detalles»: el toque abre la hoja')
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('link', { name: 'Ajustes' }).click()
await page.getByRole('button', { name: /^Al tocar un botón/ }).click()
await page.getByRole('radio', { name: /Registrar al instante/ }).click()
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('button', { name: /^Copia de seguridad/ }).click()
const dl = page.waitForEvent('download')
await page.getByRole('button', { name: 'Guardar copia en un archivo' }).click()
const backup = `${OUT}copia.json`
await (await dl).saveAs(backup)
const json = JSON.parse(fs.readFileSync(backup, 'utf8'))
ok(json.data?.pets?.length === 2 && json.data?.events?.length > 5, `copia con ${json.data?.pets?.length} mascotas y ${json.data?.events?.length} registros`)
await page.getByRole('button', { name: 'Cerrar' }).click()
await page.getByRole('button', { name: 'Borrar todos los datos' }).click()
await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar todo' }).click()
await wait(500)
ok(await page.getByRole('link', { name: 'Añadir mi mascota' }).isVisible(), 'borrar todo vuelve a la bienvenida')
await page.goto(BASE + '#/ajustes')
await page.getByRole('button', { name: /^Copia de seguridad/ }).click()
const fc3 = page.waitForEvent('filechooser')
await page.getByRole('button', { name: /Restaurar/ }).click()
await (await fc3).setFiles(backup)
await wait(600)
ok(await page.getByRole('status').filter({ hasText: 'restaurada' }).isVisible(), 'copia restaurada')
ok((await repo(async () => (await window.__petlog.repo.listPets()).length)) === 2, 'tras restaurar vuelven las 2 mascotas')

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${pass} correctas, ${fails.length} fallos`)
for (const f of fails) console.log('  ✗', f)
if (errors.length) console.log('Errores de la página:\n  ' + [...new Set(errors)].join('\n  '))
await browser.close()
process.exit(fails.length || errors.length ? 1 : 0)
