// Contenido de presentación de la tienda. Los productos, precios y stock vienen de Supabase (src/lib/catalog).
import { img } from "@/lib/images";
import type { Category } from "@/lib/types";

export const defaultDescription = (name: string) => [
  `Sorprende a esa persona especial con ${name.charAt(0).toLowerCase() + name.slice(1)}. Cada pieza está hecha con flores artificiales de seda de alta calidad, con pétalos suaves al tacto y colores que se ven tan reales como el primer día. No necesitan agua, no se marchitan y no provocan alergias, así que tu detalle lucirá perfecto durante años.`,
  "Cada arreglo es armado a mano por nuestros floristas y se entrega en un empaque protector listo para regalar. Ideal para aniversarios, cumpleaños, San Valentín, Día de las Madres o simplemente para decir “pienso en ti”.",
];

export const defaultFeatures = [
  "Flores artificiales de seda premium con acabado natural",
  "No requieren agua ni mantenimiento",
  "Colores que no se decoloran con el tiempo",
  "Armado a mano y empacado listo para regalar",
  "Incluye tarjeta de dedicatoria sin costo",
];

/** Círculos de "Compra por categoría" en el inicio. */
export const categories: Category[] = [
  { slug: "rosas", name: "Rosas", image: img("cat-rosas") },
  { slug: "girasoles", name: "Girasoles", image: img("cat-girasoles") },
  { slug: "tulipanes", name: "Tulipanes", image: img("cat-tulipanes") },
  { slug: "orquideas", name: "Orquídeas", image: img("cat-orquideas") },
  { slug: "cajas-de-regalo", name: "Cajas de regalo", image: img("cat-cajas") },
  { slug: "peluches", name: "Peluches", image: img("cat-peluches") },
  { slug: "globos", name: "Globos", image: img("cat-globos") },
];

export const heroCards = [
  { title: "Ramos eternos", text: "Rosas, tulipanes y girasoles que lucen frescos para siempre, sin agua ni cuidados.", cta: "Ver ramos", href: "/coleccion/ramos", image: img("hero-card-ramos") },
  { title: "Cajas de regalo", text: "Cajas de lujo con flores, chocolates y detalles listos para sorprender.", cta: "Ver cajas", href: "/coleccion/cajas-de-regalo", image: img("hero-card-cajas") },
  { title: "Peluches y detalles", text: "Peluches, globos, tazas y más. El complemento perfecto para tu regalo.", cta: "Ver detalles", href: "/coleccion/detalles", image: img("hero-card-peluches") },
  { title: "Arreglos para el hogar", text: "Orquídeas y arreglos decorativos que llenan de color cualquier espacio.", cta: "Ver arreglos", href: "/coleccion/hogar", image: img("hero-card-hogar") },
];
