"use client"

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Music2, 
  Volume2,
  Speaker,
  Package,
  MoreHorizontal,
  Headphones
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Category {
  id: string;
  slug: string;
}

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  locale?: string;
}

// Iconos por slug (slug + i18n)
const categoryIcons: Record<string, React.ReactNode> = {
  instrumentos: <Music2 className="h-4 w-4" />,
  amplificadores: <Volume2 className="h-4 w-4" />,
  altavoces: <Speaker className="h-4 w-4" />,
  accesorios: <Package className="h-4 w-4" />,
  otro: <MoreHorizontal className="h-4 w-4" />,
};

const DefaultIcon = <Headphones className="h-4 w-4" />;

export function CategoryChips({ 
  categories, 
  selectedCategoryId, 
  onCategoryChange,
}: CategoryChipsProps) {
  const t = useTranslations('common');
  const tCategories = useTranslations('categories');

  const getCategoryName = (category: Category) => {
    if (category.slug && categoryIcons[category.slug] !== undefined) {
      return tCategories(category.slug as keyof typeof categoryIcons);
    }
    return category.slug ?? "—";
  };

  const getCategoryIcon = (slug: string | undefined) => {
    return (slug && categoryIcons[slug]) ? categoryIcons[slug] : DefaultIcon;
  };

  return (
    <div className="flex flex-wrap gap-2 justify-around">
      <Button
        variant={selectedCategoryId === null ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange(null)}
        className={cn(
          "h-8 px-3 flex items-center gap-2",
          selectedCategoryId === null && "bg-primary text-primary-foreground"
        )}
      >
        <Headphones className="h-4 w-4" />
        {t('all')}
      </Button>
      {categories.map((category) => {
        const categoryName = getCategoryName(category);
        const isSelected = selectedCategoryId === category.id;
        const icon = getCategoryIcon(category.slug);

        return (
          <Button
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(isSelected ? null : category.id)}
            className={cn(
              "h-8 px-3 flex items-center gap-2",
              isSelected && "bg-primary text-primary-foreground"
            )}
          >
            {icon}
            {categoryName}
          </Button>
        );
      })}
    </div>
  );
}

