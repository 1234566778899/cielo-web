/** Datos de contacto y de la tienda en un solo lugar. */
export const site = {
  name: "Cielo Online",
  email: "hola@cieloonline.pe",
  phoneDisplay: "+51 904 435 631",
  whatsappNumber: "51904435631",
  hours: "Lun-Sáb 9AM a 7PM",
  address: "Av. José Larco 345, Miraflores, Lima 15074, Perú",
  currencyLabel: "PE (PEN S/.)",
};

/** Enlace a WhatsApp, opcionalmente con un mensaje prellenado. */
export const whatsappUrl = (text?: string) =>
  `https://wa.me/${site.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
