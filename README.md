# PetLog

Diario y historial médico para perros, gatos, conejos, hámsteres y otros roedores, pájaros y serpientes u otros reptiles. *Un toque para registrar. Cinco segundos para enseñárselo al veterinario.*

Privacy-first: sin cuentas, sin anuncios y sin analítica. Los datos viven en el dispositivo. Solo si compartes una mascota con otros dueños, sus datos viajan **cifrados de extremo a extremo** por Firebase.

Diseño y decisiones: [`docs/DISENO.md`](docs/DISENO.md).

## Qué hace (implementado y probado)

- Varias mascotas con ficha (foto, especie, raza, sexo, nacimiento, veterinario, patologías, alergias, notas).
- Rejilla de botones grandes por mascota: ocultar, reordenar y crear botones propios. **El toque registra** con fecha y hora; después se añade intensidad (un toque), nota o foto, o se pulsa *Deshacer*.
- Peso, vet/citas (con fecha futura) y «Otro» abren una hoja corta porque necesitan un dato.
- Medicación: tratamientos con dosis, unidad, horas, frecuencia (cada día, día sí/no, cada N días, «si hace falta»), inicio, fin y notas. Estados de toma: **administrada, con retraso, omitida, retrasada/pendiente, sin registrar**. Si se cambia el horario de un tratamiento con historial, la pauta anterior se cierra y se crea una nueva para no falsear el cumplimiento pasado.
- Historial por día con filtros por tipo y periodo; editar y borrar.
- Gráficas automáticas: peso, episodios por día/semana, frecuencia por tipo, apetito, cumplimiento y cualquier botón propio con número.
- Informe para el veterinario (24 h, 7 d, 30 d, personalizado). **Página 1: infografía** (foto o ilustración, ficha con patologías y alergias, resumen del periodo con iconos, evolución del peso, episodios por día, registros por tipo, medicación actual, visitas al veterinario y observaciones), igual en PDF y HTML (`src/report/cover*.ts`); en pantalla estrecha las tarjetas se apilan. Desde la página 2, el informe detallado con las 9 secciones pedidas. La pestaña Informe muestra la portada en miniatura: tocarla abre el informe completo. Solo recuentos, fechas y las notas literales del propietario; **no diagnostica ni recomienda** (hay un test que lo vigila).
- Exportación: vista en la app, PDF (vectorial), HTML autónomo, hoja de compartir del sistema, guardar archivo, resumen en texto por WhatsApp/correo.
- Especies: perro, gato, conejo, hámster/roedor, pájaro y serpiente/reptil. Cada una empieza con sus botones (p. ej. muda, temperatura y regurgitación en reptiles; actividad en roedores y conejos) y su unidad de peso (g o kg). Los demás botones quedan ocultos en «Personalizar botones».
- Icono de la app elegible en Ajustes (solo Android): gato, perro, conejo, hámster, pájaro o serpiente. Usa `activity-alias` y un complemento nativo propio (`AppIconPlugin`).
- Consejos de cuidado por especie (comida, higiene, actividad, hogar y salud): fichas ilustradas que se pasan deslizando, cada una con su fuente (RSPCA, PDSA, International Cat Care, Rabbit Welfare Association, Royal Veterinary College, CDC…). Son consejos generales: sin dosis ni diagnósticos. El contenido está en `src/domain/tips.ts`.
- Compartir una mascota entre varios dueños (Ajustes → Compartir): cada móvil sube y baja los cambios de esa mascota (ficha, botones, registros con sus fotos, tratamientos y tomas). Los informes no se suben: se generan en cada móvil. Invitación por código o QR (`petlog://unirse/…`), nueva invitación, dejar de compartir. Ver «Sincronización» más abajo.
- Anotar por voz: micrófono en la cabecera de la mascota. Entiende los nombres de los botones (también los propios, sin tildes), intensidad («vómito leve», «diarrea»), cantidades con unidad («200 ml», «cuatro coma dos kilos», «medio litro»), la medicación por el nombre del tratamiento (dada u omitida), tomas sueltas («5 mg de meloxicam»), la hora («a las 8 y media», «hace dos horas», «ayer a las 10»), la mascota por su nombre, varias cosas en una frase («agua y comida»), «deshacer» y preguntas («¿cuántos vómitos lleva hoy?», «¿cuándo fue la última toma?»). Guarda al momento con Deshacer y, si se activa, lo confirma en voz alta. Intérprete propio en `src/voice/parse.ts` (sin IA ni red), dictado con el complemento nativo `VoicePlugin` (reconocimiento en el teléfono en Android 12+ si el idioma está descargado; si no, el servicio de voz del sistema; y como último recurso la ventana de dictado de Android). También se puede escribir la frase. «¿Qué puedo decir?» (botón, o diciéndolo: «qué puedo decir», «ayuda», «qué frases entiendes»…) enseña todas las frases por categorías (Anotar, Cómo fue, Medicación, Cuándo, Varias cosas y notas, Preguntas) con los nombres reales de la mascota; un test comprueba que cada frase de la ayuda se entiende (`src/voice/help.ts`). El logo de voz es una carita de mascota cuyo hocico es el micrófono (`ic_voice_face.xml`, `VoiceFace.tsx`).
- Accesos directos de voz (Android): widget pequeño con micrófono, widget grande con micrófono + los tres primeros botones de la mascota y botón «Anotar por voz» en los ajustes rápidos. Abren la app con `petlog://voz` o `petlog://anotar/<botón>?pet=<mascota>`; el registro se guarda dentro de la app (los widgets no leen ni guardan registros).
- Atajo «Anotar por voz» al mantener pulsado el icono (Android 7.1+), que abre `petlog://voz` como el micro del widget:
  - Atajo fijo en `res/xml/shortcuts.xml`, enlazado con `<meta-data android:name="android.app.shortcuts">` en cada `activity-alias` del lanzador (`IconCat`…`IconReptile`; el icono de la app se elige con esos alias, por eso no va en `MainActivity`). Comprobado que está dentro del APK compilado (0.3.18).
  - En un Xiaomi (lanzador MIUI) con la 0.3.18 instalada no apareció. La causa no está confirmada: no hay teléfono ni emulador en este entorno.
  - Desde la 0.3.19, al abrir la app `VoiceShortcut.java` pregunta a Android si publicó el atajo fijo (`getManifestShortcuts`); si no, publica uno equivalente por código (`voz-app`, mismo enlace e icono). Nunca los dos a la vez. Ese de respaldo necesita abrir la app una vez tras instalar o actualizar.
  - Ajustes → Icono de la app muestra qué atajo tiene publicado el sistema (fijo, de la app o ninguno).
