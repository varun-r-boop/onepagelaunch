'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Check, ChevronDown, Github, Link2, Mail, MousePointerClick, Rocket, Smartphone, Sparkles, Youtube } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { buildQuickStartSite } from '@/lib/site/quickstart';
import { PAGE_HOST } from '@/lib/slug';
import { AddressForm } from '@/components/address-form';
import SiteRenderer from '@/components/site/SiteRenderer';
import { UpgradeButton } from '@/components/billing';
import { PLAN_FEATURES, PRO_PRICE_USD } from '@/lib/plans';

const container = 'mx-auto w-full max-w-6xl px-5 md:px-8';
const card = 'rounded-[14px] border border-[#e8e8eb] bg-[#f6f6f7]';

const STEPS = [
  { title: 'Claim your address', body: `Pick ${PAGE_HOST}/your-product. That's your page's link.` },
  { title: 'Answer three questions', body: 'Name, what it does, and whether to collect emails or link to your app. We write the page.' },
  { title: 'Tweak and publish', body: 'Click any text to change it, pick two colors, paste your links. Publish when it feels right.' },
];

const FAQS = [
  { q: 'Do I need an account to start?', a: 'No. Claim an address and build your page right away. You only create a free account when you publish.' },
  { q: 'Do I need design or coding skills?', a: 'None. Every section is already designed. You change the words, pick two colors, and switch sections on or off.' },
  { q: 'How does the waitlist work?', a: 'Choose “Collect emails” and your page gets a sign-up form. Everyone who joins shows up in your editor, ready to export as a CSV.' },
  { q: 'Can I change my page after publishing?', a: 'Anytime. Edits are saved as a draft, and visitors only see them when you click Publish changes.' },
  { q: 'Can I use my own domain?', a: `Yes, on Pro. Connect a domain like yourproduct.com in a few minutes. On Free, your page lives at ${PAGE_HOST}/your-product.` },
  { q: 'What do I get with Pro?', a: `Analytics (visitors, sign-ups, conversion rate and where people come from) and a custom domain, for $${PRO_PRICE_USD}/month. Cancel anytime.` },
];

// Real pages made with the builder, rendered at desktop width and scaled to fit
const EXAMPLES = [
  {
    address: 'invoicely',
    info: { name: 'Invoicely', headline: 'Invoicing that takes 10 seconds', description: 'Send beautiful invoices and get paid faster.', goal: 'waitlist' as const, link: '' },
    colors: { accent: '#4f46e5', background: '#ffffff' },
  },
  {
    address: 'shipkit',
    info: { name: 'Shipkit', headline: 'The deploy tool for tiny teams', description: 'Push to main. Shipkit handles the rest.', goal: 'link' as const, link: 'shipkit.dev' },
    colors: { accent: '#818cf8', background: '#070b1a' },
  },
];

