"use client"

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { format } from 'date-fns';
import { es, en, it } from 'date-fns/locale';

interface PostReport {
  id: string;
  postId: string;
  reporterId: string;
  reason: 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'INCORRECT_INFO' | 'OTHER';
  comment: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  post: {
    id: string;
    instrument: {
      id: string;
      title: string;
      category: {
        nameEs: string;
      };
    };
    owner: {
      id: string;
      name: string | null;
      lastName: string | null;
      email: string;
    };
  };
  reporter: {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
  };
  reviewer: {
    id: string;
    name: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

const getReasonLabels = (t: any): Record<string, string> => ({
  SPAM: t('reasonSpam'),
  INAPPROPRIATE: t('reasonInappropriate'),
  FAKE: t('reasonFake'),
  INCORRECT_INFO: t('reasonIncorrectInfo'),
  OTHER: t('reasonOther'),
});

const getStatusLabels = (t: any): Record<string, string> => ({
  PENDING: t('statusPending'),
  REVIEWED: t('statusReviewed'),
  RESOLVED: t('statusResolved'),
  DISMISSED: t('statusDismissed'),
});

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  REVIEWED: 'bg-blue-100 text-blue-800 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  DISMISSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function ReportsList() {
  const t = useTranslations('reports');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [reports, setReports] = useState<PostReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED' | 'ALL'>('ALL');

  const reasonLabels = getReasonLabels(t);
  const statusLabels = getStatusLabels(t);
  
  const dateLocale = locale === 'es' ? es : locale === 'it' ? it : en;

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filter === 'ALL' 
        ? '/api/reports' 
        : `/api/reports?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(t('errorLoading'));
      const data = await res.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: 'REVIEWED' | 'RESOLVED' | 'DISMISSED') => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error(t('errorUpdating'));

      // Recargar reportes
      fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorUpdating'));
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <Button onClick={fetchReports} className="mt-4">
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList>
          <TabsTrigger value="ALL">{t('all')}</TabsTrigger>
          <TabsTrigger value="PENDING">{t('pending')}</TabsTrigger>
          <TabsTrigger value="REVIEWED">{t('reviewed')}</TabsTrigger>
          <TabsTrigger value="RESOLVED">{t('resolved')}</TabsTrigger>
          <TabsTrigger value="DISMISSED">{t('dismissed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {filter !== 'ALL' 
                  ? `${t('noReportsWithStatus')} ${statusLabels[filter]}`
                  : t('noReports')}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {report.post.instrument.title}
                        </CardTitle>
                        <CardDescription>
                          {report.post.instrument.category.nameEs}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[report.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[report.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-2">{t('reportedBy')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.reporter.name && report.reporter.lastName
                            ? `${report.reporter.name} ${report.reporter.lastName}`
                            : report.reporter.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.createdAt), 
                            locale === 'es' 
                              ? "dd 'de' MMMM 'de' yyyy 'a las' HH:mm"
                              : locale === 'it'
                              ? "dd MMMM yyyy 'alle' HH:mm"
                              : "MMMM dd, yyyy 'at' HH:mm", 
                            { locale: dateLocale })}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-2">{t('postOwner')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.post.owner.name && report.post.owner.lastName
                            ? `${report.post.owner.name} ${report.post.owner.lastName}`
                            : report.post.owner.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">{t('reportReason')}</h4>
                      <Badge variant="outline">{reasonLabels[report.reason]}</Badge>
                      {report.comment && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">{report.comment}</p>
                        </div>
                      )}
                    </div>

                    {report.reviewer && report.reviewedAt && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">{t('reviewedBy')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.reviewer.name && report.reviewer.lastName
                            ? `${report.reviewer.name} ${report.reviewer.lastName}`
                            : report.reviewer.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(report.reviewedAt), 
                            locale === 'es' 
                              ? "dd 'de' MMMM 'de' yyyy 'a las' HH:mm"
                              : locale === 'it'
                              ? "dd MMMM yyyy 'alle' HH:mm"
                              : "MMMM dd, yyyy 'at' HH:mm", 
                            { locale: dateLocale })}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Link href={`/posts/${report.postId}`}>
                        <Button variant="outline" size="sm">
                          {t('viewPost')}
                        </Button>
                      </Link>
                      {report.status === 'PENDING' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                          >
                            {t('markAsResolved')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                          >
                            {t('dismiss')}
                          </Button>
                        </>
                      )}
                      {report.status === 'REVIEWED' && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                          >
                            {t('markAsResolved')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                          >
                            {t('dismiss')}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