- Copia de seguridad/restauración en JSON (combina por «gana el más reciente»), tema claro/oscuro/automático.

## Arquitectura

`domain` (reglas puras) → `data` (Dexie/IndexedDB tras `LocalRepository`) → `charts` (SVG) → `report` (HTML/PDF) → `platform` (Capacitor) → `ui` (React).
Datos con UUID, `updatedAt` y borrado lógico, listos para una sincronización futura.

## Sincronización entre dueños

- **Servidor:** Firebase con acceso anónimo y Cloud Firestore (SDK «lite», solo REST). Código en `src/sync/`; reglas en `firebase/firestore.rules`.
- **Cifrado:** cada mascota compartida tiene una clave AES-256 que solo viaja dentro de la invitación (`PL1.<grupo>.<invitación>.<clave>`). El móvil cifra cada registro con AES-GCM antes de subirlo, y el identificador del documento es un HMAC: el servidor no ve nombres, tipos de registro ni fechas de la mascota.
- **Reglas:** solo los miembros de un grupo leen y escriben sus registros. Para entrar hace falta una invitación vigente, que nadie puede leer, solo comprobar. Cada registro lleva la hora del servidor y su autor.
- **Conflictos:** por cada registro gana el `updatedAt` más reciente. Los borrados son lógicos, así que también se propagan.
- **Pruebas:** `tests/sync.test.ts` prueba dos móviles contra un servidor en memoria con las mismas comprobaciones. El flujo `.github/workflows/firebase.yml` prueba las reglas (`firebase/test/reglas.test.mjs`) y la sincronización real contra los emuladores oficiales (`tests/firebase-emulator.test.ts`).
- **Configurar:** el proyecto es `petloj-72431` (Firestore en europe-southwest1, acceso anónimo sin limpieza automática). Su `firebaseConfig` está en `src/sync/config.ts` y publica las reglas, con `firebase deploy --only firestore:rules` desde `firebase/` o pegándolas en la consola. Mientras `FIREBASE_CONFIG` sea `null`, la pantalla Compartir avisa de que falta el servidor.
- **En desarrollo:** `localStorage.setItem('petlog-dev-sync', '1')` usa un servidor simulado en memoria para revisar las pantallas.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 143 pruebas (dominio, datos, informe, contraste, voz)
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

#### Firmar un APK compilado sin secretos

Si los secretos no están configurados, el APK de Actions sale con una firma de prueba (se publica como versión preliminar «firma de prueba») y **no debe instalarse encima**. Para convertirlo en una actualización válida se firma con la clave de PetLog en local, sin Android SDK:

```bash
pip install cryptography
PETLOG_KEYSTORE_PASSWORD='…' python3 scripts/sign_apk.py PetLog-0.3.N-firma-de-prueba.apk PetLog-0.3.N.apk petlog-release.keystore petlog
```

El script aplica el esquema de firma APK v2 (RSA + SHA-256), sustituye la firma anterior y no toca el contenido ni la alineación del ZIP. Comprobado con `apksigtool verify`. Mientras se firme siempre con la misma clave y el número de versión suba, Android instala cada APK encima del anterior conservando los datos.

La app Android pide internet (solo para compartir mascotas) y micrófono (solo al anotar por voz, y lo pide la primera vez) y excluye sus datos de la copia en la nube de Google; el traspaso directo entre teléfonos sí está permitido.

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
- **Compartir:** probado con el servidor simulado y, en CI, contra los emuladores de Firebase. Probado contra el proyecto real desde CI (`.github/workflows/firebase-real.yml`); falta probarlo entre dos teléfonos. La sesión anónima se pierde si se reinstala la app: hay que volver a unirse con el código. El abuso de cuota no está limitado (App Check pendiente).
- **Voz, widgets y ajustes rápidos:** el intérprete está probado con tests y la hoja, en Chrome escribiendo la frase. El dictado nativo, el permiso de micrófono, la voz de confirmación, los widgets y el botón de ajustes rápidos solo se han compilado en CI. **El atajo del icono no se ha visto funcionar en ningún teléfono** (en el Xiaomi del autor no aparecía con la 0.3.18). Sin Google Assistant (App Actions).
- **Pendiente (no implementado):** recordatorios/notificaciones de tomas, otros idiomas, cifrado de la copia, importar analíticas.
- Las fotos se reducen a ≤1024 px y se guardan dentro de la base (y de las copias): muchas fotos engordan las copias.
- Probado solo con la zona horaria Europe/Madrid.
