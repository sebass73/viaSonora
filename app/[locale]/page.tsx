import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export async function generateMetadata() {
  const t = await getTranslations('home');
  
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default function HomePage() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>ViaSonora</CardTitle>
          <CardDescription>
            Marketplace de instrumentos para músicos viajeros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Bienvenido. La funcionalidad del mapa y búsqueda se implementará en la Etapa 1.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

