import { redirect } from 'next/navigation';
import { getWorkerFromCookies } from '@/lib/auth';

export default async function WorkerOrdersLayout({ children }) {
  const worker = await getWorkerFromCookies();

  if (!worker) {
    redirect('/worker/login');
  }

  if (worker.role === 'admin') {
    redirect('/admin');
  }

  return children;
}
