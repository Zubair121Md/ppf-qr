import { redirect } from 'next/navigation';
import { getWorkerFromCookies } from '@/lib/auth';

export default async function WorkerHome() {
  const worker = await getWorkerFromCookies();

  if (!worker) {
    redirect('/worker/login');
  }

  redirect('/worker/orders');
}
