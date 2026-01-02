"use client"

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Guitar, 
  Piano, 
  Drum, 
  Music2, 
  Music4,
  Mic2,
  Headphones
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Category {
  id: string;
  nameEs: string;
}

interface CategoryChipsProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  locale?: string;
}

// Mapeo de categorías a iconos
const categoryIcons: Record<string, React.ReactNode> = {
  'Guitarra': <Guitar className="h-4 w-4" />,
  'Piano': <Piano className="h-4 w-4" />,
  'Batería': <Drum className="h-4 w-4" />,
  'Violín': <Music2 className="h-4 w-4" />,
  'Saxofón': <Mic2 className="h-4 w-4" />,
  'Flauta': <Music4 className="h-4 w-4" />,
  'Trompeta': <Music2 className="h-4 w-4" />,
  'Bajo': <Guitar className="h-4 w-4" />,
};

// Fallback icon para categorías sin icono específico
const DefaultIcon = <Headphones className="h-4 w-4" />;

export function CategoryChips({ 
  categories, 
  selectedCategoryId, 
  onCategoryChange,
  locale = 'es'
}: CategoryChipsProps) {
  const t = useTranslations('common');

  // Por ahora todas las categorías usan nameEs
  // En el futuro se pueden agregar traducciones
  const getCategoryName = (category: Category) => {
    return category.nameEs;
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || DefaultIcon;
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
        const icon = getCategoryIcon(category.nameEs);

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

