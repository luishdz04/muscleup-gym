'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const testimonials = [
  {
    id: 1,
    quote:
      'Haberme integrado a Muscle Up GYM ha sido una de las mejores experiencias que he disfrutado, cambió considerablemente mi vida, el bajar de peso y talla de una manera ordenada y progresiva, me ha permitido ahora gozar de una buena salud y mi estado de ánimo está excelente. Lo recomiendo ampliamente.',
    author: 'Juanita Guadalupe Lara',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
  {
    id: 2,
    quote:
      'Ha sido una de mis mejores experiencias el haberme integrado a Muscle Up GYM en San Buenaventura.',
    author: 'Marco Villarreal',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
  {
    id: 3,
    quote:
      'Cuando inicié mi proyecto de entrenamiento y salud, se me hacía imposible, algo de temor e incertidumbre; todo esto desapareció.',
    author: 'Oromi Arce',
    role: 'Usuario MUP',
    avatar: '/img/testimonials/testimonios.jpg',
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonios"
      className="py-24 bg-black text-center overflow-x-hidden"
    >
      {/* Encabezado */}
      <header className="space-y-3">
        <h2 className="text-5xl md:text-6xl font-extrabold text-white">
          Testimonios
        </h2>
        <p className="text-xl text-brand">
          Sección de testimonios de Usuarios MUP
        </p>
      </header>

      {/* Carrusel */}
      <div className="mt-16 px-4">
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1}                // 1 slide por vista
          centeredSlides                   // centrado siempre
          loop                             // loop opcional
          autoplay={{ delay: 6000 }}       // autoplay cada 6s
          pagination={{ clickable: true }} // bullets clickables
          className="overflow-hidden"
        >
          {testimonials.map((t) => (
            <SwiperSlide
              key={t.id}
              className="flex justify-center w-full"  // ocupa el 100% y centra su contenido
            >
              <figure className="
                relative
                max-w-3xl w-full           /* ancho máximo + 100% del contenedor */
                bg-zinc-900/85 backdrop-blur
                rounded-2xl px-8 md:px-14 pt-12 pb-16
                text-white
                mx-auto                     /* centro final de la card */
              ">
                {/* Cita */}
                <blockquote className="italic text-2xl md:text-3xl leading-relaxed">
                  “{t.quote}”
                </blockquote>

                {/* Estrellas */}
                <div className="mt-8 flex justify-center gap-1 text-2xl text-brand">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>

                {/* Autor + rol */}
                <figcaption className="mt-6">
                  <h3 className="text-2xl font-semibold">{t.author}</h3>
                  <span className="text-sm text-zinc-400">{t.role}</span>

                  {/* Avatar ABAJO */}
                  <div className="mt-6 flex justify-center">
                    <div className="
                      w-28 h-28 rounded-full overflow-hidden
                      border-4 border-brand bg-black
                    ">
                      <Image
                        src={t.avatar}
                        alt={t.author}
                        width={112}
                        height={112}
                        className="object-cover object-center"
                      />
                    </div>
                  </div>
                </figcaption>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
