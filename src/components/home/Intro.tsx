'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import SplitType from 'split-type';
import { introCards } from '@/data/introCards';

gsap.registerPlugin(ScrollTrigger);

export default function Intro() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      introCards.forEach((card) => {
        const container = document.getElementById(`card-${card.id}`);
        if (!container) return;

        /* ── Parallax de fondo ─────────────────────────── */
        const bg = container.querySelector<HTMLDivElement>('.bg-img');
        if (bg) {
          gsap.to(bg, {
            yPercent: (card.parallax ?? 0.25) * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        }

        /* ── Split-Text y reveal ───────────────────────── */
        const heading = container.querySelector<HTMLElement>('.card-heading');
        const para    = container.querySelector<HTMLElement>('.card-para');
        if (heading && para) {
          const splitH = new SplitType(heading, { types: 'lines' });
          const splitP = new SplitType(para,    { types: 'lines' });

          gsap.set([splitH.lines, splitP.lines], { yPercent: 120, opacity: 0 });

          gsap.to([...splitH.lines, ...splitP.lines], {
            yPercent: 0,
            opacity: 1,
            stagger: 0.04,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 80%',
            },
          });
        }

       /* ── Contador opcional ─────────────────────────── */
if (card.counter) {
    const span = container.querySelector<HTMLSpanElement>('.counter-value');
    if (span) {
      const { prefix = '', suffix = '', value } = card.counter;
  
      ScrollTrigger.create({
        trigger: container,
        start: 'top 80%',
        once: true,
        onEnter() {
          // objeto de referencia para la animación
          const counterObj = { val: 0 };
  
          gsap.to(counterObj, {
            val: value,
            duration: 2,
            ease: 'power1.out',
            snap: { val: 1 },          // redondea a enteros
            onUpdate() {
              span.textContent = `${prefix}${counterObj.val}${suffix}`;
            },
          });
        },
      });
    }
  }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="intro" className="bg-black">
      {/* ── Encabezado ───────────────────────────── */}
      <div className="text-center py-20">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white">
          INTRODUCCIÓN
        </h2>
        <div className="w-24 h-[3px] bg-brand mx-auto my-4" />
        <p className="text-white/80 text-lg">Descubre quiénes somos</p>
      </div>

      {/* ── Tarjetas ─────────────────────────────── */}
      {introCards.map((card) => (
       <article
       key={card.id}
       id={`card-${card.id}`}
       className="
         relative overflow-hidden         /* 👈  evita que el overlay sobresalga */
         min-h-[110vh] flex items-center justify-center
       "
     >
          {/* fondo */}
          <div
            className="bg-img absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${card.img})` }}
          />
          {/* overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* contenido */}
          <div
            className={`relative z-10 max-w-3xl mx-4 md:mx-20 p-8 md:p-12
                        rounded-lg backdrop-blur-md bg-black/60 text-white
                        ${
                          card.align === 'right'
                            ? 'ml-auto text-right'
                            : card.align === 'center'
                            ? 'mx-auto text-center'
                            : 'mr-auto'
                        }`}
          >
            <h3 className="card-heading text-2xl md:text-4xl font-extrabold mb-4">
              {card.title}
            </h3>
            <div className="w-16 h-[3px] bg-brand mb-6" />
            <p className="card-para text-lg md:text-xl leading-relaxed">
              {card.text}
            </p>

            {card.counter && (
              <div className="mt-8 flex flex-col items-center">
                <span className="counter-value text-brand text-4xl font-extrabold">0</span>
                {card.counter.title && (
                  <span className="text-base text-white mt-2">
                    {card.counter.title}
                  </span>
                )}
              </div>
            )}
          </div>
        </article>
      ))}


    </section>
  );
}
