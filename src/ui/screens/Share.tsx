import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { usePets, useShareLinks } from '../../data/hooks'
import type { Pet } from '../../domain/types'
import { copyText, shareText } from '../../platform/files'
import { describe, joinUrl, makeCode, type ShareLink, type SyncStatus } from '../../sync/engine'
import { getSync, syncConfigured } from '../../sync/instance'
import { Avatar, Sheet, confirmDialog, useToast } from '../components'
import { IconBack } from '../icons'
import { Backdrop } from '../art/Backdrop'
import { Paged, type PagedItem } from '../layout'

function ago(iso?: string): string {
  if (!iso) return 'aún sin sincronizar'
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'sincronizada ahora'
  if (s < 3600) return `sincronizada hace ${Math.round(s / 60)} min`
  if (s < 86400) return `sincronizada hace ${Math.round(s / 3600)} h`
  return `sincronizada hace ${Math.round(s / 86400)} d`
}

function inviteText(pet: Pet, code: string): string {
  return [
    `Te invito a llevar el diario de ${pet.name} conmigo en PetLog.`,
    '',
    'En PetLog: Ajustes → Compartir con otros dueños → «Unirme con un código», y pega este código:',
    '',
    code,
    '',
    'Quien tenga el código puede ver y editar los datos de la mascota: compártelo solo con quien quieras.',
  ].join('\n')
}

