import { redirect } from 'next/navigation';

// There is one starting layout; colors and sections are chosen in the editor
export default function TemplatesPage() {
  redirect('/templates/launch');
}
