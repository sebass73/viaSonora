"use client"

import { useTranslations } from 'next-intl';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from '@/i18n/routing';

export function Navigation() {
  const t = useTranslations('common');
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">ViaSonora</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2">
          <div className="flex items-center space-x-4">
            <Link
              href="/explore"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/explore' ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('explore')}
            </Link>
            {session && (
              <>
                <Link
                  href="/instruments"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname?.startsWith('/instruments') ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t('myInstruments')}
                </Link>
                <Link
                  href="/profile"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === '/profile' ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t('profile')}
                </Link>
              </>
            )}
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
      </div>
    </nav>
  );
}

