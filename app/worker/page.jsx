import { redirect } from 'next/navigation';
import { getWorkerFromCookies, isStaffRole } from '@/lib/auth';

export default async function WorkerHome() {
  const worker = await getWorkerFromCookies();

  if (!worker) {
    redirect('/worker/login');
  }

  if (isStaffRole(worker.role)) {
    redirect('/admin');
  }

  redirect('/worker/orders');
}
