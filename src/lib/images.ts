import data from "@/data/images.json";

const byKey = new Map(data.images.map((i) => [i.key, i]));

/** Ruta pública de una imagen registrada en src/data/images.json. */
export function img(key: string): string {
  const entry = byKey.get(key);
  if (!entry) throw new Error(`Imagen no registrada: ${key}`);
  return `/images/${entry.file}`;
}
