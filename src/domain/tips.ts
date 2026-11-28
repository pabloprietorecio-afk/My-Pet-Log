/**
 * Consejos generales de cuidado por especie.
 *
 * Contenido redactado a partir de las fuentes que acompañan a cada ficha (organizaciones veterinarias y de
 * bienestar animal). Son consejos generales: no diagnostican ni sustituyen al veterinario, y no incluyen
 * dosis ni tratamientos. Revisado en noviembre de 2026.
 */
import type { Species } from './types'
import { tl } from '../i18n'

export type TipTopic = 'food' | 'hygiene' | 'activity' | 'home' | 'health'

export interface TipSource {
  name: string
  url: string
}

export interface Tip {
  id: string
  topic: TipTopic
  title: string
  text: string
  sources: TipSource[]
}

export const TIP_TOPICS: { key: TipTopic; label: string }[] = [
  { key: 'food', label: tl('Comida') },
  { key: 'hygiene', label: tl('Higiene') },
  { key: 'activity', label: tl('Actividad') },
  { key: 'home', label: tl('Hogar') },
  { key: 'health', label: tl('Salud') },
]

/** Aclaración que se muestra cuando la especie de la app agrupa animales con necesidades distintas. */
export const TIP_SCOPE: Partial<Record<Species, string>> = {
  rodent: tl('Pensados para hámster. Cobayas, ratas o jerbos tienen otras necesidades.'),
  bird: tl('Pensados para periquitos y otros pájaros pequeños de jaula.'),
  reptile: tl('Valores de referencia de la serpiente del maíz. Otras especies necesitan otros.'),
}

