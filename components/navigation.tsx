"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from '@/i18n/routing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function Navigation() {
  const t = useTranslations('common');
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/explore', label: t('explore') },
    ...(session
      ? [
          { href: '/instruments', label: t('myInstruments') },
          { href: '/posts', label: t('myPosts') },
          { href: '/profile', label: t('profile') },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/explore') return pathname === '/explore';
    return pathname?.startsWith(href);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">ViaSonora</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-between space-x-2">
          <div className="flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {status === 'loading' ? (
              <span className="text-sm text-muted-foreground">{t('loading')}</span>
            ) : session ? (
              <Button variant="outline" onClick={() => signOut()}>
                {t('logout')}
              </Button>
            ) : (
              <Button onClick={() => signIn('google')}>
                {t('login')}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden flex-1 items-center justify-end">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-medium transition-colors hover:text-primary py-2 ${
                      isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 border-t">
                  {status === 'loading' ? (
                    <span className="text-sm text-muted-foreground">{t('loading')}</span>
                  ) : session ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                    >
                      {t('logout')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signIn('google');
                      }}
                    >
                      {t('login')}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

