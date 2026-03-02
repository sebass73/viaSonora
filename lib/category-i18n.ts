/**
 * Slug de categorías fijas (deben coincidir con los keys en messages/categories).
 * Usado para mapear iconos y validar slugs.
 */
export const CATEGORY_SLUGS = [
  'instrumentos',
  'amplificadores',
  'altavoces',
  'accesorios',
  'otro',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

/** Categoría mínima para mostrar nombre traducido por slug (messages/categories) */
export interface CategoryForDisplay {
  slug?: string | null;
}