function ExamplePage({ example, className }: { example: (typeof EXAMPLES)[number]; className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const site = useMemo(() => {
    const built = buildQuickStartSite(example.info, { templateId: 'launch', accent: example.colors.accent, include: ['bento'] }, { projectName: example.info.name, slug: undefined });
    return { ...built, theme: { ...built.theme, ...example.colors } };
  }, [example]);

  useEffect(() => {
    if (!frame.current) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 1280));
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#e8e8eb] bg-white shadow-2xl shadow-indigo-500/10 ${className ?? ''}`}>
      <div className="flex items-center gap-2 border-b border-[#e8e8eb] bg-[#f6f6f7] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto truncate rounded-md bg-white px-3 py-0.5 text-xs text-gray-500 ring-1 ring-[#e8e8eb]">{PAGE_HOST}/{example.address}</span>
      </div>
      <div
        ref={frame}
        className="pointer-events-none relative overflow-hidden"
        style={{ height: Math.round(1180 * scale), background: example.colors.background }}
        role="img"
        aria-label={`Example page: ${example.info.name}`}
      >
        <div style={{ width: 1280, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <SiteRenderer site={site} thumbnail />
        </div>
      </div>
    </div>
  );
}

function LivePreview() {
  // Client-only: example pages get random ids, which would differ from the server render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[480px]" />;
  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      <ExamplePage example={EXAMPLES[0]} />
      <ExamplePage example={EXAMPLES[1]} className="hidden md:block md:mt-12" />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    createClient().auth.getUser()
      .then(({ data }) => setSignedIn(!!data.user))
      .catch(() => {});
  }, []);

  // The address carries into the builder and is used when the page is published
  const claim = (slug: string) => router.push(`/templates/launch?slug=${encodeURIComponent(slug)}`);

  const focusStart = () => {
    document.getElementById('start')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => document.querySelector<HTMLInputElement>('#start input')?.focus(), 400);
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#e8e8eb] bg-white/80 backdrop-blur-md">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="text-xl">🧱</span> OnePageLaunch
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[#6b7280] md:flex">
            <a href="#how" className="hover:text-[#0a0a0a]">How it works</a>
            <a href="#benefits" className="hover:text-[#0a0a0a]">Features</a>
            <a href="#pricing" className="hover:text-[#0a0a0a]">Pricing</a>
            <a href="#questions" className="hover:text-[#0a0a0a]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href={signedIn ? '/dashboard' : '/auth/signin'} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#6b7280] hover:text-[#0a0a0a] sm:inline-block">
              {signedIn ? 'Dashboard' : 'Sign in'}
            </Link>
            <button type="button" onClick={focusStart} className="rounded-[14px] bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
              Get started
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[520px]" style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 30%, rgba(99, 102, 241, 0.14), transparent 70%)' }} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'linear-gradient(#e8e8eb 1px, transparent 1px), linear-gradient(90deg, #e8e8eb 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse 70% 45% at 50% 0%, black, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 45% at 50% 0%, black, transparent 75%)',
            }}
          />
          <div className={`${container} relative pt-16 pb-12 text-center md:pt-24`}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e8eb] bg-[#f6f6f7] px-3 py-1 text-xs font-medium text-[#6b7280]">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Bento-style landing pages for your product
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Your SaaS landing page, live in minutes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6b7280] md:text-xl">
              Claim your address, answer three questions, and publish a modern one-page site with a waitlist, pricing and FAQ built in. No design skills, no code.
            </p>
            <div id="start" className="mx-auto mt-10 max-w-xl scroll-mt-24">
              <AddressForm onClaim={claim} buttonLabel="Start building" />
            </div>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-[#6b7280]">
              {['Free to start', 'No account needed to build', 'Publish when you’re ready'].map(item => (
                <span key={item} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-indigo-600" /> {item}</span>
              ))}
            </p>
            <div className="mt-14 text-left md:mt-16">
              <LivePreview />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-16 py-20 md:py-28">
          <div className={container}>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">How it works</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">From idea to live page in three steps</h2>
            </div>
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className={`${card} p-6`}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#6b7280]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="benefits" className="scroll-mt-16 pb-20 md:pb-28">
          <div className={container}>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Features</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Everything a launch page needs</h2>
              <p className="mt-4 text-lg text-[#6b7280]">And nothing you have to design yourself.</p>
            </div>
            <div className="grid auto-rows-[minmax(200px,auto)] grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${card} flex flex-col justify-between p-6 sm:col-span-2 sm:row-span-2`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-indigo-600/10"><MousePointerClick className="h-5 w-5 text-indigo-600" /></span>
                <div className="my-8 rounded-xl border border-[#e8e8eb] bg-white p-6 text-center">
                  <p className="text-xs font-medium text-[#6b7280]">Coming soon</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">
                    Get paid in <span className="rounded-md px-1 ring-2 ring-indigo-500">10 seconds<span className="ml-0.5 inline-block h-6 w-0.5 translate-y-1 animate-pulse bg-indigo-600" /></span>
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">Click anything to edit</h3>
                  <p className="mt-2 text-[#6b7280]">Change any headline, button or price right on the page. No forms, no settings screens.</p>
                </div>
              </div>

              <div className={`${card} flex flex-col justify-between gap-6 p-6 sm:col-span-2`}>
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Github, label: 'acme/app', meta: '★ 12.4k' },
                    { icon: Youtube, label: 'Product demo', meta: '▶ plays inline' },
                    { icon: Link2, label: 'App Store', meta: '★ 4.8' },
                  ].map(chip => (
                    <span key={chip.label} className="inline-flex items-center gap-2 rounded-lg border border-[#e8e8eb] bg-white px-3 py-2 text-sm">
                      <chip.icon className="h-4 w-4" /> <span className="font-medium">{chip.label}</span> <span className="text-xs text-[#6b7280]">{chip.meta}</span>
                    </span>
                  ))}
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Paste a link, get a tile</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">GitHub repos show stars, videos play, apps show ratings, and social profiles land in your footer.</p>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-6 rounded-[14px] bg-indigo-600 p-6 text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-black/15"><Mail className="h-5 w-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Waitlist built in</h3>
                  <p className="mt-1 text-sm opacity-85">Collect emails before launch. Export them anytime.</p>
                </div>
              </div>

              <div className={`${card} flex flex-col justify-between gap-6 p-6`}>
                <div className="flex gap-2" aria-hidden>
                  {[['#ffffff', '#4f46e5'], ['#070b1a', '#818cf8'], ['#faf7f2', '#ea580c']].map(([bg, accent]) => (
                    <span key={bg} className="flex h-10 w-10 items-end justify-end rounded-lg border border-[#e8e8eb] p-1" style={{ background: bg }}>
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: accent }} />
                    </span>
                  ))}
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Two colors, any look</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Pick a primary and a background. Everything else matches.</p>
                </div>
              </div>

              <div className={`${card} flex flex-col justify-between gap-6 p-6`}>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700"><Check className="h-4 w-4" /> Live</span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Draft, then publish</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Edit privately. Visitors only see what you publish.</p>
                </div>
              </div>

              <div className={`${card} flex flex-col justify-end p-6`}>
                <p className="text-5xl font-extrabold tracking-tight">$0</p>
                <p className="mt-2 text-sm text-[#6b7280]">To build and publish your page</p>
              </div>

              <div className={`${card} flex flex-col justify-between gap-6 p-6 sm:col-span-2`}>
                <Smartphone className="h-6 w-6 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Looks right on every screen</h3>
                  <p className="mt-1 text-sm text-[#6b7280]">Every section adapts to phones automatically, and you can preview mobile while you edit.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-16 pb-20 md:pb-28">
          <div className={container}>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">Pricing</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Start free. Upgrade when it’s working.</h2>
            </div>
            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              <div className={`${card} flex flex-col p-7`}>
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="mt-1 text-sm text-[#6b7280]">Everything you need to launch</p>
                <p className="mt-6 flex items-baseline gap-1"><span className="text-5xl font-extrabold tracking-tight">$0</span><span className="text-sm text-[#6b7280]">/forever</span></p>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {PLAN_FEATURES.free.map(feature => (
                    <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> {feature}</li>
                  ))}
                </ul>
                <button type="button" onClick={focusStart} className="mt-8 rounded-[14px] border border-[#e8e8eb] bg-white px-5 py-3 text-sm font-semibold hover:border-[#6b7280] cursor-pointer">
                  Start building
                </button>
              </div>
              <div className="relative flex flex-col rounded-[14px] border-2 border-indigo-600 bg-white p-7 shadow-xl shadow-indigo-500/10">
                <span className="absolute -top-3 left-7 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">For growing products</span>
                <h3 className="text-lg font-semibold">Pro</h3>
                <p className="mt-1 text-sm text-[#6b7280]">Know what’s working, on your own domain</p>
                <p className="mt-6 flex items-baseline gap-1"><span className="text-5xl font-extrabold tracking-tight">${PRO_PRICE_USD}</span><span className="text-sm text-[#6b7280]">/month</span></p>
                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {PLAN_FEATURES.pro.map(feature => (
                    <li key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" /> {feature}</li>
                  ))}
                </ul>
                <div className="mt-8">
                  {signedIn ? (
                    <UpgradeButton className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer" />
                  ) : (
                    <button type="button" onClick={focusStart} className="w-full rounded-[14px] bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer">
                      Start free, upgrade anytime
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="questions" className="scroll-mt-16 pb-20 md:pb-28">
          <div className={`${container} max-w-3xl`}>
            <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-5xl">Questions, answered</h2>
            <div className="divide-y divide-[#e8e8eb] border-y border-[#e8e8eb]">
              {FAQS.map(item => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                    {item.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#6b7280] transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-[#6b7280]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="pb-20 md:pb-28">
          <div className={container}>
            <div className="relative overflow-hidden rounded-[14px] bg-indigo-600 px-6 py-16 text-center text-white md:px-16 md:py-20">
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 20% 0%, white, transparent 45%), radial-gradient(circle at 90% 100%, white, transparent 40%)' }} />
              <Rocket className="relative mx-auto h-8 w-8" />
              <h2 className="relative mt-4 text-3xl font-bold tracking-tight md:text-5xl">Claim your page</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-lg opacity-85">Grab your address before someone else does. It only takes a minute to get started.</p>
              <div className="relative mx-auto mt-8 max-w-xl text-gray-900 [&_p]:text-white/90 [&_p_span]:!text-white">
                <AddressForm onClaim={claim} buttonLabel="Start building" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e8e8eb] py-10">
        <div className={`${container} flex flex-col items-center justify-between gap-4 text-sm text-[#6b7280] md:flex-row`}>
          <span>© {new Date().getFullYear()} OnePageLaunch</span>
          <div className="flex items-center gap-6">
            <a href="#how" className="hover:text-[#0a0a0a]">How it works</a>
            <Link href={signedIn ? '/dashboard' : '/auth/signin'} className="hover:text-[#0a0a0a]">{signedIn ? 'Dashboard' : 'Sign in'}</Link>
            <button type="button" onClick={focusStart} className="inline-flex items-center gap-1 hover:text-[#0a0a0a] cursor-pointer">Start building <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
