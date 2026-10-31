import { notFound } from 'next/navigation';
import { SITE_TEMPLATES } from '@/lib/site/templates';
import TemplatePlayground from './playground';

export function generateStaticParams() {
  return SITE_TEMPLATES.map(t => ({ id: t.id }));
}

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!SITE_TEMPLATES.some(t => t.id === id)) notFound();
  return <TemplatePlayground templateId={id} />;
}
