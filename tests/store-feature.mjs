// Gráfico destacado 1024×500 para Google Play, uno por idioma.
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const S = '/home/claude/store'
const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const T = {
  es: ['El diario de salud de tu mascota', 'Un toque para anotar. Un informe claro para el veterinario.'],
  en: ["Your pet's health diary", 'One tap to log. A clear report for the vet.'],
  fr: ['Le journal de santé de votre animal', 'Un geste pour noter. Un rapport clair pour le vétérinaire.'],
  de: ['Das Gesundheitstagebuch deines Tiers', 'Ein Tippen zum Eintragen. Ein klarer Bericht für den Tierarzt.'],
  it: ['Il diario della salute del tuo animale', 'Un tocco per annotare. Un report chiaro per il veterinario.'],
  pt: ['O diário de saúde do seu animal', 'Um toque para registar. Um relatório claro para o veterinário.'],
}
const icon = b64(`${S}/icon-512.png`)
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } })
for (const [l, [title, sub]] of Object.entries(T)) {
  const a = b64(`${S}/shots/${l}-1-hoy.png`), c = b64(`${S}/shots/${l}-5-informe.png`)
  await page.setContent(`<!doctype html><html><head><style>
  @font-face{font-family:Nunito;src:url('http://localhost:5199/node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2')}
  *{margin:0;box-sizing:border-box}
  body{width:1024px;height:500px;overflow:hidden;font-family:Nunito,system-ui,sans-serif;
    background:linear-gradient(120deg,#bdeedd 0%,#dff1ff 52%,#d6c9ff 100%);position:relative}
  .glow{position:absolute;left:-120px;top:-60px;width:700px;height:620px;background:radial-gradient(closest-side,rgba(255,255,255,.75),rgba(255,255,255,0))}
  .left{position:absolute;left:64px;top:0;bottom:0;width:480px;display:flex;flex-direction:column;justify-content:center;gap:18px}
  .brand{display:flex;align-items:center;gap:18px}
  .brand img{width:96px;height:96px;border-radius:26px;box-shadow:0 10px 30px rgba(60,50,140,.18)}
  .brand b{font-size:58px;font-weight:900;color:#262a6b;letter-spacing:-1px}
  h1{font-size:34px;line-height:1.12;font-weight:850;color:#262a6b;max-width:460px}
  p{font-size:20px;line-height:1.35;color:#4a4f86;font-weight:600;max-width:440px}
  .ph{position:absolute;width:236px;height:420px;border-radius:30px;border:7px solid #1f2350;overflow:hidden;box-shadow:0 24px 50px rgba(40,30,110,.28);background:#fff}
  .ph img{width:100%;height:100%;object-fit:cover;object-position:top}
  .p1{right:250px;top:62px;transform:rotate(-5deg)}
  .p2{right:46px;top:28px;transform:rotate(4deg)}
  </style></head><body><div class="glow"></div>
  <div class="left"><div class="brand"><img src="${icon}"><b>PetLog</b></div><h1>${title}</h1><p>${sub}</p></div>
  <div class="ph p1"><img src="${a}"></div><div class="ph p2"><img src="${c}"></div>
  </body></html>`)
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${S}/feature-${l}.png` })
}
await browser.close()
