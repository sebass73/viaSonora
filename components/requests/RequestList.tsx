"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RequestCard } from './RequestCard';
import { Button } from '@/components/ui/button';

interface Request {
  id: string;
  status: string;
  fromDate: string;
  toDate: string;
  message: string;
  accessories: string | null;
  createdAt: string;
  post: {
    id: string;
    city: string;
    areaText: string | null;
    instrument: {
      id: string;
      title: string;
      photos: Array<{ url: string }>;
      category: {
        nameEs: string;
      };
    };
  };
  instrument: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    category: {
      nameEs: string;
    };
  };
  owner: {
    id: string;
    name: string | null;
    lastName: string | null;
    image: string | null;
  };
  client: {
    id: string;
    name: string | null;
    lastName: string | null;
    image: string | null;
  };
}

export function RequestList() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');

  useEffect(() => {
    if (session) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'sent' ? 'sent' : activeTab === 'received' ? 'received' : null;
      const params = type ? `?type=${type}` : '';
      const res = await fetch(`/api/requests${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        console.error('Error fetching requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchRequests(); // Recargar requests
      } else {
        const error = await res.json();
        alert(error.error || 'Error al actualizar el estado de la solicitud');
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Error al actualizar el estado de la solicitud');
    }
  };

  if (!session) {
    return <div className="container py-8">Debes iniciar sesión para ver tus solicitudes</div>;
  }

  if (loading) {
    return <div className="container py-8">Cargando...</div>;
  }

  const sentRequests = requests.filter((r) => r.client.id === session.user?.id);
  const receivedRequests = requests.filter((r) => r.owner.id === session.user?.id);

  const displayRequests = activeTab === 'sent' ? sentRequests : activeTab === 'received' ? receivedRequests : requests;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-b-none"
        >
          Todas ({requests.length})
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sent')}
          className="rounded-b-none"
        >
          Enviadas ({sentRequests.length})
        </Button>
        <Button
          variant={activeTab === 'received' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('received')}
          className="rounded-b-none"
        >
          Recibidas ({receivedRequests.length})
        </Button>
      </div>

      <div className="space-y-4">
        {displayRequests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {activeTab === 'sent' && 'No has enviado solicitudes'}
            {activeTab === 'received' && 'No has recibido solicitudes'}
            {activeTab === 'all' && 'No tienes solicitudes'}
          </div>
        ) : (
          displayRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              currentUserId={session.user?.id || ''}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