export function Share() {
  const nav = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const pets = usePets()
  const links = useShareLinks() ?? []
  const configured = syncConfigured()
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' })
  const [busy, setBusy] = useState<string | null>(null)
  const [invite, setInvite] = useState<{ pet: Pet; link: ShareLink } | null>(null)
  const [joining, setJoining] = useState(params.get('codigo') ?? null)
  const [joinErr, setJoinErr] = useState<string | null>(null)

  useEffect(() => {
    if (!configured) return
    let off = () => {}
    void getSync().then((e) => {
      setStatus(e.status)
      off = e.onStatus(setStatus)
    })
    return () => off()
  }, [configured])

  const byPet = useMemo(() => new Map(links.map((l) => [l.petId, l])), [links])

  const doShare = async (pet: Pet) => {
    setBusy(pet.id)
    try {
      const e = await getSync()
      const link = await e.share(pet.id)
      e.start()
      setInvite({ pet, link })
    } catch (err) {
      toast.show(describe(err))
    } finally {
      setBusy(null)
    }
  }

  const doJoin = async (text: string) => {
    setBusy('join')
    setJoinErr(null)
    try {
      const e = await getSync()
      const petId = await e.join(text)
      e.start()
      setJoining(null)
      setParams({}, { replace: true })
      toast.show('¡Listo! Ya compartís el diario.')
      nav(`/pet/${petId}/hoy`)
    } catch (err) {
      setJoinErr(describe(err))
    } finally {
      setBusy(null)
    }
  }

  const syncNow = async () => {
    try {
      await (await getSync()).sync()
    } catch (err) {
      toast.show(describe(err))
    }
  }

  const items: PagedItem[] = (pets ?? []).map((p) => {
    const l = byPet.get(p.id)
    return {
      key: p.id,
      node: (
        <div className="share-row">
          <Avatar pet={p} />
          <span className="txt">
            <b>{p.name}</b>
            <small>{l ? `Compartida · ${ago(l.lastSync)}` : 'Solo en este móvil'}</small>
          </span>
          <button
            className={`btn ${l ? 'tonal' : 'primary'} sm`}
            disabled={!configured || busy !== null}
            onClick={() => (l ? setInvite({ pet: p, link: l }) : doShare(p))}
          >
            {busy === p.id ? 'Preparando…' : l ? 'Invitar' : 'Compartir'}
          </button>
        </div>
      ),
    }
  })

  return (
    <div className="app">
      <Backdrop scene="settings" />
      <header className="topbar">
        <button className="icon-btn" onClick={() => (history.length > 1 ? nav(-1) : nav('/'))} aria-label="Volver">
          <IconBack />
        </button>
        <h1>Compartir</h1>
      </header>
      <main className="screen share-screen">
        <p className="share-intro">
          Varias personas pueden llevar el diario de la misma mascota, cada una desde su móvil. Los datos viajan <b>cifrados</b>: ni el servidor puede leerlos.
        </p>
        {!configured && (
          <p className="status err" role="status">
            Falta conectar el servidor de PetLog. En cuanto esté, podrás compartir desde aquí.
          </p>
        )}
        <div className="share-list">
          <Paged items={items} rowRem={4.25} headRem={0} label="Mascotas" rowClass="plain" empty={<p className="hint">Aún no tienes mascotas. Si te han invitado, únete con el código.</p>} />
        </div>
        {links.length > 0 && (
          <div className={`sync-line ${status.state}`} role="status">
            <span>{status.state === 'syncing' ? 'Sincronizando…' : status.state === 'error' ? status.error : status.lastSync ? `Todo al día · ${ago(status.lastSync).replace('sincronizada ', '')}` : 'Sincronización activa'}</span>
            <button className="link-btn" onClick={syncNow} disabled={status.state === 'syncing'}>
              Sincronizar ahora
            </button>
          </div>
        )}
        <button className="btn tonal block" disabled={!configured} onClick={() => setJoining('')}>
          Unirme con un código
        </button>
      </main>

      {invite && <InviteSheet pet={invite.pet} link={invite.link} onClose={() => setInvite(null)} onChange={(link) => setInvite({ pet: invite.pet, link })} />}

      {joining !== null && (
        <Sheet
          title="Unirme a una mascota"
          onClose={() => {
            setJoining(null)
            setParams({}, { replace: true })
          }}
        >
          <form
            className="join-form"
            onSubmit={(e) => {
              e.preventDefault()
              void doJoin(joining)
            }}
          >
            <label htmlFor="join-code" className="lbl">
              Código de invitación
            </label>
            <textarea
              id="join-code"
              className="input code"
              rows={3}
              value={joining}
              placeholder="Pega aquí el mensaje o el código (empieza por PL1.)"
              onChange={(e) => setJoining(e.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {joinErr && (
              <p className="status err" role="alert">
                {joinErr}
              </p>
            )}
            <p className="hint">Se añadirá la mascota con todo su historial. A partir de ahí, lo que anote cualquiera lo verán todos.</p>
            <button className="btn primary block" type="submit" disabled={busy !== null || joining.trim().length < 20}>
              {busy === 'join' ? 'Uniéndome…' : 'Unirme'}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  )
}

function InviteSheet({ pet, link, onClose, onChange }: { pet: Pet; link: ShareLink; onClose: () => void; onChange: (l: ShareLink) => void }) {
  const toast = useToast()
  const [qr, setQr] = useState('')
  const [members, setMembers] = useState<number | null>(null)
  const code = makeCode(link)

  useEffect(() => {
    void QRCode.toString(joinUrl(code), { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1d1630', light: '#ffffff' } }).then(setQr)
  }, [code])
  useEffect(() => {
    void getSync()
      .then((e) => e.memberCount(pet.id))
      .then(setMembers, () => setMembers(null))
  }, [pet.id, link.invite])

  return (
    <Sheet title={`Invitar a ${pet.name}`} onClose={onClose}>
      <div className="invite">
        <div className="qr" role="img" aria-label="Código QR de la invitación" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="hint">
          Escanéalo con la cámara del otro móvil (con PetLog instalado), o envíale la invitación.
          {members !== null && (members === 1 ? ' Por ahora solo la tienes tú.' : ` Ahora la comparten ${members} dueños.`)}
        </p>
        <div className="invite-actions">
          <button
            className="btn primary"
            onClick={async () => {
              const r = await shareText(`Diario de ${pet.name} en PetLog`, inviteText(pet, code))
              if (r === 'copied') toast.show('Invitación copiada')
            }}
          >
            Enviar invitación
          </button>
          <button className="btn tonal" onClick={async () => toast.show((await copyText(code)) ? 'Código copiado' : 'No se pudo copiar')}>
            Copiar código
          </button>
        </div>
        <div className="invite-more">
          <button
            className="link-btn"
            onClick={async () => {
              if (!(await confirmDialog('El código y el QR actuales dejarán de servir para unirse. Quien ya comparte la mascota seguirá dentro.', { confirmLabel: 'Crear nueva' }))) return
              try {
                onChange(await (await getSync()).renewInvite(pet.id))
                toast.show('Nueva invitación lista')
              } catch (e) {
                toast.show(describe(e))
              }
            }}
          >
            Nueva invitación
          </button>
          <button
            className="link-btn danger"
            onClick={async () => {
              if (!(await confirmDialog(`Este móvil dejará de recibir y enviar cambios de ${pet.name}. Los datos que ya tienes se quedan aquí, y los demás dueños siguen con los suyos.`, { confirmLabel: 'Dejar de compartir', danger: true }))) return
              try {
                await (await getSync()).unshare(pet.id)
                onClose()
                toast.show('Ya no se comparte en este móvil')
              } catch (e) {
                toast.show(describe(e))
              }
            }}
          >
            Dejar de compartir en este móvil
          </button>
        </div>
      </div>
    </Sheet>
  )
}