const S = {
  pdsaHazards: { name: 'PDSA', url: 'https://www.pdsa.org.uk/media/2583/pdsa-hidden-hazards-guide.pdf' },
  vetsNowDogFood: { name: tl('Vets Now'), url: 'https://www.vets-now.com/pet-care-advice/foods-poisonous-to-dogs/' },
  rspcaRescueDog: { name: 'RSPCA', url: 'https://young.rspca.org.uk/documents/d/rspca/getting-ready-for-your-rescue-dog' },
  pdsaDogTeeth: { name: 'PDSA', url: 'https://pdsa.org.uk/what-we-do/blog/vet-qa-how-do-i-remove-plaque-from-my-dogs-teeth' },
  dogsTrustTeeth: { name: tl('Dogs Trust'), url: 'https://www.dogstrust.ie/dog-advice/health-wellbeing/at-home/dog-dental-hygiene' },
  rspcaKidsWater: { name: tl('RSPCA Australia'), url: 'https://kids.rspca.org.au/animal-care/dogs-and-puppies/freedom-from-hunger-and-thirst' },
  rspcaWaDog: { name: tl('RSPCA WA'), url: 'https://www.rspcawa.org.au/learn-advocate/responsible-pet-ownership/caring-for-a-dog/' },
  pdsaDogExercise: { name: 'PDSA', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/how-much-exercise-does-your-dog-need' },
  rspcaTasDog: { name: tl('RSPCA Tasmania'), url: 'https://rspcatas.org.au/?p=13017' },
  rspcaDogBooklet: { name: 'RSPCA', url: 'https://www.rspca.org.uk/documents/1494939/7712578/Dog_How+to+take+care+of+your+dog+booklet_secure.pdf' },
  rspcaHotCars: { name: 'RSPCA', url: 'https://www.rspca.org.uk/adviceandwelfare/pets/dogs/health/dogsinhotcars' },
  rspcaAuCool: { name: tl('RSPCA Australia'), url: 'https://rspca.org.au/blog/2022/4-ways-keep-your-dog-cool-summer' },
  pdsaDogVaccines: { name: 'PDSA', url: 'https://pdsa.org.uk/pet-help-and-advice/pet-health-hub/other-veterinary-advice/dog-vaccines' },
  leyBienestar: { name: tl('Ministerio de Derechos Sociales'), url: 'https://www.dsca.gob.es/sites/default/files/TIP-N-25-048-DCA.pdf' },
  firstVetCatMilk: { name: 'FirstVet', url: 'https://firstvet.com/uk/articles/cats-and-kittens-can-they-drink-milk' },
  catsProtectionDrink: { name: tl('Cats Protection'), url: 'https://www.cats.org.uk/help-and-advice/diet/cats-and-drinking' },
  catsProtectionChecklist: { name: tl('Cats Protection'), url: 'https://www.cats.org.uk/media/11361/cat-essentials-checklist.pdf' },
  icatcareLitter: { name: tl('International Cat Care'), url: 'https://icatcare.org/?p=7608' },
  catsProtectionLoo: { name: tl('Cats Protection'), url: 'https://www.cats.org.uk/cats-blog/your-cats-perfect-loo' },
  woodGreenMultiCat: { name: tl('Wood Green'), url: 'https://woodgreen.org.uk/pet-advice/cat/multi-cat-households/' },
  vicCatCare: { name: tl('Agriculture Victoria'), url: 'https://agriculture.vic.gov.au/livestock-and-animals/animal-welfare-victoria/cats/health/routine-health-care-for-cats' },
  icatcarePlay: { name: tl('International Cat Care'), url: 'https://icatcare.org/?p=401' },
  icatcareScratch: { name: tl('International Cat Care'), url: 'https://icatcare.org/?p=7935' },
  woodGreenHappyCat: { name: tl('Wood Green'), url: 'https://woodgreen.org.uk/pet-advice/cat/keeping-your-cat-happy/' },
  icatcareHome: { name: tl('International Cat Care'), url: 'https://icatcare.org/?p=400' },
  icatcareLilies: { name: tl('International Cat Care'), url: 'https://icatcare.org/cat-campaigns/lily-toxicity' },
  pdsaCatVaccines: { name: 'PDSA', url: 'https://www.pdsa.org.uk/media/12684/phh_cat_o_cat-and-kitten-vaccinations.pdf' },
  woodGreenCatHealth: { name: tl('Wood Green'), url: 'https://woodgreen.org.uk/pet-advice/cat/cat-healthcare-a-guide-to-keeping-your-cat-or-kitten-healthy/' },
  pdsaRabbit: { name: 'PDSA', url: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/rabbits/rabbit-health' },
  pdsaRabbitFood: { name: 'PDSA', url: 'https://www.pdsa.org.uk/media/6177/feeding-rabbits.pdf' },
  rwafFood: { name: tl('Rabbit Welfare Association'), url: 'https://rabbitwelfare.co.uk/obesity-commercial-food-and-treats' },
  hrsGrooming: { name: tl('House Rabbit Society'), url: 'https://rabbit.org/grooming/' },
  pdsaRabbitVaccines: { name: 'PDSA', url: 'https://www.pdsa.org.uk/media/12545/phh_rabbit_o_rabbit-vaccines.pdf' },
  rwafFlystrike: { name: tl('Rabbit Welfare Association'), url: 'https://rabbitwelfare.co.uk/flystrike-in-rabbits/' },
  rwafSpace: { name: tl('Rabbit Welfare Association'), url: 'https://rabbitwelfare.co.uk/welfare-need/space-recommendations/' },
  burgessHamster: { name: tl('Burgess (lista de la PDSA)'), url: 'https://www.burgesspetcare.com/pet-care/hamsters/feeding-hamster' },
  bcspcaHamster: { name: tl('BC SPCA'), url: 'https://spca.bc.ca/wp-content/uploads/hamster-care-guide.pdf' },
  petmdHamsterFood: { name: 'PetMD', url: 'https://petmd.com/exotic/what-can-hamsters-eat' },
  woodGreenHamsterFood: { name: tl('Wood Green'), url: 'https://woodgreen.org.uk/pet-advice/hamster/what-to-feed-your-hamster/' },
  petmdHamsterBath: { name: 'PetMD', url: 'https://www.petmd.com/exotic/care/evr_ex_hm_how-to-give-your-hamster-a-bath' },
  woodGreenHamster: { name: tl('Wood Green'), url: 'https://woodgreen.org.uk/pet-advice/hamster/caring-for-hamsters/' },
  rspcaAuBirds: { name: tl('RSPCA Australia'), url: 'https://kb.rspca.org.au/knowledge-base/how-should-i-care-for-my-birds/' },
  rvcBudgie: { name: tl('Royal Veterinary College'), url: 'https://www.rvc.ac.uk/Media/Default/Beaumont%20Sainsbury%20Animal%20Hospital/documents/caring-for-your-budgie.pdf' },
  illinoisBirds: { name: tl('Univ. de Illinois (Veterinaria)'), url: 'https://vetmed.illinois.edu/pet-health-columns/bird-toxins-teflon-avocado-lead-zinc/' },
  vcaTeflon: { name: tl('VCA Hospitals'), url: 'https://vcahospitals.com/know-your-pet/teflon-polytetrafluoroethylene-poisoning-in-birds' },
  rspcaCornSnake: { name: 'RSPCA', url: 'https://rspca.org.uk/adviceandwelfare/pets/other/cornsnake' },
  flukerSnake: { name: 'Fluker’s', url: 'https://flukerfarms.com/snake-care-sheet/' },
  cdcReptiles: { name: 'CDC', url: 'https://www.cdc.gov/healthypets/pets/reptiles.html' },
} satisfies Record<string, TipSource>

const chip = (species: 'perros' | 'gatos'): Tip => ({
  id: `${species}-microchip`,
  topic: 'health',
  title: tl('Microchip'),
  text: tl('En España, la Ley 7/2023 de bienestar animal establece que perros, gatos y hurones se identifiquen con microchip. Pregunta en tu clínica si el suyo está registrado.'),
  sources: [S.leyBienestar],
})

export const TIPS: Record<Species, Tip[]> = {
  dog: [
    {
      id: 'dog-toxic',
      topic: 'food',
      title: tl('Alimentos peligrosos'),
      text: tl('Chocolate, uvas y pasas, cebolla, ajo y cebollino, y el edulcorante xilitol (chicles, algunos dulces) son tóxicos para los perros. Si come alguno, llama al veterinario aunque parezca estar bien.'),
      sources: [S.vetsNowDogFood, S.pdsaHazards],
    },
    {
      id: 'dog-water',
      topic: 'food',
      title: tl('Agua fresca siempre'),
      text: tl('Necesita agua limpia a su alcance a todas horas, en un cuenco aparte del de la comida. En paseos largos o viajes, lleva agua para él.'),
      sources: [S.rspcaRescueDog, S.rspcaKidsWater],
    },
    {
      id: 'dog-teeth',
      topic: 'hygiene',
      title: tl('Dientes, mejor cada día'),
      text: tl('Cepillarle los dientes a diario es la mejor forma de quitar la placa. Usa cepillo y pasta para perros: la pasta humana puede ser tóxica para él. Empieza poco a poco y prémiale.'),
      sources: [S.pdsaDogTeeth, S.dogsTrustTeeth],
    },
    {
      id: 'dog-brush',
      topic: 'hygiene',
      title: tl('Cepillado y revisión'),
      text: tl('Cepillarle con regularidad mantiene sanos el pelo y la piel, y es un buen momento para notar bultos, heridas o parásitos. La frecuencia depende de su tipo de pelo.'),
      sources: [S.rspcaWaDog],
    },
    {
      id: 'dog-walks',
      topic: 'activity',
      title: tl('Paseos cada día'),
      text: tl('La mayoría de los perros necesita al menos uno o dos paseos al día, salvo que el veterinario indique otra cosa. Cuánto ejercicio depende de su raza, edad, salud y carácter.'),
      sources: [S.pdsaDogExercise],
    },
    {
      id: 'dog-puzzle',
      topic: 'activity',
      title: tl('Que trabaje por su premio'),
      text: tl('Esconde parte de su comida en juguetes rellenables o de búsqueda: tiene que esforzarse para conseguirla y así ejercita también la mente.'),
      sources: [S.rspcaTasDog],
    },
    {
      id: 'dog-bed',
      topic: 'home',
      title: tl('Su rincón tranquilo'),
      text: tl('Dale una cama cómoda, lavable y en un lugar tranquilo, donde pueda descansar sin que le molesten, y un sitio donde esconderse de lo que le asusta.'),
      sources: [S.rspcaDogBooklet, S.rspcaRescueDog],
    },
    {
      id: 'dog-heat',
      topic: 'health',
      title: tl('Nunca solo en el coche'),
      text: tl('Un coche se calienta como un horno aunque esté a la sombra o con la ventanilla abierta. Con calor, pasea temprano o al anochecer, y toca el suelo con el dorso de la mano: si te quema a ti, a él también.'),
      sources: [S.rspcaHotCars, S.rspcaAuCool],
    },
    {
      id: 'dog-vaccines',
      topic: 'health',
      title: tl('Vacunas al día'),
      text: tl('Las vacunas protegen frente a enfermedades graves como la parvovirosis, el moquillo, la hepatitis o la leptospirosis. Tras las del cachorro hacen falta recuerdos periódicos: tu veterinario te dirá cuáles y cuándo.'),
      sources: [S.pdsaDogVaccines],
    },
    chip('perros'),
  ],
  cat: [
    {
      id: 'cat-meat',
      topic: 'food',
      title: tl('Carnívoro de verdad'),
      text: tl('El gato es carnívoro estricto: necesita nutrientes que solo obtiene de la carne. Dale un alimento completo formulado para gatos.'),
      sources: [S.firstVetCatMilk],
    },
    {
      id: 'cat-water',
      topic: 'food',
      title: tl('Agua, mejor que leche'),
      text: tl('Muchos gatos no toleran la lactosa y la leche les sienta mal: lo mejor es agua. Pon el cuenco lejos de la comida, porque suelen preferir no beber donde comen.'),
      sources: [S.catsProtectionDrink, S.catsProtectionChecklist],
    },
    {
      id: 'cat-litter',
      topic: 'hygiene',
      title: tl('Bandeja limpia y discreta'),
      text: tl('Colócala en un rincón tranquilo, lejos de comida, agua y zonas de paso. Lávala entera al menos una vez por semana con agua caliente y jabón: algunos desinfectantes son tóxicos para gatos.'),
      sources: [S.icatcareLitter, S.catsProtectionLoo],
    },
    {
      id: 'cat-brush',
      topic: 'hygiene',
      title: tl('Pelo y dientes'),
      text: tl('Pelo largo: peinar y cepillar a diario. Pelo corto: unas dos veces por semana. Cepillarle los dientes es lo más eficaz contra el sarro; al menos una vez por semana, mejor a diario.'),
      sources: [S.vicCatCare],
    },
    {
      id: 'cat-play',
      topic: 'activity',
      title: tl('Juegos de caza'),
      text: tl('El juego debe parecerse a la caza: ratos cortos y frecuentes con cañas o juguetes que se muevan como una presa. Las cajas de cartón también le invitan a explorar.'),
      sources: [S.icatcarePlay],
    },
    {
      id: 'cat-scratch',
      topic: 'activity',
      title: tl('Un rascador firme'),
      text: tl('Rascar es natural y también le sirve para marcar con su olor. Ponle un rascador estable, alto para estirarse del todo, cerca de las entradas de las habitaciones.'),
      sources: [S.icatcareScratch, S.woodGreenHappyCat],
    },
    {
      id: 'cat-high',
      topic: 'home',
      title: tl('Sitios en alto'),
      text: tl('Los gatos son trepadores y les gusta descansar y vigilar desde arriba. Ofrécele estantes o repisas, y asegúrate de que pueda bajar con facilidad.'),
      sources: [S.icatcareHome],
    },
    {
      id: 'cat-multi',
      topic: 'home',
      title: tl('Si hay varios gatos'),
      text: tl('La regla es una bandeja por gato más una extra, en sitios distintos. Lo mismo con el agua: un cuenco por gato y uno más, repartidos por la casa.'),
      sources: [S.woodGreenMultiCat],
    },
    {
      id: 'cat-lilies',
      topic: 'health',
      title: tl('Lirios: muy peligrosos'),
      text: tl('Todo el lirio es tóxico para el gato: mordisquear una hoja, lamerse el polen del pelo o beber el agua del jarrón puede causarle un fallo renal. Mejor no tenerlos en casa; si hay contacto, al veterinario ya.'),
      sources: [S.icatcareLilies],
    },
    {
      id: 'cat-vet',
      topic: 'health',
      title: tl('Vacunas y revisión anual'),
      text: tl('Aunque no salga de casa, necesita vacunas frente a la gripe felina y la panleucopenia. Una revisión al año ayuda a detectar problemas a tiempo.'),
      sources: [S.pdsaCatVaccines, S.woodGreenCatHealth],
    },
    chip('gatos'),
  ],
  rabbit: [
    {
      id: 'rabbit-hay',
      topic: 'food',
      title: tl('Heno, su comida principal'),
      text: tl('Cada día, como mínimo, un montón de heno de buena calidad tan grande como el propio conejo. Desgasta sus dientes, que crecen toda la vida, y cuida su digestión.'),
      sources: [S.pdsaRabbit, S.pdsaRabbitFood],
    },
    {
      id: 'rabbit-greens',
      topic: 'food',
      title: tl('Verdura y pienso, con medida'),
      text: tl('Un puñado de verdura adecuada por la mañana y otro por la noche, y solo una cucharada de pienso en bolitas al día (dos si pesa más de 3,5 kg). Nada de mezclas tipo muesli; la zanahoria, como premio.'),
      sources: [S.pdsaRabbit, S.pdsaRabbitFood, S.rwafFood],
    },
    {
      id: 'rabbit-bath',
      topic: 'hygiene',
      title: tl('Sin baños'),
      text: tl('Se asea solo y bañarlo le causa un estrés que puede ser peligroso. Si se ensucia, limpia solo esa zona con agua tibia.'),
      sources: [S.hrsGrooming, S.pdsaRabbitVaccines],
    },
    {
      id: 'rabbit-flystrike',
      topic: 'hygiene',
      title: tl('Revisa su trasero'),
      text: tl('Las moscas ponen huevos en el pelo sucio (miasis), algo muy grave. Revisa bajo la cola al menos una vez al día y dos o más en verano, y retira la cama sucia.'),
      sources: [S.pdsaRabbit, S.rwafFlystrike],
    },
    {
      id: 'rabbit-brush',
      topic: 'hygiene',
      title: tl('Cepillado y uñas'),
      text: tl('Cepíllalo con regularidad; los de pelo largo pueden necesitarlo a diario, sobre todo en la muda. Vigila sus uñas: si se ven largas, consulta al veterinario.'),
      sources: [S.pdsaRabbit],
    },
    {
      id: 'rabbit-company',
      topic: 'activity',
      title: tl('Nunca solo'),
      text: tl('Es un animal social: lo ideal es una pareja bien avenida, por ejemplo macho y hembra esterilizados. No lo juntes con cobayas ni con otras especies.'),
      sources: [S.pdsaRabbit],
    },
    {
      id: 'rabbit-handling',
      topic: 'activity',
      title: tl('Que venga a ti'),
      text: tl('Evita cogerlo si no hace falta: siéntate en el suelo y ofrécele premios. Nunca lo sujetes boca arriba ni lo levantes por las orejas o la piel del cuello.'),
      sources: [S.pdsaRabbit],
    },
    {
      id: 'rabbit-space',
      topic: 'home',
      title: tl('Espacio para correr'),
      text: tl('Una conejera no basta. Para dos conejos se recomienda un recinto de al menos 3 × 2 m y 1 m de alto, disponible siempre, dentro o fuera de casa.'),
      sources: [S.rwafSpace],
    },
    {
      id: 'rabbit-vaccines',
      topic: 'health',
      title: tl('Vacunas cada año'),
      text: tl('Las vacunas protegen frente a la mixomatosis y la enfermedad hemorrágica vírica (tipos 1 y 2), que casi siempre son mortales. Hay que mantener los recuerdos cada año.'),
      sources: [S.pdsaRabbit],
    },
  ],
  rodent: [
    {
      id: 'hamster-food',
      topic: 'food',
      title: tl('Pienso y un poco de fresco'),
      text: tl('La base es un pienso en bolitas para hámster. Añade poca cantidad de verdura apta, como brócoli, pimiento dulce, pepino o zanahoria, y retira al día siguiente lo fresco que no coma.'),
      sources: [S.burgessHamster, S.bcspcaHamster],
    },
    {
      id: 'hamster-avoid',
      topic: 'food',
      title: tl('Qué evitar'),
      text: tl('Nada de cítricos ni alimentos picantes, que le sientan mal. Tampoco ajo, cebollino, berenjena, almendras amargas ni pepitas de manzana.'),
      sources: [S.petmdHamsterFood, S.woodGreenHamsterFood],
    },
    {
      id: 'hamster-sand',
      topic: 'hygiene',
      title: tl('Baño de arena, no de agua'),
      text: tl('Se asea solo. Ponle un recipiente con arena para hámster para que se revuelque; el agua le quita los aceites del pelaje y le estresa. Báñalo con agua solo si lo indica el veterinario.'),
      sources: [S.petmdHamsterBath, S.woodGreenHamster],
    },
    {
      id: 'hamster-clean',
      topic: 'hygiene',
      title: tl('Limpieza regular'),
      text: tl('Limpia la zona del baño cada pocos días y toda la jaula una vez por semana: la acumulación de bacterias favorece la «cola húmeda». Mientras, déjalo en un transportín de plástico rígido.'),
      sources: [S.bcspcaHamster, S.woodGreenHamster],
    },
    {
      id: 'hamster-wheel',
      topic: 'activity',
      title: tl('Rueda maciza y grande'),
      text: tl('Elige una rueda de superficie lisa, sin barrotes: unos 30 cm de diámetro para sirios y chinos, y unos 20 cm para enanos.'),
      sources: [S.woodGreenHamster],
    },
    {
      id: 'hamster-gnaw',
      topic: 'activity',
      title: tl('Para roer'),
      text: tl('Ofrécele ramas de manzano u otros frutales, corcho o sarmientos para roer. Evita los palitos de colores y los bloques de sal o minerales.'),
      sources: [S.woodGreenHamster],
    },
    {
      id: 'hamster-alone',
      topic: 'home',
      title: tl('Vive solo'),
      text: tl('Todos los hámsteres deben vivir solos: las peleas en un mismo recinto pueden causar heridas muy graves.'),
      sources: [S.woodGreenHamster],
    },
    {
      id: 'hamster-space',
      topic: 'home',
      title: tl('Espacio y lecho profundo'),
      text: tl('Mínimo 100 × 50 cm de suelo y 50 cm de alto para un sirio. Al menos 15 cm de lecho para excavar, con una zona de 25–30 cm. Sin virutas de madera ni serrín.'),
      sources: [S.woodGreenHamster],
    },
    {
      id: 'hamster-night',
      topic: 'health',
      title: tl('Respeta su sueño'),
      text: tl('Es nocturno y duerme de día: cógelo cuando esté despierto, dejando que suba a tus manos. Revísalo una vez por semana y fíjate cada día en si cambia su comportamiento.'),
      sources: [S.woodGreenHamster],
    },
  ],
  bird: [
    {
      id: 'bird-diet',
      topic: 'food',
      title: tl('Más que semillas'),
      text: tl('Una dieta solo de semillas se queda corta y se asocia a obesidad y otras enfermedades. Mejor un pienso completo para aves como base, verdura fresca y las semillas o la fruta como premio.'),
      sources: [S.rspcaAuBirds, S.rvcBudgie],
    },
    {
      id: 'bird-avocado',
      topic: 'food',
      title: tl('Aguacate, nunca'),
      text: tl('El aguacate es tóxico para los pájaros y puede causarles la muerte de forma repentina. Si lo ha comido, llévalo a urgencias veterinarias.'),
      sources: [S.illinoisBirds],
    },
    {
      id: 'bird-water',
      topic: 'hygiene',
      title: tl('Agua para beber y bañarse'),
      text: tl('Siempre agua para beber y, aparte, un plato poco hondo para que se bañe. Cámbiala cada día.'),
      sources: [S.rvcBudgie],
    },
    {
      id: 'bird-clean',
      topic: 'hygiene',
      title: tl('Jaula y perchas'),
      text: tl('Limpia la jaula al menos una vez por semana con un desinfectante adecuado. Cambia las perchas lisas por ramas naturales de distintos grosores; evita las fundas de lija.'),
      sources: [S.rvcBudgie],
    },
    {
      id: 'bird-fly',
      topic: 'activity',
      title: tl('Volar cada día'),
      text: tl('Volar libre es imprescindible. Que se ejercite a diario en una habitación segura: ventanas, puertas y chimenea cerradas, y ventiladores y estufas apagados.'),
      sources: [S.rvcBudgie],
    },
    {
      id: 'bird-company',
      topic: 'activity',
      title: tl('Compañía'),
      text: tl('Es un ave social: lo ideal es que viva con otro de su misma especie.'),
      sources: [S.rvcBudgie],
    },
    {
      id: 'bird-cage',
      topic: 'home',
      title: tl('Una buena jaula'),
      text: tl('Lo más grande posible: tiene que poder estirar las alas en todas direcciones. Lejos del sol directo y de las corrientes, y de un material sin zinc.'),
      sources: [S.rvcBudgie],
    },
    {
      id: 'bird-fumes',
      topic: 'health',
      title: tl('Cuidado con los humos'),
      text: tl('Sus pulmones son muy sensibles: el humo del tabaco, las sartenes antiadherentes recalentadas, los ambientadores de enchufe y los desodorantes en espray pueden ser mortales.'),
      sources: [S.rvcBudgie, S.vcaTeflon],
    },
    {
      id: 'bird-metals',
      topic: 'health',
      title: tl('Metales y revisión'),
      text: tl('El zinc, la pintura vieja, el plomo o las llaves pueden intoxicarle: que no los mordisquee. Se recomienda una revisión veterinaria al año.'),
      sources: [S.rvcBudgie],
    },
  ],
  reptile: [
    {
      id: 'snake-prey',
      topic: 'food',
      title: tl('Presa muerta, no viva'),
      text: tl('Ofrécele ratones descongelados con pinzas: una presa viva puede herirla. Adulta, un ratón cada 7–14 días; crías, un ratón recién nacido cada 5–6 días.'),
      sources: [S.rspcaCornSnake, S.flukerSnake],
    },
    {
      id: 'snake-water',
      topic: 'food',
      title: tl('Agua limpia'),
      text: tl('Un cuenco grande de agua en la zona fresca. Cámbiala al menos una vez al día, y en cuanto la ensucie.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-hands',
      topic: 'hygiene',
      title: tl('Lávate las manos'),
      text: tl('Los reptiles pueden llevar salmonela aunque estén sanos. Lávate con agua y jabón antes y después de tocarla a ella o a su equipo, y mantén sus cosas lejos de la cocina.'),
      sources: [S.rspcaCornSnake, S.cdcReptiles],
    },
    {
      id: 'snake-clean',
      topic: 'hygiene',
      title: tl('Limpieza del terrario'),
      text: tl('Retira los excrementos en cuanto aparezcan y limpia todo el terrario una vez al mes con un desinfectante apto para reptiles, aclarando bien.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-shed',
      topic: 'hygiene',
      title: tl('La muda'),
      text: tl('Muda la piel de una pieza. Un escondite húmedo con musgo le ayuda; evita cogerla mientras muda. Si le quedan restos en los ojos, acude a un veterinario de reptiles.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-handling',
      topic: 'activity',
      title: tl('Manejo con calma'),
      text: tl('Espera 48 horas después de que coma antes de cogerla y limita el rato a unos 10–15 minutos. No la toques justo después de manipular su comida.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-alone',
      topic: 'activity',
      title: tl('Vive sola'),
      text: tl('Es solitaria en la naturaleza: mantenla sola. Ramas o estructuras para trepar le dan actividad.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-heat',
      topic: 'home',
      title: tl('Zona caliente y zona fresca'),
      text: tl('Zona caliente a 28–30 °C y zona fresca a 20–24 °C; de noche puede bajar a 16–20 °C. Toda fuente de calor con termostato, y las lámparas, con rejilla protectora.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-setup',
      topic: 'home',
      title: tl('Escondites, humedad y luz'),
      text: tl('Al menos dos escondites, uno en cada extremo, y humedad del 40–50 % medida con higrómetro. Luz UVB suave y 12 horas de luz y 12 de oscuridad con temporizador.'),
      sources: [S.rspcaCornSnake],
    },
    {
      id: 'snake-weight',
      topic: 'health',
      title: tl('Pésala a menudo'),
      text: tl('Pesarla con regularidad ayuda a notar si gana o pierde peso. Puedes anotarlo con el botón «Peso» y verlo en Gráficas. Anota también la temperatura cada día: los termostatos no siempre son exactos.'),
      sources: [S.rspcaCornSnake],
    },
  ],
}

export function tipsFor(species: Species, topic?: TipTopic): Tip[] {
  const all = TIPS[species] ?? []
  return topic ? all.filter((t) => t.topic === topic) : all
}
