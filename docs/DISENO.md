# PetLog · Documento de diseño

> "Un toque para registrar. Cinco segundos para enseñárselo al veterinario."

## 1. Análisis del producto

**Usuario real:** una persona no técnica que cuida a una mascota mayor o con tratamiento continuado. Registra con prisa (la mascota acaba de vomitar, toca la pastilla de las 20:00) y no quiere "rellenar un formulario".

**Dolor concreto:** en consulta, el veterinario pregunta *cuándo, cuántas veces, desde cuándo*. WhatsApp y notas no responden a eso en 5 segundos.

**Dos momentos de uso que mandan sobre todo lo demás:**

| Momento | Requisito | Decisión |
|---|---|---|
| Registrar (en casa, con prisa, a veces de noche) | 1 toque, sin teclado | Rejilla de botones grandes; el toque **ya registra**; el detalle (intensidad, nota, foto) se añade *después* y es opcional |
| Enseñar (en consulta) | Informe limpio en < 5 s | Botón "Informe para el veterinario" siempre visible, periodo preconfigurado, vista previa inmediata |

**Lo que el producto NO es:** no diagnostica, no recomienda, no interpreta. Organiza lo que el propietario introdujo. Esto se aplica también al lenguaje del informe (solo recuentos, fechas y las notas literales del propietario).

## 2. MVP (el núcleo, bien hecho)

Mascota → registro ultrarrápido → historial → medicación → gráficas → informe → PDF/HTML → compartir.

**Dentro del MVP**
1. Varias mascotas (perro/gato) con ficha básica y foto.
2. Rejilla de botones configurables por mascota (ocultar, reordenar, crear propios).
3. Registro con 1 toque + enmienda posterior (intensidad / nota / foto / hora) + deshacer.
4. Historial cronológico por días, filtros por tipo y periodo, edición y borrado.
5. Tratamientos (nombre, dosis, unidad, frecuencia, horario, inicio, fin opcional, notas) y control de tomas con estados: **administrada · retrasada · omitida · pendiente/sin registrar**.
6. Gráficas automáticas: peso, vómitos por día/semana, frecuencia de síntomas, cumplimiento de medicación, apetito, y cualquier indicador propio.
7. Informe veterinario (24 h / 7 d / 30 d / personalizado) con las 9 secciones pedidas.
8. Exportación: vista en app, PDF, HTML independiente, hoja de compartir del sistema (WhatsApp / email / etc.), guardar archivo.
9. Privacidad: todo local; copia de seguridad y restauración en JSON; claro/oscuro; accesibilidad.

**Fuera del MVP (declarado, no fingido)**
- Sincronización entre dispositivos (el modelo de datos la permite, pero **no está implementada**).
- Recordatorios / notificaciones de tomas.
- Importar analíticas en PDF, OCR, multiusuario, cuentas.
- Otros idiomas (la UI está en español; los textos están escritos directamente en los componentes, así que traducir exigirá extraerlos antes).

## 3. Arquitectura

**Stack:** Capacitor 8 + React 19 + TypeScript + Vite. Una sola base de código web empaquetada como app Android/iOS.

*Por qué:* es el único camino que puedo **construir, ejecutar y verificar de verdad** en este entorno (tests, build, capturas, generación real de PDF). Flutter/Kotlin nativo requerirían SDKs que aquí no hay y quedaría sin comprobar. El coste: rendimiento y "sensación nativa" algo menores que en nativo puro; para una app de registro es aceptable.

```
src/
  domain/    ← reglas puras, SIN React ni base de datos (testeadas)
    types · eventTypes · time · schedule · stats · report (ReportModel)
  data/      ← almacenamiento local (puerto + adaptador)
    repository (interfaz) · dexieRepository (IndexedDB) · backup · nativeMirror
  charts/    ← generadores SVG puros (los usa la app, el HTML y el PDF)
  report/    ← html.ts (HTML autónomo) · pdf.ts (jsPDF + svg2pdf) · export.ts
  platform/  ← Capacitor: compartir, guardar, foto (con alternativa web)
  ui/        ← React: pantallas, componentes, tema
```

