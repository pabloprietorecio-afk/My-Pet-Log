import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { memoryMode } from '../../data/instance'
import { makePeriod, type PeriodPreset } from '../../domain/report'
import type { Pet } from '../../domain/types'
import { addDays, toLocalDate } from '../../domain/time'
import { copyText, mailtoUrl, openExternal, saveFile, shareFile, whatsappUrl } from '../../platform/files'
import { htmlBlob, pdfBlob, reportFileName } from '../../report/export'
import { renderHtml } from '../../report/html'
import { reportToText } from '../../report/text'
import { reportArt } from '../art/reportArt'
import { Seg, Sheet } from '../components'
import { IconChat, IconCode, IconDownload, IconEyeOpen, IconMail, IconShare } from '../icons'
import { useReportModel } from '../reportData'

export function Report() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  const [preset, setPreset] = useState<PeriodPreset>('7d')
  const [from, setFrom] = useState(toLocalDate(addDays(new Date(), -13)))
  const [to, setTo] = useState(toLocalDate(new Date()))
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [preview, setPreview] = useState(false)
  const [zoom, setZoom] = useState(false)
  const [fallback, setFallback] = useState<{ via: 'WhatsApp' | 'correo'; url: string; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [preset, from, to])
  const period = useMemo(() => makePeriod(preset, now, { from, to }), [preset, now, from, to])
  const model = useReportModel(pet, period, now)
  // El mismo HTML sirve para la miniatura (portada) y para la vista completa.
  const html = useMemo(() => (model ? renderHtml(model, reportArt) : ''), [model])

  const run = async (label: string, fn: () => Promise<string | void>) => {
    if (!model) return
    setBusy(label)
    setMsg(null)
    try {
      const r = await fn()
      if (r) setMsg({ kind: 'ok', text: r })
    } catch (e) {
      setMsg({ kind: 'err', text: `No se pudo completar: ${e instanceof Error ? e.message : 'error desconocido'}` })
    } finally {
      setBusy(null)
    }
  }
  const outcome = (o: string, saved = 'Archivo guardado.') => (o === 'cancelled' ? undefined : o === 'downloaded' ? saved : 'Listo.')
  const title = `Informe de ${pet.name} · ${period.label}`
  const off = !model || !!busy
  const send = (via: 'WhatsApp' | 'correo') => {
    if (!model) return
    const text = reportToText(model)
    const url = via === 'WhatsApp' ? whatsappUrl(text) : mailtoUrl(title, text)
    setMsg(null)
    // Se llama dentro del toque (sin esperas antes) para que el navegador no lo trate como ventana emergente.
    void openExternal(url).then((ok) => {
      if (!ok) {
        setCopied(false)
        setFallback({ via, url, text })
      }
    })
  }

  return (
    <>
      <Seg<PeriodPreset>
        label="Periodo del informe"
        value={preset}
        onChange={setPreset}
        options={[
          { value: '24h', label: '24 h' },
          { value: '7d', label: '7 días' },
          { value: '30d', label: '30 días' },
          { value: 'custom', label: 'Fechas' },
        ]}
      />
      {preset === 'custom' && (
        <div className="two" style={{ flex: 'none' }}>
          <div className="field">
            <label htmlFor="r-from" className="lbl">
              Desde
            </label>
            <input id="r-from" className="input" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="r-to" className="lbl">
              Hasta
            </label>
            <input id="r-to" className="input" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      )}

      <div className="bar">
        <h2 className="eyebrow">Vista previa</h2>
        <span className="rthumb-range">{model ? `${model.period.fromDay} – ${model.period.toDay}` : ''}</span>
      </div>
      <ReportThumb html={html} onOpen={() => setPreview(true)} label={model ? `Ver informe completo de ${pet.name} (${model.period.fromDay} – ${model.period.toDay})` : 'Preparando el informe'} />

      <button
        className="btn primary block big"
        style={{ flex: 'none' }}
        disabled={off}
        onClick={() =>
          run('share', async () =>
            outcome(await shareFile(await pdfBlob(model!, reportArt), reportFileName(model!, 'pdf'), title, reportToText(model!)), 'PDF descargado.'),
          )
        }
      >
        <IconShare />
        {busy === 'share' ? 'Generando PDF…' : 'Compartir informe en PDF'}
      </button>
      <div className="actions-row" role="group" aria-label="Otras formas de enviar o guardar">
        <button
          className="act"
          disabled={off}
          onClick={() => run('pdf', async () => outcome(await saveFile(await pdfBlob(model!, reportArt), reportFileName(model!, 'pdf'), title), 'PDF descargado.'))}
        >
          <IconDownload />
          {busy === 'pdf' ? '…' : 'PDF'}
        </button>
        <button
          className="act"
          disabled={off}
          onClick={() => run('html', async () => outcome(await saveFile(htmlBlob(model!, reportArt), reportFileName(model!, 'html'), title), 'HTML descargado.'))}
        >
          <IconCode />
          HTML
        </button>
        <button className="act" disabled={!model} onClick={() => send('WhatsApp')}>
          <IconChat />
          WhatsApp
        </button>
        <button className="act" disabled={!model} onClick={() => send('correo')}>
          <IconMail />
          Correo
        </button>
      </div>
      <p className={`status${msg ? ` ${msg.kind}` : ''}`} role="status">
        {msg
          ? msg.text
          : memoryMode
            ? 'Si este visor bloquea descargas o ventanas, te ofreceré copiar el texto. En la app instalada funciona todo.'
            : 'WhatsApp y Correo envían un resumen en texto; el PDF va con «Compartir».'}
      </p>

      {fallback && (
        <Sheet
          title={`Enviar por ${fallback.via}`}
          onClose={() => setFallback(null)}
          foot={
            <button
              className="btn primary"
              onClick={async () => {
                setCopied(await copyText(fallback.text))
              }}
            >
              {copied ? 'Texto copiado' : 'Copiar texto'}
            </button>
          }
        >
          <p className="muted">
            No se ha podido abrir {fallback.via === 'WhatsApp' ? 'WhatsApp' : 'tu app de correo'} desde aquí. Copia el resumen y pégalo en el chat o en el
            correo, o prueba con el enlace.
          </p>
          <textarea className="input" readOnly value={fallback.text} rows={7} aria-label="Resumen del informe" onFocus={(e) => e.currentTarget.select()} />
          <a className="btn block" href={fallback.url} target="_blank" rel="noopener noreferrer">
            Abrir {fallback.via === 'WhatsApp' ? 'WhatsApp' : 'el correo'}
          </a>
          {copied === false && <p className="hint">Si «Copiar» no funciona, mantén pulsado el texto para seleccionarlo.</p>}
        </Sheet>
      )}

      {preview && model && (
        <Sheet title={`Informe · ${period.label}`} onClose={() => setPreview(false)} full>
          <div className={`preview-wrap${zoom ? ' zoom' : ''}`}>
            <iframe className="preview" title="Informe completo" sandbox="" srcDoc={html} />
          </div>
          <button className="preview-zoom" onClick={() => setZoom((z) => !z)} aria-pressed={zoom}>
            {zoom ? '− Ver entero' : '+ Ampliar'}
          </button>
        </Sheet>
      )}
    </>
  )
}

/**
 * Miniatura de la portada (infografía) que ocupa el hueco libre de la pantalla.
 * La portada se escala sola al ancho; toda la tarjeta es un botón que abre el informe completo.
 */
function ReportThumb({ html, onOpen, label }: { html: string; onOpen: () => void; label: string }) {
  // Sin barras de desplazamiento dentro de la miniatura.
  const doc = useMemo(() => html.replace('</head>', '<style>html,body{overflow:hidden}</style></head>'), [html])
  return (
    <button type="button" className="rthumb" onClick={onOpen} disabled={!html} aria-label={label}>
      {html && <iframe title="Vista previa del informe" aria-hidden="true" tabIndex={-1} sandbox="" srcDoc={doc} />}
      {!html && <span className="rthumb-wait">Preparando…</span>}
      <span className="rthumb-cta" aria-hidden="true">
        <IconEyeOpen />
        Ver informe completo
      </span>
    </button>
  )
}
