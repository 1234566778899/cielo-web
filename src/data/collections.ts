import { img } from "@/lib/images";

/**
 * Presentación de las colecciones (título, texto e imagen de cabecera).
 * Qué productos incluye cada una viene de Supabase:
 *   - `categories`: colección "virtual" = productos de esas categorías (y sus subcategorías).
 *   - si no, el handle se busca como colección y luego como categoría en la base de datos.
 * Una colección o categoría creada en el admin funciona aunque no esté aquí.
 */
export type CollectionMeta = { title: string; description: string; image: string; categories?: string[] };

export const ALL_PRODUCTS = "todos";

export const collectionMeta: Record<string, CollectionMeta> = {
  todos: { title: "Todos los productos", description: "Explora todo nuestro catálogo de flores artificiales, arreglos y regalos. Detalles que no se marchitan, pensados para sorprender a quien más quieres en cualquier ocasión.", image: img("look-sala") },
  flores: { title: "Flores", description: "Rosas, girasoles, tulipanes y orquídeas que lucen frescas para siempre. Nuestras flores artificiales de seda premium no necesitan agua ni cuidados y mantienen su color durante años.", image: img("hero-card-ramos") },
  ramos: { title: "Ramos eternos", description: "Ramos armados a mano con flores artificiales de alta calidad, envueltos y listos para regalar. El detalle perfecto para decir te quiero sin que se marchite.", image: img("hero-card-ramos"), categories: ["flores"] },
  regalos: { title: "Regalos", description: "Cajas sorpresa, peluches, globos y detalles que complementan cualquier arreglo floral. Todo lo que necesitas para armar el regalo perfecto en un solo lugar.", image: img("promo-celebra"), categories: ["cajas-de-regalo", "peluches", "globos", "detalles"] },
  arreglos: { title: "Arreglos", description: "Arreglos decorativos con orquídeas, rosas y más para llenar de color tu hogar u oficina. Elegancia que dura para siempre.", image: img("hero-card-hogar") },
  hogar: { title: "Arreglos para el hogar", description: "Orquídeas, velas y arreglos decorativos que llenan de color cualquier espacio de tu casa, sin necesidad de riego ni mantenimiento.", image: img("hero-card-hogar"), categories: ["arreglos"] },
  detalles: { title: "Peluches y detalles", description: "Peluches, tazas, velas y lámparas para acompañar tus flores. Pequeños detalles que hacen una gran diferencia.", image: img("hero-card-peluches"), categories: ["peluches", "detalles", "globos"] },
  rosas: { title: "Rosas", description: "La flor del amor en su versión eterna. Rosas artificiales rojas, rosas y blancas en cajas, cúpulas y ramos para cada ocasión especial.", image: img("cat-rosas") },
  girasoles: { title: "Girasoles", description: "Girasoles artificiales que llenan de luz y alegría cualquier lugar. Ideales para celebrar la amistad y los cumpleaños.", image: img("cat-girasoles") },
  tulipanes: { title: "Tulipanes", description: "Tulipanes artificiales en tonos pastel, perfectos para regalar a mamá o para decorar con un toque primaveral.", image: img("cat-tulipanes") },
  orquideas: { title: "Orquídeas", description: "Orquídeas artificiales de apariencia natural en macetas de cerámica. Sofisticación sin cuidados.", image: img("cat-orquideas") },
  "cajas-de-regalo": { title: "Cajas de regalo", description: "Cajas de lujo con rosas eternas, chocolates y sorpresas, listas para entregar. El regalo que siempre sorprende.", image: img("cat-cajas") },
  peluches: { title: "Peluches", description: "Peluches suaves acompañados de flores para consentir a tu pareja, amigos o familia.", image: img("cat-peluches") },
  globos: { title: "Globos", description: "Globos metálicos y mini ramos para cumpleaños, aniversarios y celebraciones.", image: img("cat-globos") },
  pareja: { title: "Para tu pareja", description: "Rosas eternas, cajas de chocolates, peluches y detalles románticos para decir “te amo” de una forma que dure para siempre.", image: img("feature-pareja") },
  amigos: { title: "Para tus amigos", description: "Girasoles, tazas, globos y cajas sorpresa para celebrar la amistad y los momentos compartidos.", image: img("col-amigos") },
  familia: { title: "Para la familia", description: "Tulipanes, orquídeas y arreglos para mamá, papá, abuelos y toda la familia. Detalles que expresan cariño todos los días.", image: img("col-familia") },
};

/** Imagen de cabecera para colecciones sin imagen propia. */
export const fallbackCollectionImage = img("look-sala");

/** Colecciones de Supabase que se muestran como "Para quién". */
export const RECIPIENT_COLLECTIONS = ["pareja", "amigos", "familia"];

/** Opciones de filtro: clave del producto + etiqueta de cada valor. */
export const filterGroups = [
  { key: "occasions", title: "Ocasión", options: { aniversario: "Aniversario", cumpleanos: "Cumpleaños", "san-valentin": "San Valentín", "dia-de-las-madres": "Día de las Madres", amistad: "Amistad" } },
  { key: "recipients", title: "Para quién", options: { pareja: "Pareja", amigos: "Amigos", familia: "Familia" } },
  { key: "colors", title: "Color", options: { rojo: "Rojo", rosa: "Rosa", blanco: "Blanco", amarillo: "Amarillo" } },
] as const;

export type FilterKey = (typeof filterGroups)[number]["key"];
