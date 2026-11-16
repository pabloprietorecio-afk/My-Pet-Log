import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { repo } from '../../data/instance'
import type { Pet, Sex, Species } from '../../domain/types'
import { fileToSmallDataUrl, pickImage } from '../../platform/photo'
import { Avatar, Field, Seg, Sheet, TagInput, confirmDialog } from '../components'
import { IconTrash } from '../icons'
import { PetIllustration } from '../art/pets'
import { rememberPet } from '../nav'

type Part = 'data' | 'health' | 'vet'

/** Alta y edición de la ficha, en tres partes cortas para que nada necesite scroll. `pet` ausente = alta. */
export function PetForm({ pet }: { pet?: Pet }) {
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
        setError('No se pudo leer esa imagen.')
      }
    }
  }

  const save = async () => {
    if (!name.trim()) {
      setPart('data')
      return setError('Escribe el nombre de tu mascota.')
    }
    const w = weight.trim() ? Number(weight.replace(',', '.')) : undefined
    if (w !== undefined && (!Number.isFinite(w) || w <= 0)) {
      setPart('data')
      return setError('El peso no es un número válido.')
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
      setError('No se pudo guardar.')
      setBusy(false)
    }
  }

  const healthCount = conditions.length + allergies.length + (notes.trim() ? 1 : 0)
  const vetCount = [vetName, clinic, phone].filter((x) => x.trim()).length

  return (
    <>
      <Seg<Part>
        label="Parte de la ficha"
        value={part}
        onChange={setPart}
        options={[
          { value: 'data', label: 'Datos' },
          { value: 'health', label: `Salud${healthCount ? ` · ${healthCount}` : ''}` },
          { value: 'vet', label: `Veterinario${vetCount ? ' ✓' : ''}` },
        ]}
      />

      <div className="form-area">
        {part === 'data' && (
          <>
            <div className="row" style={{ gap: 'var(--s4)', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="photo-pick"
                onClick={() => (photo ? setPhotoMenu(true) : choosePhoto())}
                aria-label={photo ? 'Cambiar o quitar la foto' : 'Añadir foto'}
              >
                <Avatar large pet={{ photo, species, name }} />
                <span className="badge-cam" aria-hidden="true">
                  📷
                </span>
              </button>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="p-name" className="lbl">
                  Nombre
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
            <Field label="Especie">
              <Seg<Species> label="Especie" value={species} onChange={setSpecies} options={[
                  { value: 'dog', label: <span className="seg-pet"><PetIllustration species="dog" size={26} />Perro</span>, text: 'Perro' },
                  { value: 'cat', label: <span className="seg-pet"><PetIllustration species="cat" size={26} />Gato</span>, text: 'Gato' },
                ]} />
            </Field>
            <Field label="Sexo">
              <Seg<Sex> label="Sexo" value={sex} onChange={setSex} options={[{ value: 'female', label: 'Hembra' }, { value: 'male', label: 'Macho' }, { value: 'unknown', label: 'No sé' }]} />
            </Field>
            <div className="two">
              <div className="field">
                <label htmlFor="p-birth" className="lbl">
                  Nacimiento
                </label>
                <input id="p-birth" className="input" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
              </div>
              {pet ? (
                <div className="field">
                  <label htmlFor="p-breed" className="lbl">
                    Raza
                  </label>
                  <input id="p-breed" className="input" value={breed} onChange={(e) => setBreed(e.target.value)} />
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="p-weight" className="lbl">
                    Peso (kg)
                  </label>
                  <input id="p-weight" className="input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="p. ej. 4,2" />
                </div>
              )}
            </div>
            {pet ? (
              <p className="hint">El peso se anota con el botón «Peso»; aquí se muestra siempre el último.</p>
            ) : (
              <div className="field">
                <label htmlFor="p-breed" className="lbl">
                  Raza (opcional)
                </label>
                <input id="p-breed" className="input" value={breed} onChange={(e) => setBreed(e.target.value)} />
              </div>
            )}
          </>
        )}

        {part === 'health' && (
          <>
            <TagInput label="Patologías" values={conditions} onChange={setConditions} placeholder="p. ej. Insuficiencia renal" />
            <TagInput label="Alergias" values={allergies} onChange={setAllergies} placeholder="p. ej. Pollo" />
            <div className="field" style={{ flex: 1, minHeight: 0 }}>
              <label htmlFor="p-notes" className="lbl">
                Notas generales
              </label>
              <textarea id="p-notes" className="input grow" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Lo que quieras que conste en el informe" />
            </div>
          </>
        )}

        {part === 'vet' && (
          <>
            <div className="field">
              <label htmlFor="p-vet" className="lbl">
                Veterinario
              </label>
              <input id="p-vet" className="input" value={vetName} onChange={(e) => setVetName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-clinic" className="lbl">
                Clínica
              </label>
              <input id="p-clinic" className="input" value={clinic} onChange={(e) => setClinic(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-phone" className="lbl">
                Teléfono
              </label>
              <input id="p-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
            </div>
            <p className="hint">Estos datos aparecen en la cabecera del informe.</p>
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
            aria-label={`Eliminar a ${pet.name}`}
            onClick={async () => {
              if (await confirmDialog(`¿Eliminar a ${pet.name} y todos sus registros de este dispositivo? Haz antes una copia de seguridad si quieres conservarlos.`)) {
                await repo.deletePet(pet.id)
                nav('/', { replace: true })
              }
            }}
          >
            <IconTrash />
          </button>
        )}
        <button className="btn primary" onClick={save} disabled={busy}>
          {pet ? 'Guardar ficha' : 'Crear mascota'}
        </button>
      </div>

      {photoMenu && (
        <Sheet title="Foto" onClose={() => setPhotoMenu(false)}>
          <button className="btn primary block" onClick={choosePhoto}>
            Elegir otra foto
          </button>
          <button
            className="btn danger block"
            onClick={() => {
              setPhoto(undefined)
              setPhotoMenu(false)
            }}
          >
            Quitar foto
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