Reglas de dependencia: `ui → (data, report, charts) → domain`. `domain` no importa nada del resto. La generación del informe es `domain/report.ts` (datos → `ReportModel`) y dos renderizadores independientes (HTML, PDF) sobre ese mismo modelo: lo que ve el veterinario en pantalla, HTML y PDF sale de la misma fuente.

**Almacenamiento (decisión con riesgo conocido).** IndexedDB vía Dexie, detrás de una interfaz `Repository`. La documentación de Capacitor advierte de que el sistema operativo puede reclamar el almacenamiento web del WebView, sobre todo en iOS. Por eso, en nativo el repositorio **refleja una copia completa en un archivo** del directorio privado de la app tras cada cambio (con *debounce*) y la restaura si la base está vacía. Además hay copia de seguridad manual. Si más adelante se quiere SQLite nativo, solo se sustituye el adaptador.

**Preparado para sincronización opcional:** ids UUID generados en cliente, `updatedAt` en cada registro, borrado lógico (`deletedAt`, para propagar borrados), `deviceId` de origen y `schemaVersion` en copias. Con eso, una sincronización futura (último-que-escribe por registro) no obliga a rehacer nada.

**Fechas:** los eventos se guardan en instante UTC (ISO). Los horarios de medicación son *hora local de pared* ("08:00") y se materializan a instantes al calcular las tomas. Los informes usan la zona horaria del dispositivo.

## 4. Modelo de datos

Todas las entidades llevan: `id`, `createdAt`, `updatedAt`, `deletedAt?`.

```
Pet            name, species(dog|cat), breed?, sex(male|female|unknown), birthDate?,
               photo?(dataURL reducido), vet{name?,clinic?,phone?}, conditions[], allergies[],
               notes?
EventType      petId, key(vomit|stool|food|water|weight|mood|symptom|vet|other|custom),
               label, emoji, input(none|level|number|text), unit?, order, hidden
LogEvent       petId, typeId, at(ISO), level?(0..3), value?, unit?, note?, photo?
Treatment      petId, name, dose, unit, mode(scheduled|asNeeded), times["08:00",…],
               everyDays(1=diaria), startDate, endDate?, graceMinutes(60), notes?
DoseLog        petId, treatmentId?, scheduledAt?(ISO), takenAt?(ISO), status(given|skipped),
               adHoc{name,dose,unit}?, note?
Settings       theme(system|light|dark), tapMode(instant|sheet), schemaVersion, deviceId
```

- **El peso no se duplica:** el peso actual de la ficha es el último evento `weight`.
- **Estado de una toma (derivado, no almacenado):** existe `DoseLog` → `skipped`, o `given`/`late` según `takenAt` frente a `scheduledAt + graceMinutes`. Sin registro: `upcoming` / `due` / `overdue` (retrasada, pendiente) y, en informes pasados, `unrecorded`.
- **Indicadores configurables:** un botón propio (`custom`) con entrada `none | level | number` genera automáticamente su gráfica (conteo por día o evolución del valor).

## 5. Pantallas (rediseño sin scroll, 16/11/2026)

**Regla:** ninguna pantalla principal hace scroll. Cada pantalla es un marco fijo (cabecera · contenido flexible · navegación) y lo que no cabe va a hojas inferiores o se pagina. Comprobado automáticamente en 320×568, 360×640, 375×667, 390×844 y 430×932, en claro y oscuro (script que mide scroll, contenido cortado y botones de menos de 40 px).

