"use client"

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { RequestCard } from './RequestCard';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

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
        slug: string;
      };
    };
  };
  instrument: {
    id: string;
    title: string;
    photos: Array<{ url: string }>;
    category: {
      slug: string;
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
  const t = useTranslations('common');
  const tRequests = useTranslations('requests');
  const { data: session } = useSession();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sent' | 'received'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 3,
    totalPages: 0,
  });
  const [availabilityValidationEnabled, setAvailabilityValidationEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : []))
      .then((flags: { key: string; enabled: boolean }[]) => {
        if (cancelled) return;
        const flag = flags.find((f) => f.key === 'AVAILABILITY_VALIDATION');
        setAvailabilityValidationEnabled(flag?.enabled ?? false);
      })
      .catch(() => {
        if (!cancelled) setAvailabilityValidationEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session) {
      setCurrentPage(1); // Resetear a página 1 cuando cambia el tab
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeTab]);

  useEffect(() => {
    if (session) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const type = activeTab === 'sent' ? 'sent' : activeTab === 'received' ? 'received' : null;
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      params.set('page', currentPage.toString());
      params.set('pageSize', pagination.pageSize.toString());
      
      const res = await fetch(`/api/requests?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setRequests(result.data || result); // Compatibilidad con respuesta antigua
        if (result.pagination) {
          setPagination(result.pagination);
        }
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
        alert(error.error || tRequests('errorUpdatingStatus'));
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert(tRequests('errorUpdatingStatus'));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!session) {
    return <div className="container py-4">{t('loginToViewRequests')}</div>;
  }

  if (loading) {
    return <div className="container py-4">{t('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-b-none"
        >
          {tRequests('allTab')} ({pagination.total})
        </Button>
        <Button
          variant={activeTab === 'sent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('sent')}
          className="rounded-b-none"
        >
          {tRequests('sent')}
        </Button>
        <Button
          variant={activeTab === 'received' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('received')}
          className="rounded-b-none"
        >
          {tRequests('received')}
        </Button>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {activeTab === 'sent' && tRequests('noSent')}
            {activeTab === 'received' && tRequests('noReceived')}
            {activeTab === 'all' && tRequests('noRequests')}
          </div>
        ) : (
          <>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                currentUserId={session.user?.id || ''}
                onStatusChange={handleStatusChange}
                availabilityValidationEnabled={availabilityValidationEnabled}
              />
            ))}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

