'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Autoplay,
  EffectCards,
  Navigation,
  Pagination,
} from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const images = [
  '/gym1.jpg',
  '/gym2.jpg',
  '/gym3.jpg',
  '/gym4.jpg',
  // <-- Si quieres más, sólo agrégalos aquí
];

export default function Gallery() {
  return (
    <section
      id="galeria"
      className="bg-black py-24 flex flex-col items-center"
    >
      {/* Título igual que testimonios */}
      <h2 className="text-5xl font-extrabold text-white mb-3">
        Instalaciones
      </h2>
      <p className="text-2xl text-brand mb-12">
        Descubre nuestro espacio
      </p>

      <div className="relative w-full max-w-4xl">
        {/* Flechas personalizadas */}
        <button
          id="gPrev"
          aria-label="Anterior"
          className="swiper-nav --left"
        >
          ‹
        </button>
        <button
          id="gNext"
          aria-label="Siguiente"
          className="swiper-nav --right"
        >
          ›
        </button>

        <Swiper
          modules={[Autoplay, EffectCards, Navigation, Pagination]}
          effect="cards"
          grabCursor
          slidesPerView={1}
          navigation={{
            prevEl: '#gPrev',
            nextEl: '#gNext',
          }}
          pagination={{
            el: '#gPagination',
            clickable: true,
            renderBullet: (_index, className) =>
              `<span class="${className} mx-1"></span>`,
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          loop={false}     // sin loop para evitar warnings
          className="!overflow-visible"
        >
          {images.map((src) => (
            <SwiperSlide
              key={src}
              className="rounded-2xl overflow-hidden"
            >
              <div className="relative w-full h-64 md:h-80 lg:h-96">
                <Image
                  src={src}
                  alt="Instalaciones Muscle Up Gym"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width:768px) 90vw, 600px"
                  priority
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Paginación */}
        <div
          id="gPagination"
          className="swiper-pagination flex justify-center mt-10"
        />
      </div>

      {/* estilos globales para Swiper */}
      <style jsx global>{`
        /* Flechas de navegación */
        .swiper-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          font-size: 3rem;                /* tamaño grande */
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.3s;
          user-select: none;
        }
        .swiper-nav.--left {
          left: 1rem;
        }
        .swiper-nav.--right {
          right: 1rem;
        }
        .swiper-nav:hover {
          color: #ffcc00;                 /* dorado al hover */
        }

        /* Bullets/puntos de paginación */
        #gPagination .swiper-pagination-bullet {
          width: 0.75rem;
          height: 0.75rem;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 9999px;
          transition: all 0.3s;
          margin: 0 0.25rem;
        }
        #gPagination .swiper-pagination-bullet-active {
          background: #ffcc00;            /* dorado */
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </section>
  );
}
