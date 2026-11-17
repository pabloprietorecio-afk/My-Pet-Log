# PetLog

Diario y historial médico para perros, gatos, conejos, hámsteres y otros roedores, pájaros y serpientes u otros reptiles. *Un toque para registrar. Cinco segundos para enseñárselo al veterinario.*

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
- Especies: perro, gato, conejo, hámster/roedor, pájaro y serpiente/reptil. Cada una empieza con sus botones (p. ej. muda, temperatura y regurgitación en reptiles; actividad en roedores y conejos) y su unidad de peso (g o kg). Los demás botones quedan ocultos en «Personalizar botones».
- Icono de la app elegible en Ajustes (solo Android): gato, perro, conejo, hámster, pájaro o serpiente. Usa `activity-alias` y un complemento nativo propio (`AppIconPlugin`).
- Consejos de cuidado por especie (comida, higiene, actividad, hogar y salud): fichas ilustradas que se pasan deslizando, cada una con su fuente (RSPCA, PDSA, International Cat Care, Rabbit Welfare Association, Royal Veterinary College, CDC…). Son consejos generales: sin dosis ni diagnósticos. El contenido está en `src/domain/tips.ts`.
- Copia de seguridad/restauración en JSON (combina por «gana el más reciente»), tema claro/oscuro/automático.

## Arquitectura

`domain` (reglas puras) → `data` (Dexie/IndexedDB tras `LocalRepository`) → `charts` (SVG) → `report` (HTML/PDF) → `platform` (Capacitor) → `ui` (React).
Datos con UUID, `updatedAt` y borrado lógico, listos para una sincronización futura.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 91 pruebas (dominio, datos, informe, contraste)
npm run build        # typecheck + build de producción en dist/
node tests/e2e-species.mjs  # especies: botones y unidad de peso
node tests/e2e-tips.mjs     # Consejos: todas las fichas, temas, deslizar y fuentes
node tests/e2e.mjs   # prueba de humo en Chrome real (requiere `npm run dev -- --port 5199` y Chrome)
npm run test:e2e     # prueba funcional completa (88 comprobaciones), simula el teclado del móvil
```

### APK de Android (GitHub Actions)

Cada push a `main` ejecuta `.github/workflows/android.yml`: pruebas, build web, `cap sync`, `gradlew assembleRelease`, y publica el APK en **Releases** del repositorio (también queda como artefacto de la ejecución). También se puede lanzar a mano desde la pestaña *Actions* («Run workflow»).

Para que cada APK se instale **encima** del anterior (sin desinstalar ni perder datos) hace falta firmar siempre con la misma clave. Añade estos secretos en *Settings → Secrets and variables → Actions*:

| Secreto | Valor |
|---|---|
| `PETLOG_KEYSTORE_BASE64` | el archivo `petlog-release.keystore` en base64 (`base64 -w0 petlog-release.keystore`) |
| `PETLOG_KEYSTORE_PASSWORD` | contraseña del almacén (la clave usa la misma; alias `petlog`) |

Cada compilación sube `versionCode` (número de ejecución de Actions) y `versionName` (`0.3.<n>`), que también se ve en Ajustes.

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
- **Icono de la app:** sin probar en un teléfono. Según el lanzador, el cambio puede tardar unos segundos, y algunos quitan el acceso directo del escritorio (la app sigue en el cajón). En iOS no está implementado.
- **Pendiente (no implementado):** sincronización entre dispositivos, recordatorios/notificaciones de tomas, otros idiomas, cifrado de la copia, importar analíticas.
- Las fotos se reducen a ≤1024 px y se guardan dentro de la base (y de las copias): muchas fotos engordan las copias.
- Probado solo con la zona horaria Europe/Madrid.
