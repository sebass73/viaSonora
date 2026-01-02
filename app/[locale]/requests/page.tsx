"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestList } from '@/components/requests/RequestList';

export default function RequestsPage() {
  return (
    <div className="container py-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mis Solicitudes</CardTitle>
          <CardDescription>
            Gestiona las solicitudes que has enviado y recibido
          </CardDescription>
        </CardHeader>
      </Card>
      <RequestList />
    </div>
  );
}


