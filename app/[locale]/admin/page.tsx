import { AdminPostList } from '@/components/admin/AdminPostList';
import { ReportsList } from '@/components/admin/ReportsList';
import { getCurrentUserWithRole } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTranslations } from 'next-intl/server';

export default async function AdminPage() {
  const user = await getCurrentUserWithRole();
  const t = await getTranslations('reports');
  const tCommon = await getTranslations('common');

  if (!user) {
    redirect('/login');
  }

  if (user.staffRole !== 'ADMIN' && user.staffRole !== 'OPERATOR') {
    redirect('/');
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('adminTitle')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('adminDescription')}
        </p>
      </div>
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">{tCommon('publications')}</TabsTrigger>
          <TabsTrigger value="reports">{tCommon('reports')}</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          <AdminPostList />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}



