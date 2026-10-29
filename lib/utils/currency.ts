/**
 * Formatea un valor entero de pesos colombianos.
 * Los precios se almacenan como INTEGER (sin decimales).
 * Ejemplo: formatCOP(120000) → "$ 120.000"
 */
export function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Parsea un string de COP a número entero.
 * Ejemplo: parseCOP("$ 120.000") → 120000
 */
export function parseCOP(formatted: string): number {
  const cleaned = formatted.replace(/[$\s.]/g, "");
  const value = parseInt(cleaned, 10);
  return isNaN(value) ? 0 : value;
}
