"use client"

import React from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Phone, ShieldCheck, Music } from 'lucide-react';

export function TrustBlock() {
  const t = useTranslations('common');

  return (
    <div className="bg-background/5 border border-border rounded-md p-3">
      <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        <h3 className="text-xs font-semibold mb-0 mr-4">{t('trustTitle')}</h3>
        <ul className="flex items-center gap-4 text-xs text-muted-foreground flex-nowrap overflow-x-auto">
          <li className="flex items-center gap-2 whitespace-nowrap">
            <Lock className="h-4 w-4 text-primary" />
            <span>{t('trustLocation')}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap">
            <Phone className="h-4 w-4 text-primary" />
            <span>{t('trustHiddenContact')}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t('trustModeration')}</span>
          </li>
          <li className="flex items-center gap-2 whitespace-nowrap">
            <Music className="h-4 w-4 text-primary" />
            <span>{t('trustCommunity')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default TrustBlock;
