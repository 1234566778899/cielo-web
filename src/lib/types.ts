export type Variant = {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  /** Unidades disponibles en la sucursal principal (null = no se controla stock). */
  available: number | null;
  inStock: boolean;
  /** { "Color": "Rosa" } */
  options: Record<string, string>;
};

export type ProductOption = { title: string; values: string[] };

export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  image: string;
  gallery: string[];
  price: number;
  compareAtPrice?: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  description: string[];
  features: string[];
  /** Slugs de colección a las que pertenece (rosas, cajas-de-regalo, …). */
  categories: string[];
  occasions: string[];
  recipients: string[];
  colors: string[];
  /** Handles de las colecciones de Supabase (mas-vendidos, pareja, …). */
  collections: string[];
  options: ProductOption[];
  variants: Variant[];
  defaultVariantId: string;
};

export type Category = {
  slug: string;
  name: string;
  image: string;
};

export type CartItem = {
  variantId: string;
  quantity: number;
  giftWrap?: boolean;
};

export type Address = {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  reference?: string;
  district: string;
  province: string;
  department: string;
  phone: string;
  isDefault?: boolean;
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  acceptsMarketing: boolean;
  addresses: Address[];
};

export type OrderStatus = "confirmado" | "en-preparacion" | "enviado" | "entregado" | "listo-para-recoger" | "cancelado";

export type OrderLine = {
  key: string;
  /** Handle del producto (si sigue publicado) para enlazar a su ficha. */
  slug: string | null;
  variantId: string | null;
  name: string;
  variantTitle?: string | null;
  image: string;
  price: number;
  quantity: number;
  giftWrap?: boolean;
};

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  /** Pago pendiente (Yape, transferencia o link de pago aún sin confirmar). */
  awaitingPayment: boolean;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  tax: number;
  delivery: { method: "envio"; address: Omit<Address, "id" | "isDefault">; label: string } | { method: "recojo"; storeName: string; storeAddress: string };
  payment: string;
  paymentProvider: string | null;
  email: string;
  tracking?: { company?: string; number?: string; url?: string } | null;
};

export type CategoryNode = { id: string; slug: string; name: string; parentId: string | null };

export type ShippingOption = {
  id: string;
  name: string;
  amount: number;
  freeOver: number | null;
  estimate: string | null;
  type: "shipping" | "pickup";
  locationId: string | null;
  /** Departamentos que cubre; null = todo el país. */
  departments: string[] | null;
};

export type StoreLocation = {
  id: string;
  name: string;
  address1: string;
  district: string;
  province: string;
  department: string;
  postalCode: string;
  phone: string;
  pickup: boolean;
};

export type DbCollection = { slug: string; title: string; description: string | null; image: string | null; productSlugs: string[] };

/** Todo lo que la tienda necesita de Supabase, en un objeto serializable. */
export type Catalog = {
  products: Product[];
  collections: DbCollection[];
  categories: CategoryNode[];
  shippingOptions: ShippingOption[];
  locations: StoreLocation[];
  /** Menor monto de "envío gratis desde" entre las tarifas de envío. */
  freeShippingThreshold: number | null;
};
