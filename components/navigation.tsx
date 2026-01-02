"use client"

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/i18n/routing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export function Navigation() {
  const t = useTranslations('common');
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [userImage, setUserImage] = useState<string | null | undefined>(session?.user?.image);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const user = await res.json();
          setIsAdmin(user.staffRole === 'ADMIN' || user.staffRole === 'OPERATOR');
          setUserImage(user.image || null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    if (session) {
      // Usar la imagen de la sesión como valor inicial
      setUserImage(session.user?.image || null);
      // Luego hacer fetch para obtener la versión más actualizada
      fetchUserData();
    } else {
      setUserImage(null);
    }
  }, [session]);

  // Recargar la imagen cuando se sale de /profile (para capturar actualizaciones recientes)
  useEffect(() => {
    if (!session) return;
    
    const fetchImage = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const user = await res.json();
          setUserImage(user.image || null);
        }
      } catch (error) {
        console.error('Error fetching user image:', error);
      }
    };
    
    // Recargar la imagen cuando cambia el pathname (especialmente cuando se sale de /profile)
    fetchImage();
  }, [session, pathname]);

  const navLinks = [
    { href: '/explore', label: t('explore') },
    ...(session
      ? [
          { href: '/instruments', label: t('myInstruments') },
          { href: '/posts', label: t('myPosts') },
          { href: '/requests', label: t('myRequests') },
          { href: '/profile', label: t('profile') },
          ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/explore') return pathname === '/explore';
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link href="/" className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="ViaSonora"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-bold text-xl">ViaSonora</span>
              </div>
              <span className="text-xs text-muted-foreground pl-10">
                {t('findInstrumentsSubtitle')}
              </span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md ${
                  isActive(link.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Settings Section */}
          <div className="p-4 border-t space-y-3">
            <div className="space-y-2">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>

          {/* User Section */}
          <div className="p-4 border-t space-y-2">
            {status === 'loading' ? (
              <span className="text-sm text-muted-foreground">{t('loading')}</span>
            ) : session ? (
              <>
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={session.user?.name || session.user?.email || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground block">{t('user')}</span>
                    <span className="text-sm font-medium text-foreground truncate block">
                      {session.user?.name || session.user?.email}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={async () => {
                    await signOut({ callbackUrl: '/' });
                    router.push('/');
                  }}
                >
                  {t('logout')}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href="/login">{t('login')}</Link>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation - Top Bar */}
      <nav className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-auto py-2 items-center justify-between">
          <Link href="/" className="flex flex-col space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="ViaSonora"
                width={24}
                height={24}
                className="object-contain flex-shrink-0"
              />
              <span className="font-bold text-lg leading-tight">ViaSonora</span>
            </div>
            <span className="text-[10px] text-muted-foreground pl-7 leading-tight">
              {t('findInstrumentsSubtitle')}
            </span>
          </Link>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('menu')}</SheetTitle>
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
                <div className="pt-4 border-t space-y-3">
                  <LanguageSwitcher />
                  <ThemeSwitcher />
                </div>
                <div className="pt-4 border-t">
                  {status === 'loading' ? (
                    <span className="text-sm text-muted-foreground">{t('loading')}</span>
                  ) : session ? (
                    <>
                      <div className="flex items-center space-x-3 mb-3 px-2">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                          {userImage ? (
                            <Image
                              src={userImage}
                              alt={session.user?.name || session.user?.email || 'User'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {session.user?.name || session.user?.email}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          setMobileMenuOpen(false);
                          await signOut({ callbackUrl: '/' });
                          router.push('/');
                        }}
                      >
                        {t('logout')}
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">
                        {t('login')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

