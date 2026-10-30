import Link from 'next/link';
import { SITE_TEMPLATES } from '@/lib/site/templates';
import TemplateThumbnail from './thumbnail';

export const metadata = {
  title: 'Templates – OnePageLaunch',
  description: 'Modern SaaS landing page templates you can edit in minutes.',
};

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">🧱 OnePageLaunch</Link>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl">Start from a template</h1>
        <p className="mt-3 max-w-xl text-lg text-gray-600">
          Each template is a complete, modern landing page. Pick one, click any text to change it, and publish.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SITE_TEMPLATES.map(template => (
            // The link is stretched over the card so the preview (which has its own buttons) isn't nested inside it
            <div
              key={template.id}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <TemplateThumbnail templateId={template.id} />
              <div className="border-t border-gray-100 p-5">
                <Link href={`/templates/${template.id}`} className="text-lg font-semibold text-gray-900 after:absolute after:inset-0">
                  {template.name}
                </Link>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                <p className="mt-4 text-sm font-semibold text-indigo-600 group-hover:underline">Try it in the editor →</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
