import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { repo } from '../../data/instance'
import type { Pet, Sex, Species } from '../../domain/types'
import { fileToSmallDataUrl, pickImage } from '../../platform/photo'
import { Avatar, Field, Seg, Sheet, TagInput, confirmDialog } from '../components'
import { IconTrash } from '../icons'
import { PetIllustration } from '../art/pets'
import { SPECIES, SPECIES_ORDER } from '../../domain/eventTypes'

/** Nombre corto en el selector (el completo va en la etiqueta accesible). */
const SHORT: Record<Species, string> = { dog: tl('Perro'), cat: tl('Gato'), rabbit: tl('Conejo'), rodent: tl('Hámster'), bird: tl('Pájaro'), reptile: tl('Serpiente') }
import { rememberPet } from '../nav'
import { useUsableHeight } from '../layout'
import { tl } from '../../i18n'

type Part = 'data' | 'health' | 'vet'

/** Alta y edición de la ficha, en tres partes cortas para que nada necesite scroll. `pet` ausente = alta. */
export function PetForm({ pet }: { pet?: Pet }) {
  const usable = useUsableHeight()
  const nav = useNavigate()
  const [part, setPart] = useState<Part>('data')
  const [name, setName] = useState(pet?.name ?? '')
  const [species, setSpecies] = useState<Species>(pet?.species ?? 'dog')
  const [sex, setSex] = useState<Sex>(pet?.sex ?? 'unknown')
  const [breed, setBreed] = useState(pet?.breed ?? '')
  const [birth, setBirth] = useState(pet?.birthDate ?? '')
  const [weight, setWeight] = useState('')
  const [photo, setPhoto] = useState(pet?.photo)
  const [photoMenu, setPhotoMenu] = useState(false)
  const [vetName, setVetName] = useState(pet?.vet.name ?? '')
  const [clinic, setClinic] = useState(pet?.vet.clinic ?? '')
  const [phone, setPhone] = useState(pet?.vet.phone ?? '')
  const [conditions, setConditions] = useState(pet?.conditions ?? [])
  const [allergies, setAllergies] = useState(pet?.allergies ?? [])
  const [notes, setNotes] = useState(pet?.notes ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const choosePhoto = async () => {
    setPhotoMenu(false)
    const f = await pickImage()
    if (f) {
      try {
        setPhoto(await fileToSmallDataUrl(f, 512))
      } catch {
        setError(tl('No se pudo leer esa imagen.'))
      }
    }
  }

  const save = async () => {
    if (!name.trim()) {
      setPart('data')
      return setError(tl('Escribe el nombre de tu mascota.'))
    }
    const w = weight.trim() ? Number(weight.replace(',', '.')) : undefined
    if (w !== undefined && (!Number.isFinite(w) || w <= 0)) {
      setPart('data')
      return setError(tl('El peso no es un número válido.'))
    }
    setBusy(true)
    const data = {
      name: name.trim(),
      species,
      sex,
      breed: breed.trim() || undefined,
      birthDate: birth || undefined,
      photo,
      vet: { name: vetName.trim() || undefined, clinic: clinic.trim() || undefined, phone: phone.trim() || undefined },
      conditions,
      allergies,
      notes: notes.trim() || undefined,
    }
    try {
      if (pet) {
        await repo.updatePet(pet.id, data)
        nav(`/pet/${pet.id}/hoy`, { replace: true })
      } else {
        const created = await repo.createPet(data, w)
        rememberPet(created.id)
        nav(`/pet/${created.id}/hoy`, { replace: true })
      }
    } catch {
      setError(tl('No se pudo guardar.'))
      setBusy(false)
    }
  }

  const healthCount = conditions.length + allergies.length + (notes.trim() ? 1 : 0)
  const vetCount = [vetName, clinic, phone].filter((x) => x.trim()).length

  // Con barras del sistema altas (Android) o pantallas bajas, el formulario se compacta para no solaparse con el botón.
  const tight = usable < 620
  // En pantallas muy bajas, al crear, la raza (opcional) pasa a la pestaña Salud para que nada quede tapado.
  const breedInHealth = !pet && usable < 530
  const veryShort = usable < 530
  return (
    <>
      <Seg<Part>
        label={tl('Parte de la ficha')}
        value={part}
        onChange={setPart}
        options={[
          { value: 'data', label: tl('Datos') },
          { value: 'health', label: tl('Salud{0}', healthCount ? ` · ${healthCount}` : '') },
          { value: 'vet', label: tl('Veterinario{0}', vetCount ? ' ✓' : '') },
        ]}
      />

      <div className={`form-area${tight ? ' tight' : ''}`}>
        {part === 'data' && (
          <>
            <div className="row" style={{ gap: 'var(--s4)', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="photo-pick"
                onClick={() => (photo ? setPhotoMenu(true) : choosePhoto())}
                aria-label={photo ? tl('Cambiar o quitar la foto') : tl('Añadir foto')}
              >
                <Avatar large pet={{ photo, species, name }} />
                <span className="badge-cam" aria-hidden="true">
                  📷
                </span>
              </button>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="p-name" className="lbl">
                  {tl('Nombre')}
                </label>
                <input
                  id="p-name"
                  className="input"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  autoComplete="off"
                />
              </div>
            </div>
            <Field label={tl('Especie: {0}', SHORT[species])}>
              <div className="species-grid" role="radiogroup" aria-label={tl('Especie')}>
                {SPECIES_ORDER.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    role="radio"
                    aria-checked={species === sp}
                    aria-label={SPECIES[sp].pick}
                    className="species-opt"
                    onClick={() => setSpecies(sp)}
                  >
                    <PetIllustration species={sp} size={34} />
                  </button>
                ))}
              </div>
              {pet && species !== pet.species && (
                <span className="hint">{tl('Tus botones se mantienen. Los propios de esta especie aparecerán ocultos en «Personalizar botones».')}</span>
              )}
            </Field>
            <Field label={tl('Sexo')}>
              <Seg<Sex> label={tl('Sexo')} value={sex} onChange={setSex} options={[{ value: 'female', label: tl('Hembra') }, { value: 'male', label: tl('Macho') }, { value: 'unknown', label: tl('No sé') }]} />
            </Field>
            <div className="two">
              <div className="field">
                <label htmlFor="p-birth" className="lbl">
                  {tl('Nacimiento')}
                </label>
                <input id="p-birth" className="input" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
              </div>
              {pet ? (
                <div className="field">
                  <label htmlFor="p-breed" className="lbl">
                    {tl('Raza')}
                  </label>
                  <input id="p-breed" className="input" value={breed} onChange={(e) => setBreed(e.target.value)} />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="p-weight" className="lbl">
                    {tl('Peso (')}{SPECIES[species].weightUnit})
                  </label>
                  <input
                    id="p-weight"
                    className="input"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={SPECIES[species].weightUnit === 'g' ? 'p. ej. 120' : 'p. ej. 4,2'}
                  />
                </div>
              )}
            </div>
            {pet ? (
              veryShort ? null : <p className="hint">{tl('El peso se anota con el botón «Peso»; aquí se muestra siempre el último.')}</p>
            ) : breedInHealth ? null : (
              <div className="field">
                <label htmlFor="p-breed" className="lbl">
                  {tl('Raza (opcional)')}
                </label>
                <input id="p-breed" className="input" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
            )}
          </>
        )}

        {part === 'health' && (
          <>
            {breedInHealth && (
              <div className="field">
                <label htmlFor="p-breed" className="lbl">
                  {tl('Raza (opcional)')}
                </label>
                <input id="p-breed" className="input" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
            )}
            <TagInput label={tl('Patologías')} values={conditions} onChange={setConditions} placeholder={tl('p. ej. Insuficiencia renal')} />
            <TagInput label={tl('Alergias')} values={allergies} onChange={setAllergies} placeholder={tl('p. ej. Pollo')} />
            <div className="field" style={{ flex: 1, minHeight: 0 }}>
              <label htmlFor="p-notes" className="lbl">
                {tl('Notas generales')}
              </label>
              <textarea id="p-notes" className="input grow" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tl('Lo que quieras que conste en el informe')} />
            </div>
          </>
        )}

        {part === 'vet' && (
          <>
            <div className="field">
              <label htmlFor="p-vet" className="lbl">
                {tl('Veterinario')}
              </label>
              <input id="p-vet" className="input" value={vetName} onChange={(e) => setVetName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-clinic" className="lbl">
                {tl('Clínica')}
              </label>
              <input id="p-clinic" className="input" value={clinic} onChange={(e) => setClinic(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-phone" className="lbl">
                {tl('Teléfono')}
              </label>
              <input id="p-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <p className="hint">{tl('Estos datos aparecen en la cabecera del informe.')}</p>
          </>
        )}
      </div>

      {error && (
        <p className="error" role="alert" style={{ flex: 'none' }}>
          {error}
        </p>
      )}
      <div className="foot">
        {pet && (
          <button
            className="btn danger"
            aria-label={tl('Eliminar a {0}', pet.name)}
            onClick={async () => {
              const shared = ((await repo.db.meta.get('sync:links'))?.value as { petId: string }[] | undefined)?.some((l) => l.petId === pet.id)
              const msg = shared
                ? tl('{0} está compartida: se eliminará también para los demás dueños. Si solo quieres quitarla de tu móvil, usa antes «Dejar de compartir» en Ajustes → Compartir.', pet.name)
                : tl('¿Eliminar a {0} y todos sus registros de este dispositivo? Haz antes una copia de seguridad si quieres conservarlos.', pet.name)
              if (await confirmDialog(msg)) {
                await repo.deletePet(pet.id)
                nav('/', { replace: true })
              }
            }}
          >
            <IconTrash />
          </button>
        )}
        <button className="btn primary" onClick={save} disabled={busy}>
          {pet ? tl('Guardar ficha') : tl('Crear mascota')}
        </button>
      </div>

      {photoMenu && (
        <Sheet title={tl('Foto')} onClose={() => setPhotoMenu(false)}>
          <button className="btn primary block" onClick={choosePhoto}>
            {tl('Elegir otra foto')}
          </button>
          <button
            className="btn danger block"
            onClick={() => {
              setPhoto(undefined)
              setPhotoMenu(false)
            }}
          >
            {tl('Quitar foto')}
          </button>
        </Sheet>
      )}
    </>
  )
}

export function PetFormEdit() {
  const { pet } = useOutletContext<{ pet: Pet }>()
  return <PetForm pet={pet} key={pet.id} />
}