**Sistema de diseño:** fondo piedra-salvia (#eef0eb), tinta verde-negra, índigo (#2f44a0) como único color de acción; tintes pastel solo para identificar el tipo de registro. Bricolage Grotesque (títulos) + Figtree (texto; sustituye a Nunito, que se veía infantil). Espaciado en base 4, radios por jerarquía (12/16/22/28), toques mínimos de 44 px. Listas como grupos con separadores en vez de tarjetas sueltas. Navegación inferior plana; la sección activa lleva una píldora suave.

1. **Mascotas** (y bienvenida): lista paginada; "Añadir mascota".
2. **Hoy:** cabecera compacta (toque = mascotas, ficha y personalizar botones). Franja con la toma que importa ahora (pendiente o siguiente) y botón «Dada»; toque = todas las tomas de hoy. Rejilla de botones que ocupa todo el hueco: el número de columnas (2–4) se calcula con el espacio real para que los botones sean lo más grandes posible sin scroll; icono arriba y nombre abajo para que el nombre nunca se parta. Abajo, «Hoy: N registros» abre la lista del día. El informe está en su pestaña (no se repite aquí).
3. **Historial:** periodo + botón de filtro (hoja con tipos); lista agrupada por día y **paginada** al alto disponible (flechas o deslizar).
4. **Medicación:** dos vistas: *Tomas de hoy* (Dada/Omitir/Deshacer) y *Tratamientos* (en curso y finalizados, con % de tomas dadas en 7 días); ambas paginadas.
5. **Gráficas:** una gráfica cada vez, a tamaño completo; flechas y selector; «Ver datos» en hoja.
6. **Informe:** periodo, resumen paginado, «Compartir informe en PDF» y fila de PDF · HTML · WhatsApp · Correo. El informe completo se abre en una hoja a pantalla casi completa (es un documento: ahí sí se desplaza).
7. **Ficha** en tres partes (Datos · Salud · Veterinario), **Personalizar botones** (paginada) y **Ajustes** (lista de opciones; cada una abre su hoja).

Las hojas inferiores tienen título, botón de cerrar visible y la acción principal fija abajo; las de edición llevan «Eliminar» como icono junto a «Guardar». En móviles muy bajos alguna hoja larga (tratamiento) puede desplazarse por dentro.

## 5b. Identidad visual (16/11/2026, segunda revisión)

- **Iconos propios estilo iOS:** cada tipo de registro tiene un «squircle» con degradado y un glifo blanco dibujado a mano (pastilla, cara mareada, caca sonriente, cuenco, gota, báscula, corazón, termómetro, estetoscopio, nota). Los botones propios o con icono cambiado muestran su emoji dentro del mismo squircle. Navegación con iconos de trazo fino que se rellenan al estar activos. Ajustes y menús con iconos de app a juego.
- **Mascotas ilustradas originales** (gato y perro) como avatar cuando no hay foto, en la bienvenida y en los estados vacíos.
- **Fondos ilustrados por pantalla:** degradado pastel propio de cada sección, manchas de color y un estampado de huellas, huesos, peces, ovillos, corazones y estrellas con gatos y perros asomándose. Versión nocturna en modo oscuro.
- **Animación suave** en Hoy (y en el inicio): adornos que flotan, manchas que «respiran», mascotas que se balancean y parpadean. Se desactiva si el teléfono pide reducir movimiento.
- **Superficies de cristal** (translúcidas con desenfoque, como en iOS) para que el fondo se vea sin perder legibilidad; el texto que va directamente sobre la ilustración lleva un halo suave.

## 6. Decisiones clave

1. *El toque registra.* Confirmar con otro toque duplicaría la fricción; el error se corrige con **Deshacer**.
2. *Detalle después, nunca antes.* Intensidad/nota/foto se añaden tras registrar.
3. *Sin diagnóstico.* El informe solo cuenta y ordena; los textos fijos son neutros y hay un pie que lo declara.
4. *Gráficas como SVG propio.* Un solo código para app, HTML y PDF; sin librería de gráficos ni red.
5. *Sin cloud, sin analítica, sin cuentas.* No hay llamadas de red en la app.
6. *Honestidad de alcance.* Lo no implementado figura en el README como pendiente.
