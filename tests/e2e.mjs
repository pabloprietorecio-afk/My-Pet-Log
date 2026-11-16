// Prueba de humo en un Chrome real a tamaño de móvil. Uso: node tests/e2e.mjs
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const OUT = new URL('./.out/', import.meta.url).pathname
const URL_ = 'http://localhost:5199/'
const log = (...a) => console.log('•', ...a)
const errors = []

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-ES', timezoneId: 'Europe/Madrid', acceptDownloads: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()))
page.on('dialog', (d) => d.accept())
const tab = (n) => page.getByRole('navigation', { name: 'Secciones' }).getByRole('link', { name: n })
const shot = (n) => page.screenshot({ path: OUT + n + '.png' })

await page.goto(URL_)
await page.getByRole('link', { name: 'Añadir mi mascota' }).click()
await page.getByLabel('Nombre').fill('Luna')
await page.getByRole('radio', { name: 'Gato' }).click()
await page.getByRole('radio', { name: 'Hembra' }).click()
await page.getByLabel('Raza (opcional)').fill('Europeo')
await page.getByLabel('Nacimiento').fill('2012-05-10')
await page.getByLabel('Peso (kg)').fill('4,2')
await page.getByRole('radio', { name: /^Salud/ }).click()
await page.getByLabel('Patologías').last().fill('Insuficiencia renal')
await page.getByLabel('Patologías').last().press('Enter')
await shot('01-form')
await page.getByRole('button', { name: 'Crear mascota' }).click()
await page.waitForURL(/\/hoy$/)
log('mascota creada ->', page.url())

// Tratamiento
await tab('Medicación').click()
await page.getByRole('button', { name: 'Crear tratamiento' }).click()
await page.getByLabel('Medicamento').fill('Prednisona')
await page.getByLabel('Dosis').fill('5')
await page.getByRole('button', { name: 'Guardar tratamiento' }).click()
await page.waitForTimeout(300)
await shot('02-medicacion')

// Hoy: registro de un toque
await tab('Hoy').click()
const t0 = Date.now()
await page.getByRole('button', { name: /^Vómito/ }).click()
await page.locator('.toast-head').getByText('Vómito').waitFor()
log('registro de un toque en', Date.now() - t0, 'ms (incluye espera de aparición del aviso)')
await page.getByRole('button', { name: 'Moderado' }).click()
await shot('03-hoy-toast')
await page.waitForTimeout(1200)
await page.getByRole('button', { name: /^Comida/ }).click()
await page.getByRole('button', { name: 'Poca' }).click()
await page.getByRole('button', { name: /^Deposición/ }).click()
await page.getByRole('button', { name: 'Diarrea' }).click()
// Peso (abre hoja)
await page.getByRole('button', { name: /^Peso/ }).click()
await page.getByLabel(/^Valor/).fill('4,1')
await page.getByRole('button', { name: 'Guardar', exact: true }).click()
// Dosis: dar la próxima disponible (la de las 08:00 o 20:00 según hora)
const dada = page.getByRole('button', { name: /^Dar .* ahora$/ }).first()
if (await dada.count()) { await dada.click(); log('toma marcada como dada') }
await page.waitForTimeout(500)
await page.mouse.wheel(0, 0)
await shot('04-hoy')
await page.screenshot({ path: OUT + '04b-hoy-full.png', fullPage: true })

// Historial
await tab('Historial').click()
await page.waitForTimeout(300)
await shot('05-historial')
// Gráficas
await tab('Gráficas').click()
await page.waitForTimeout(400)
await page.screenshot({ path: OUT + '06-graficas.png', fullPage: true })
// Informe
await tab('Informe').click()
await page.waitForTimeout(800)
await shot('07-informe')
const dl = page.waitForEvent('download', { timeout: 60000 })
await page.getByRole('button', { name: /Compartir informe/ }).click()
const d = await dl
await d.saveAs(OUT + 'informe.pdf')
log('PDF descargado:', d.suggestedFilename(), fs.statSync(OUT + 'informe.pdf').size, 'bytes')
const dl2 = page.waitForEvent('download')
await page.getByRole('button', { name: 'HTML', exact: true }).click()
await (await dl2).saveAs(OUT + 'informe.html')
// Oscuro
await page.getByRole('link', { name: 'Ajustes' }).click()
await page.getByRole('button', { name: /^Apariencia/ }).click()
await page.getByRole('radio', { name: 'Oscuro' }).click()
await page.keyboard.press('Escape')
await page.goBack()
await page.waitForTimeout(300)
await tab('Hoy').click()
await page.waitForTimeout(400)
await shot('08-hoy-oscuro')
await tab('Gráficas').click()
await page.waitForTimeout(400)
await page.screenshot({ path: OUT + '09-graficas-oscuro.png', fullPage: true })
await browser.close()
console.log(errors.length ? 'ERRORES:\n' + errors.join('\n') : 'sin errores de consola')
