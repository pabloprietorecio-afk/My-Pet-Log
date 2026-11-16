import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import type { FileStore } from '../data/nativeMirror'

const FILE = 'petlog-espejo.json'
const TMP = 'petlog-espejo.tmp'

/** Archivo privado de la app (Directory.Data), escritura segura: temporal + renombrar. */
export const capacitorMirrorStore: FileStore = {
  async read() {
    try {
      const r = await Filesystem.readFile({ path: FILE, directory: Directory.Data, encoding: Encoding.UTF8 })
      return typeof r.data === 'string' ? r.data : await (r.data as Blob).text()
    } catch {
      return null
    }
  },
  async write(content) {
    await Filesystem.writeFile({ path: TMP, directory: Directory.Data, data: content, encoding: Encoding.UTF8 })
    try {
      await Filesystem.deleteFile({ path: FILE, directory: Directory.Data })
    } catch {
      /* no existía */
    }
    await Filesystem.rename({ from: TMP, to: FILE, directory: Directory.Data, toDirectory: Directory.Data })
  },
}
