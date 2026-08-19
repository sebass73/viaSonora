"use client"

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('common');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <Sun className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Select disabled>
          <SelectTrigger className="flex-1 h-8">
            <SelectValue />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  const themeLabels: Record<string, string> = {
    light: t('light'),
    dark: t('dark'),
    system: t('system'),
  };

  const themeIcons: Record<string, React.ReactNode> = {
    light: <Sun className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
    dark: <Moon className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
    system: <Monitor className="h-4 w-4 text-muted-foreground flex-shrink-0" />,
  };

  return (
    <div className="flex items-center space-x-2">
      {themeIcons[theme || 'system']}
      <Select value={theme || 'system'} onValueChange={setTheme}>
        <SelectTrigger className="flex-1 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">{t('light')}</SelectItem>
          <SelectItem value="dark">{t('dark')}</SelectItem>
          <SelectItem value="system">{t('system')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}



