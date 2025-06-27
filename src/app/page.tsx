'use client';

import { motion } from 'framer-motion';
import Link from "next/link";

const floatingBricks = [
  { style: 'top-[10%] left-[5%]', delay: 0 },
  { style: 'top-[30%] left-[90%]', delay: 0.2 },
  { style: 'top-[80%] left-[40%]', delay: 0.4 },
];

const features = [
  {
    color: 'bg-blue-50',
    emoji: '🧱',
    title: 'Drag and Drop',
    desc: 'Arrange blocks like Lego pieces to build your story.',
  },
  {
    color: 'bg-purple-50',
    emoji: '🎨',
    title: 'Custom Styling',
    desc: 'Change backgrounds, borders, and layouts on the fly.',
  },
  {
    color: 'bg-yellow-50',
    emoji: '🚀',
    title: 'Instant Deploy',
    desc: 'Your site is live the moment you hit "Launch".',
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* SVG Pattern Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'60\' height=\'60\' fill=\'white\'/%3E%3Crect x=\'1\' y=\'1\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'21\' y=\'1\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'41\' y=\'1\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'1\' y=\'21\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'21\' y=\'21\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'41\' y=\'21\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'1\' y=\'41\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'21\' y=\'41\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3Crect x=\'41\' y=\'41\' width=\'18\' height=\'18\' stroke=\'%23e0e7ff\' stroke-width=\'2\'/%3E%3C/svg%3E")',
          backgroundSize: '60px 60px',
          opacity: 0.05,
        }}
      />

      {/* Floating Bricks */}
      {floatingBricks.map((b, i) => (
        <motion.div
          key={i}
          className={`floating-brick absolute w-[30px] h-[30px] bg-indigo-100 rounded-lg opacity-20 z-10 ${b.style}`}
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: b.delay }}
        />
      ))}

      <main className="relative z-20 max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <motion.section
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm mb-4 shadow">
            🧱 OnePageLaunch
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Launch your site brick by brick
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create your own block-style website in minutes. Drag, drop, and customize each block your way.
          </p>
        </motion.section>

        {/* Features Grid */}
        <motion.section
          className="grid md:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className={`rounded-xl ${f.color} p-6 shadow hover:scale-105 transition-transform`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h2 className="text-lg font-bold mb-2">{f.emoji} {f.title}</h2>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* CTA */}
        <motion.section
          className="text-center mt-24"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <Link href="/create">
            <span className="inline-block px-8 py-4 bg-black text-white rounded-full shadow-lg hover:scale-105 transition-transform text-lg cursor-pointer">
              🚀 Start Building Now
            </span>
          </Link>
        </motion.section>
      </main>
    </div>
  );
}
