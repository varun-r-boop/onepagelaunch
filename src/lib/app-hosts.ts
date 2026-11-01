// Hosts that serve the OnePageLaunch app itself; any other host is a customer's custom domain
export function isAppHost(host: string): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, '');
  if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.vercel.app') || h.endsWith('.localhost')) return true;
  const own = [process.env.NEXT_PUBLIC_BASE_URL, ...(process.env.APP_HOSTS ?? '').split(',')]
    .map(value => value?.trim())
    .filter(Boolean)
    .map(value => value!.replace(/^https?:\/\//, '').replace(/[/:].*$/, '').toLowerCase());
  return own.includes(h) || own.includes(h.replace(/^www\./, ''));
}
