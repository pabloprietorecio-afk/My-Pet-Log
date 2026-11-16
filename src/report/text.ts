import type { ReportModel } from '../domain/report'

/** Resumen corto en texto plano (para WhatsApp / correo). Solo hechos. */
export function reportToText(m: ReportModel): string {
  const lines: string[] = []
  lines.push(`Informe de ${m.pet.name} · ${m.period.label}`)
  const head = [m.pet.species, m.pet.breed, m.pet.age].filter(Boolean).join(', ')
  if (head) lines.push(head)
  if (m.pet.conditions.length) lines.push(`Patologías: ${m.pet.conditions.join(', ')}`)
  if (m.pet.allergies.length) lines.push(`Alergias: ${m.pet.allergies.join(', ')}`)
  if (m.currentTreatments.length) {
    lines.push('', 'Medicación actual:')
    for (const t of m.currentTreatments) lines.push(`- ${t.name} ${t.dose} · ${t.schedule}`)
  }
  lines.push('', 'Resumen del periodo:')
  for (const s of m.summary) lines.push(`- ${s.label}: ${s.value}`)
  lines.push('', 'Generado con PetLog a partir de datos del propietario; no incluye diagnóstico ni recomendaciones.')
  return lines.join('\n')
}
