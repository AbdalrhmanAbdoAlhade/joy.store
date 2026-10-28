import { useSeo } from '@/lib/hooks/useSeo';
import { NotFoundBlock } from '@/components/ui/States';

export function NotFoundPage() {
  useSeo({ title: 'الصفحة غير موجودة', description: 'لم نعثر على الصفحة المطلوبة.' });
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <NotFoundBlock what="الصفحة" />
    </div>
  );
}
