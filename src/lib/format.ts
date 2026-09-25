const pen = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Precio en soles con el formato "S/. 1,259.90". */
export const formatPrice = (value: number) => `S/. ${pen.format(value)}`;

export const discountPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

/** Minúsculas y sin acentos, para búsquedas. */
export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
