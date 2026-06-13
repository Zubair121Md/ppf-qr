import { redirect } from 'next/navigation';
import { getWorkerFromCookies, isStaffRole } from '@/lib/auth';

export default async function WorkerOrdersLayout({ children }) {
  const worker = await getWorkerFromCookies();

  if (!worker) {
    redirect('/worker/login');
  }

  if (isStaffRole(worker.role)) {
    redirect('/admin');
  }

  return children;
}
