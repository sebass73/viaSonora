"use client";

import { useTranslations } from "next-intl";

interface CategoryNameProps {
  category: { slug?: string | null };
}

const CATEGORY_SLUGS = ["instrumentos", "amplificadores", "altavoces", "accesorios", "otro"] as const;

export function CategoryName({ category }: CategoryNameProps) {
  const t = useTranslations("categories");
  if (category.slug && CATEGORY_SLUGS.includes(category.slug as (typeof CATEGORY_SLUGS)[number])) {
    return <>{t(category.slug as (typeof CATEGORY_SLUGS)[number])}</>;
  }
  return <>{category.slug ?? "—"}</>;
}
