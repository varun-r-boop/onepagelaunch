'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from "next/link";
import { useState, useEffect } from 'react';

const floatingBricks = [
  { style: 'top-[5%] left-[10%] w-[75px] h-[40px] bg-blue-200', delay: 0, duration: 4 },
  { style: 'top-[15%] left-[85%] w-[50px] h-[50px] bg-purple-200', delay: 0.2, duration: 5 },
  { style: 'top-[25%] left-[20%] w-[120px] h-[50px] bg-pink-200', delay: 0.4, duration: 6 },
  { style: 'top-[35%] left-[75%] w-[35px] h-[35px] bg-indigo-200', delay: 0.1, duration: 4.5 },
  { style: 'top-[45%] left-[5%] w-[60px] h-[60px] bg-cyan-200', delay: 0.3, duration: 5.5 },
  { style: 'top-[55%] left-[90%] w-[150px] h-[45px] bg-emerald-200', delay: 0.5, duration: 3.5 },
  { style: 'top-[65%] left-[15%] w-[25px] h-[25px] bg-amber-200', delay: 0.2, duration: 4.8 },
  { style: 'top-[75%] left-[80%] w-[45px] h-[45px] bg-rose-200', delay: 0.4, duration: 5.2 },
  { style: 'top-[85%] left-[30%] w-[100px] h-[60px] bg-violet-200', delay: 0.1, duration: 4.2 },
  { style: 'top-[95%] left-[70%] w-[40px] h-[40px] bg-sky-200', delay: 0.3, duration: 5.8 },
  { style: 'top-[10%] left-[50%] w-[175px] h-[55px] bg-lime-200', delay: 0.6, duration: 3.8 },
  { style: 'top-[40%] left-[60%] w-[70px] h-[70px] bg-orange-200', delay: 0.7, duration: 6.2 },
  { style: 'top-[70%] left-[45%] w-[140px] h-[75px] bg-teal-200', delay: 0.8, duration: 4.1 },
  { style: 'top-[20%] left-[35%] w-[30px] h-[30px] bg-red-200', delay: 0.9, duration: 4.7 },
  { style: 'top-[60%] left-[25%] w-[55px] h-[55px] bg-green-200', delay: 0.7, duration: 5.9 },
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
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

        <main className="relative z-20 max-w-7xl mx-auto px-6 py-20">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <div className="inline-block bg-black text-white px-4 py-2 rounded-xl text-sm mb-4 shadow">
              🧱 OnePageLaunch
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Launch your site brick by brick
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create your product page in minutes with blocks. Drag, drop, and customize each block your way.
            </p>
          </section>

          {/* Features Grid */}
          <section className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-xl ${f.color} p-6 shadow hover:scale-105 transition-transform`}
              >
                <h2 className="text-lg font-bold mb-2">{f.emoji} {f.title}</h2>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </section>

          {/* CTA */}
          <section className="text-center mt-24">
            <Link href="/create">
              <span className="inline-block px-8 py-4 bg-black text-white rounded-xl shadow-lg hover:scale-105 transition-transform text-lg cursor-pointer">
                🚀 Start Building Now
              </span>
            </Link>
          </section>
        </main>
      </div>
    );
  }

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
      <AnimatePresence>
        {floatingBricks.map((b, i) => (
          <motion.div
            key={i}
            className={`floating-brick absolute rounded-lg opacity-30 z-10 shadow-sm ${b.style}`}
            initial={{ y: 0, rotate: 0, scale: 1 }}
            animate={{ 
              y: [0, -30, 0], 
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: b.duration, 
              repeat: Infinity, 
              ease: 'easeInOut', 
              delay: b.delay,
              times: [0, 0.5, 1]
            }}
          />
        ))}
      </AnimatePresence>

      <main className="relative z-20 max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <motion.section
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block bg-black text-white px-4 py-2 rounded-xl text-sm mb-4 shadow">
            🧱 OnePageLaunch
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Launch your site brick by brick
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Create your product page in minutes with blocks. Drag, drop, and customize each block your way.
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
            <span className="inline-block px-8 py-4 bg-black text-white rounded-xl shadow-lg hover:scale-105 transition-transform text-lg cursor-pointer">
              🚀 Start Building Now
            </span>
          </Link>
        </motion.section>
      </main>
    </div>
  );
}
