const KEY = 'petlog:lastPet'

export function rememberPet(id: string) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* almacenamiento no disponible: solo se pierde la comodidad */
  }
}

export function lastPet(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}
