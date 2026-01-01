import { AdminPostList } from '@/components/admin/AdminPostList';
import { getCurrentUserWithRole } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const user = await getCurrentUserWithRole();

  if (!user) {
    redirect('/login');
  }

  if (user.staffRole !== 'ADMIN' && user.staffRole !== 'OPERATOR') {
    redirect('/');
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona y modera las publicaciones de la plataforma
        </p>
      </div>
      <AdminPostList />
    </div>
  );
}


