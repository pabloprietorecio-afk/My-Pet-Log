# PetLog

Diario y historial médico para perros y gatos. *Un toque para registrar. Cinco segundos para enseñárselo al veterinario.*

Privacy-first: sin cuentas, sin servidores, sin analítica y **sin ninguna conexión de red**. Los datos viven en el dispositivo.

Diseño y decisiones: [`docs/DISENO.md`](docs/DISENO.md).

## Qué hace (implementado y probado)

- Varias mascotas con ficha (foto, especie, raza, sexo, nacimiento, veterinario, patologías, alergias, notas).
- Rejilla de botones grandes por mascota: ocultar, reordenar y crear botones propios. **El toque registra** con fecha y hora; después se añade intensidad (un toque), nota o foto, o se pulsa *Deshacer*.
- Peso, vet/citas (con fecha futura) y «Otro» abren una hoja corta porque necesitan un dato.
- Medicación: tratamientos con dosis, unidad, horas, frecuencia (cada día, día sí/no, cada N días, «si hace falta»), inicio, fin y notas. Estados de toma: **administrada, con retraso, omitida, retrasada/pendiente, sin registrar**. Si se cambia el horario de un tratamiento con historial, la pauta anterior se cierra y se crea una nueva para no falsear el cumplimiento pasado.
- Historial por día con filtros por tipo y periodo; editar y borrar.
- Gráficas automáticas: peso, episodios por día/semana, frecuencia por tipo, apetito, cumplimiento y cualquier botón propio con número.
- Informe para el veterinario (24 h, 7 d, 30 d, personalizado) con las 9 secciones pedidas. Solo recuentos, fechas y las notas literales del propietario; **no diagnostica ni recomienda** (hay un test que lo vigila).
- Exportación: vista en la app, PDF (vectorial), HTML autónomo, hoja de compartir del sistema, guardar archivo, resumen en texto por WhatsApp/correo.
- Copia de seguridad/restauración en JSON (combina por «gana el más reciente»), tema claro/oscuro/automático.

## Arquitectura

`domain` (reglas puras) → `data` (Dexie/IndexedDB tras `LocalRepository`) → `charts` (SVG) → `report` (HTML/PDF) → `platform` (Capacitor) → `ui` (React).
Datos con UUID, `updatedAt` y borrado lógico, listos para una sincronización futura.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 84 pruebas (dominio, datos, informe, contraste)
npm run build        # typecheck + build de producción en dist/
node tests/e2e.mjs   # prueba de humo en Chrome real (requiere `npm run dev -- --port 5199` y Chrome)
```

### APK de Android (GitHub Actions)

Cada push a `main` ejecuta `.github/workflows/android.yml`: pruebas, build web, `cap sync`, `gradlew assembleRelease`, y publica el APK en **Releases** del repositorio (también queda como artefacto de la ejecución). También se puede lanzar a mano desde la pestaña *Actions* («Run workflow»).

Para que cada APK se instale **encima** del anterior (sin desinstalar ni perder datos) hace falta firmar siempre con la misma clave. Añade estos secretos en *Settings → Secrets and variables → Actions*:

| Secreto | Valor |
|---|---|
| `PETLOG_KEYSTORE_BASE64` | el archivo `petlog-release.keystore` en base64 (`base64 -w0 petlog-release.keystore`) |
| `PETLOG_KEYSTORE_PASSWORD` | contraseña del almacén |
| `PETLOG_KEY_PASSWORD` | contraseña de la clave (la misma) |
| `PETLOG_KEY_ALIAS` | `petlog` |

Sin esos secretos el APK se firma con una clave de depuración: se instala, pero una versión posterior puede pedir desinstalar la anterior. La clave **nunca** se sube al repositorio (está en `.gitignore`).

La app Android no pide ningún permiso (ni siquiera internet) y excluye sus datos de la copia en la nube de Google; el traspaso directo entre teléfonos sí está permitido.

### Empaquetar como app en local (no probado en este entorno)

```bash
npm run build
npx cap add android   # y/o ios (iOS requiere macOS + Xcode)
npx cap sync
npx cap open android
```

## Qué NO está hecho / no está verificado

- **No se ha ejecutado en un móvil ni en un emulador.** Todo se probó en Chrome (escritorio, viewport de móvil) y con tests. Sin verificar en dispositivo: hoja de compartir nativa, `Filesystem`, selector de fotos/cámara en el WebView, apertura de `wa.me`/`mailto:`, teclas decimales, comportamiento del *safe area*.
- **Espejo de seguridad nativo:** la lógica está probada con un almacén simulado; la escritura real en `Directory.Data` no. Capacitor advierte de que el sistema puede reclamar IndexedDB (sobre todo iOS); por eso existe el espejo y la copia manual.
- «Guardar» en nativo abre la hoja de compartir del sistema (elegir *Guardar en Archivos*); no escribe en una carpeta fija.
- WhatsApp/correo: «Compartir informe en PDF» adjunta el PDF mediante la hoja del sistema (ahí aparecen WhatsApp, Gmail, etc.); los botones WhatsApp y Correo envían un resumen en texto ya escrito. En la app instalada se abren con el plugin `@capacitor/app-launcher` (tras instalar dependencias hay que ejecutar `npx cap sync`). Si un navegador bloquea la apertura, la app ofrece copiar el resumen.
- Comprobado en Chrome (escritorio, tamaño móvil): wa.me con el texto, mailto con asunto y cuerpo, copiar al portapapeles, descarga de PDF y HTML. No comprobado aún en un teléfono real ni dentro del visor de artefactos de Claude.
- **Pendiente (no implementado):** sincronización entre dispositivos, recordatorios/notificaciones de tomas, otros idiomas, cifrado de la copia, importar analíticas.
- Las fotos se reducen a ≤1024 px y se guardan dentro de la base (y de las copias): muchas fotos engordan las copias.
- Probado solo con la zona horaria Europe/Madrid.
