import { SCHEMA_VERSION } from '../domain/types'
import type { BackupData, LocalRepository, MergeResult } from './repository'

export const BACKUP_FORMAT = 'petlog-backup'

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  schemaVersion: number
  exportedAt: string
  deviceId: string
  data: BackupData
}

export class BackupError extends Error {}

export async function createBackup(repo: LocalRepository): Promise<BackupFile> {
  const [data, settings] = await Promise.all([repo.exportAll(), repo.ensureSettings()])
  return {
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    deviceId: settings.deviceId,
    data,
  }
}

export function serializeBackup(b: BackupFile): string {
  return JSON.stringify(b)
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0

function checkRows(name: string, rows: unknown, required: string[]): void {
  if (!Array.isArray(rows)) throw new BackupError(`La copia no es válida: falta «${name}».`)
  rows.forEach((r, i) => {
    if (!isObj(r) || !isStr(r.id) || !isStr(r.createdAt) || !isStr(r.updatedAt)) {
      throw new BackupError(`La copia no es válida: registro ${i + 1} de «${name}» incompleto.`)
    }
    for (const f of required) {
      if (!isStr(r[f])) throw new BackupError(`La copia no es válida: «${name}» ${i + 1} sin «${f}».`)
    }
  })
}

/** Valida estructuralmente un texto de copia. Lanza BackupError con mensaje en español. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('El archivo no es una copia de PetLog (no se puede leer).')
  }
  if (!isObj(raw) || raw.format !== BACKUP_FORMAT) {
    throw new BackupError('El archivo no es una copia de PetLog.')
  }
  if (typeof raw.schemaVersion !== 'number' || raw.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError('La copia es de una versión más nueva de PetLog. Actualiza la app para restaurarla.')
  }
  const data = raw.data
  if (!isObj(data)) throw new BackupError('La copia no es válida: faltan los datos.')
  checkRows('pets', data.pets, ['name'])
  checkRows('eventTypes', data.eventTypes, ['petId', 'key', 'label'])
  checkRows('events', data.events, ['petId', 'typeId', 'at'])
  checkRows('treatments', data.treatments, ['petId', 'name'])
  checkRows('doseLogs', data.doseLogs, ['petId', 'at', 'status'])
  return raw as unknown as BackupFile
}

export async function restoreBackup(repo: LocalRepository, text: string): Promise<MergeResult> {
  const file = parseBackup(text)
  return repo.importMerge(file.data)
}

export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `petlog-copia-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`
}
