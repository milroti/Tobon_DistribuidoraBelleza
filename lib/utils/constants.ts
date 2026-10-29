/** Categorías de productos */
export const PRODUCT_CATEGORIES = [
  "Cabello",
  "Uñas",
  "Maquillaje",
  "Cuidado de piel",
  "Herramientas",
  "Accesorios",
  "Otro",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Métodos de pago */
export const PAYMENT_METHODS = [
  "Efectivo",
  "Transferencia/Nequi",
  "Tarjeta",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Roles del sistema */
export const USER_ROLES = ["admin", "vendor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Umbral de stock bajo (por defecto) */
export const LOW_STOCK_THRESHOLD = 5;

/** Tipos de código de barras soportados */
export const BARCODE_FORMATS = [
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
] as const;
