"use client"

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function HowTravelersPage() {
  const t = useTranslations('common');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/content/how-travelers.md');
        if (!res.ok) {
          setContent('No se encontró el contenido para "Para músicos viajeros".');
          return;
        }
        const text = await res.text();
        if (mounted) setContent(text);
      } catch (err) {
        if (mounted) setContent('Error cargando el contenido.');
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false };
  }, []);

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-4">{t('howTravelers') || 'Para músicos viajeros'}</h1>

      {loading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : (
        <article className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}
