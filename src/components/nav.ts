export type NavItem = { label: string; href: string; badge?: string; children?: { label: string; href: string }[] };

const search = (q: string) => `/buscar?q=${encodeURIComponent(q)}`;

/** Menú principal (desktop y menú móvil). */
export const mainNav: NavItem[] = [
  { label: "Flores", href: "/coleccion/flores" },
  { label: "Regalos", href: "/coleccion/regalos", badge: "NUEVO" },
  {
    label: "Por ocasión",
    href: "#",
    children: [
      { label: "Aniversario", href: search("aniversario") },
      { label: "Cumpleaños", href: search("cumpleaños") },
      { label: "San Valentín", href: search("san valentín") },
      { label: "Día de la Madre", href: search("día de las madres") },
      { label: "Amistad", href: search("amistad") },
    ],
  },
  {
    label: "Para quién",
    href: "#",
    children: [
      { label: "Para tu pareja", href: "/coleccion/pareja" },
      { label: "Para tus amigos", href: "/coleccion/amigos" },
      { label: "Para la familia", href: "/coleccion/familia" },
    ],
  },
  { label: "Arreglos", href: "/coleccion/arreglos" },
  { label: "Peluches", href: "/coleccion/peluches" },
  {
    label: "Temporada",
    href: "#",
    children: [
      { label: "San Valentín", href: search("san valentín") },
      { label: "Día de la Madre", href: search("día de las madres") },
      { label: "Más vendidos", href: "/coleccion/mas-vendidos" },
    ],
  },
];

export const secondaryNav = [
  { label: "Tiendas", href: "/tiendas" },
  { label: "Contacto", href: "/contacto" },
];

export const infoNav = [
  { label: "Opciones de envío", href: "/opciones-de-envio" },
  { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
  { label: "Nosotros", href: "/tiendas" },
  { label: "Contacto", href: "/contacto" },
];
