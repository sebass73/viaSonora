import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Inter } from "next/font/google";
import "../globals.css";
import "../leaflet.css";
import { Providers } from './providers';
import { Navigation } from '@/components/navigation';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://via-sonora.vercel.app';
  
  return {
    title: 'ViaSonora - Marketplace de Instrumentos Musicales para Músicos Viajeros',
    description: 'Alquila y comparte instrumentos musicales mientras viajas. Conecta con músicos en todo el mundo y encuentra el instrumento perfecto para tu próxima aventura musical.',
    openGraph: {
      title: 'ViaSonora - Marketplace de Instrumentos Musicales',
      description: 'Alquila y comparte instrumentos musicales mientras viajas. Conecta con músicos en todo el mundo.',
      url: `${baseUrl}/${locale}`,
      siteName: 'ViaSonora',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`, // Puedes agregar una imagen OG más adelante
          width: 1200,
          height: 630,
          alt: 'ViaSonora - Marketplace de Instrumentos Musicales',
        },
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ViaSonora - Marketplace de Instrumentos Musicales',
      description: 'Alquila y comparte instrumentos musicales mientras viajas.',
      images: [`${baseUrl}/og-image.jpg`],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={`${inter.className} h-full`} suppressHydrationWarning>
      <body className="h-full flex flex-col" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navigation />
            <main className="flex-1 md:ml-64 flex flex-col min-h-0">
              {children}
            </main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

