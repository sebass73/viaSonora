"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Share2, Copy, Check, MessageCircle, Facebook, X as XIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ShareButtonProps {
  /** Absolute URL, or a path that will be resolved against window.location.origin */
  url: string;
  /** Used as the shared title (native share sheet) and pre-filled text (WhatsApp/X) */
  title?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  label?: string;
}

function isMobileDevice() {
  return typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

export function ShareButton({ url, title, variant = 'outline', size = 'sm', label }: ShareButtonProps) {
  const t = useTranslations('share');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getAbsoluteUrl = () => {
    if (typeof window === 'undefined') return url;
    return url.startsWith('http') ? url : `${window.location.origin}${url}`;
  };

  const handleClick = async () => {
    const absoluteUrl = getAbsoluteUrl();
    if (isMobileDevice() && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
      } catch {
        // User cancelled the native share sheet — nothing to do
      }
      return;
    }
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getAbsoluteUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying share link:', error);
    }
  };

  const absoluteUrl = getAbsoluteUrl();
  const encodedUrl = encodeURIComponent(absoluteUrl);
  const encodedTitle = encodeURIComponent(title || '');

  const socialLinks = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: MessageCircle,
      bgClass: 'bg-[#25D366]',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
      bgClass: 'bg-[#1877F2]',
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: XIcon,
      bgClass: 'bg-black',
    },
  ];

  return (
    <>
      <Button type="button" variant={variant} size={size} onClick={handleClick} title={t('button')}>
        <Share2 className="h-4 w-4" />
        {label && <span className="ml-2">{label}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <Input readOnly value={absoluteUrl} onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" size="sm" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2">
            {socialLinks.map(({ name, href, icon: Icon, bgClass }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <span className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${bgClass}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {name}
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
