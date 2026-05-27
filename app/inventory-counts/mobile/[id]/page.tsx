import { MobileCountView } from '@/components/inventory-count/MobileCountView';

export default async function MobileCountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileCountView operativeId={id} />
    </div>
  );
}
