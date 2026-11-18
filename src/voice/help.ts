/**
 * «¿Qué puedo decir?»: todas las frases que entiende el intérprete, por categorías.
 * Lo que va entre ** son las palabras clave (se pintan en negrita). Hay un test que comprueba que cada frase se entiende.
 */
export type HelpCategory = 'log' | 'detail' | 'meds' | 'time' | 'more' | 'ask'

export interface VoiceHelp {
  id: HelpCategory
  title: string
  subtitle: string
  phrases: string[]
}

export interface HelpNames {
  /** Nombre de un tratamiento activo de la mascota, si lo hay. */
  treatment?: string
  /** Otra mascota (para «Toby ha vomitado»). */
  otherPet?: string
  /** Un botón propio (p. ej. «Pis»). */
  custom?: string
}

export const plain = (s: string) => s.replace(/\*\*/g, '')

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

export function voiceHelp(n: HelpNames = {}): VoiceHelp[] {
  const med = n.treatment ? lower(n.treatment) : undefined
  const custom = n.custom ? lower(n.custom) : undefined
  return [
    {
      id: 'log',
      title: 'Anotar',
      subtitle: 'El nombre de cualquier botón, también los tuyos',
      phrases: ['**agua**', '**ha vomitado**', '**ha hecho caca**', custom ? `**${custom}**` : '**comida**', '**tiene tos**', '**está decaído**'],
    },
    {
      id: 'detail',
      title: 'Cómo fue',
      subtitle: 'Intensidad, cantidad y peso',
      phrases: ['vómito **leve**', '**diarrea**', 'ha comido **poco**', 'agua **200 ml**', 'ha bebido **medio litro**', '**pesa cuatro coma dos kilos**'],
    },
    {
      id: 'meds',
      title: 'Medicación',
      subtitle: 'Por el nombre del tratamiento',
      phrases: [
        ...(med ? [`**le he dado** la ${med}`, `**no le he dado** la ${med}`, `${med} **omitida**`] : []),
        '**le he dado 5 mg de** meloxicam',
        '**medicación**',
      ],
    },
    {
      id: 'time',
      title: 'Cuándo',
      subtitle: 'Si no lo dices, se anota ahora',
      phrases: ['vómito **hace dos horas**', 'agua **hace media hora**', 'comida **a las 8 y media**', 'vómito **ayer a las 10**', 'diarrea **a las 10 de la noche**'],
    },
    {
      id: 'more',
      title: 'Varias cosas y notas',
      subtitle: 'Otra mascota, notas y deshacer',
      phrases: [
        '**agua y comida**',
        ...(n.otherPet ? [`**${n.otherPet}** ha vomitado`] : []),
        'vómito leve **nota** después de comer',
        '**veterinario** revisión anual',
        '**deshacer**',
      ],
    },
    {
      id: 'ask',
      title: 'Preguntas',
      subtitle: 'Te lo respondo sin anotar nada',
      phrases: ['**¿cuántos vómitos** lleva hoy?', '**¿cuántas** cacas **esta semana**?', '**¿cuándo fue la última toma?**', '**¿cuándo** vomitó?', '**¿cuánto pesa?**'],
    },
  ]
}
