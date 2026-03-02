"use client"

import React from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Phone, ShieldCheck, Music } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const items = [
  { key: 'trustLocation' as const, Icon: Lock },
  { key: 'trustHiddenContact' as const, Icon: Phone },
  { key: 'trustModeration' as const, Icon: ShieldCheck },
  { key: 'trustCommunity' as const, Icon: Music },
];

export function TrustBlock() {
  const t = useTranslations('common');

  return (
    <div className="bg-background/5 border border-border rounded-md p-3">
      <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        <h3 className="text-xs font-semibold mb-0 mr-4">{t('trustTitle')}</h3>

        {/* Mobile: solo iconos; tap abre popover con el texto */}
        <ul className="flex items-center gap-3 md:hidden">
          {items.map(({ key, Icon }) => (
            <li key={key}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                    aria-label={t(key)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-50 w-auto max-w-[85vw] px-3 py-2 text-xs text-muted-foreground" side="top" sideOffset={6}>
                  {t(key)}
                </PopoverContent>
              </Popover>
            </li>
          ))}
        </ul>

        {/* Desktop: icono + texto en fila */}
        <ul className="hidden md:flex items-center gap-4 text-xs text-muted-foreground flex-nowrap">
          {items.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-2 whitespace-nowrap">
              <Icon className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TrustBlock;
