import type { Metadata } from 'next';
import AdminPanel from '@/components/AdminPanel';

export const metadata: Metadata = {
  title: 'Administration',
  description: 'Gestion des profils, des médias et des tarifs.',
};

export default function AdminPage() {
  return <AdminPanel />;
}
