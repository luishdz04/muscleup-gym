'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import { initParticles } from '@/lib/initParticles';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLDivElement | null>(null);
  const separator = useRef<HTMLDivElement | null>(null);

  /* Animaciones de h1, h2 y separador */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('h1', { opacity: 0, y: 60, duration: 1, ease: 'power2.out' });
      gsap.from('h2', { opacity: 0, y: 40, duration: 1, delay: 0.2, ease: 'power2.out' });
      gsap.from(separator.current, {
        scaleX: 0,
        transformOrigin: 'center',
        duration: 0.8,
        delay: 0.4,
        ease: 'power2.out',
      });
    }, root);

    /* Partículas */
    initParticles('particles-bg');

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* vídeo de fondo */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* overlay oscuro */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none z-10" />

      {/* lienzo Particles.js */}
      <div id="particles-bg" className="absolute inset-0 z-20" />

      {/* contenido */}
      <div className="relative z-30 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
          El momento es ahora
        </h1>

        <div ref={separator} className="mx-auto my-6 bg-brand w-20 h-[3px] rounded-full" />

        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8">
          Cambia tu estilo de vida
        </h2>

        {/* Botón sin GSAP, con z-40 propio */}
        <a
          href="/registro/paso1"
          className="relative z-40 inline-block bg-brand text-black border-2 border-brand
                     hover:bg-white hover:text-black px-10 py-3 rounded-full
                     font-semibold tracking-wide shadow-md hover:shadow-lg
                     transition-all duration-300"
        >
          Inscribirse
        </a>
      </div>
    </section>
  );
}
