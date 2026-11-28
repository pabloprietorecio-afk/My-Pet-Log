import type { ReportModel } from '../domain/report'
import { tl } from '../i18n'

/** Resumen corto en texto plano (para WhatsApp / correo). Solo hechos. */
export function reportToText(m: ReportModel): string {
  const lines: string[] = []
  lines.push(tl('Informe de {0} · {1}', m.pet.name, m.period.label))
  const head = [m.pet.species, m.pet.breed, m.pet.age].filter(Boolean).join(', ')
  if (head) lines.push(head)
  if (m.pet.conditions.length) lines.push(tl('Patologías: {0}', m.pet.conditions.join(', ')))
  if (m.pet.allergies.length) lines.push(tl('Alergias: {0}', m.pet.allergies.join(', ')))
  if (m.currentTreatments.length) {
    lines.push('', tl('Medicación actual:'))
    for (const t of m.currentTreatments) lines.push(`- ${t.name} ${t.dose} · ${t.schedule}`)
  }
  lines.push('', tl('Resumen del periodo:'))
  for (const s of m.summary) lines.push(`- ${s.label}: ${s.value}`)
  lines.push('', tl('Generado con PetLog a partir de datos del propietario; no incluye diagnóstico ni recomendaciones.'))
  return lines.join('\n')
}
