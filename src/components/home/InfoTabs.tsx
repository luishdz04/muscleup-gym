'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type TabKey = 'horarios' | 'ubicacion' | 'entrenadores' | 'contacto';

const tabs: { key: TabKey; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'horarios', label: 'Horarios', Icon: ClockIcon },
  { key: 'ubicacion', label: 'Ubicación', Icon: MapPinIcon },
  { key: 'entrenadores', label: 'Nuestros Entrenadores', Icon: UsersIcon },
  { key: 'contacto', label: 'Contáctanos', Icon: EnvelopeIcon },
];

const schedule = [
  { day: 'Lunes',     hours: '6:00 - 22:00' },
  { day: 'Martes',    hours: '6:00 - 22:00' },
  { day: 'Miércoles', hours: '6:00 - 22:00' },
  { day: 'Jueves',    hours: '6:00 - 22:00' },
  { day: 'Viernes',   hours: '6:00 - 22:00' },
  { day: 'Sábado',    hours: '9:00 - 17:00' },
];

const trainers = [
  {
    name: 'Erick De Luna Hernández',
    role: 'Jefe',
    avatar: '/img/trainers/erick.jpg',
    bio: 'Especialista en entrenamiento HIIT y pérdida de peso. 7 años de experiencia.',
    tags: ['HIIT', 'Cardio', 'Pérdida de peso'],
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Entrenador de Fuerza',
    avatar: '/img/trainers/carlos.jpg',
    bio: 'Campeón nacional de powerlifting. Especialista en fuerza y ganancia muscular.',
    tags: ['Powerlifting', 'Hipertrofia', 'Nutrición'],
  },
  // ...añade más entrenadores aquí
];

export default function InfoTabs() {
  const [active, setActive] = useState<TabKey>('horarios');

  return (
    <section id="info" className="bg-black text-white py-16 px-4">
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold inline-flex items-center justify-center gap-2">
            Información general MUP <span>📋</span>
          </h2>
          <p className="text-lg text-gray-300 mt-2">
            Encuentra nuestros horarios, ubicación, entrenadores y contacto
          </p>
        </div>

        {/* nav tabs */}
        <nav className="flex justify-center space-x-6 mb-10">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`
                flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white
                transition-colors
                ${active === key ? 'text-white border-b-2 border-brand' : ''}
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* tab panels */}
        <div>
          {active === 'horarios' && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-brand" />
                Horarios
              </h3>
              <p className="text-gray-300">
                Nuestro gimnasio está abierto de Lunes a Sábado, a continuación te mostramos los horarios:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {schedule.map(({ day, hours }) => (
                  <div
                    key={day}
                    className="bg-white text-black rounded-lg p-4 shadow-lg text-center"
                  >
                    <h4 className="font-semibold mb-2">{day}</h4>
                    <p>{hours}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-gray-400 italic border-l-4 border-brand pl-4">
                * Entrada hasta 1 hora antes del cierre.
              </p>
            </div>
          )}

          {active === 'ubicacion' && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold flex items-center gap-2">
                <MapPinIcon className="w-6 h-6 text-brand" />
                Ubicación
              </h3>

              {/* Mapa embebido */}
              <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3553.017366937368!2d-101.56074932591812!3d27.061199753696098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x868bc7097088ba89%3A0xb8df300649d83db7!2sMUSCLE%20UP%20GYM!5e0!3m2!1ses!2smx!4v1748582869049!5m2!1ses!2smx"
    className="w-full h-full border-0"
    allowFullScreen
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  />
</div>

              {/* dirección y cómo llegar */}
              <div className="text-gray-300 space-y-2">
                <p className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-brand" />
                  Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila
                </p>
                <p className="text-brand">
                  Estamos ubicados en una zona de fácil acceso, cerca de la plaza principal.
                </p>

                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <ArrowRightIcon className="w-5 h-5 text-brand" />
                    Entre 2-3 minutos de la plaza principal
                  </p>
                  <p className="flex items-center gap-2">
                    <ArrowRightIcon className="w-5 h-5 text-brand" />
                    5 cuadras de la plaza principal
                  </p>
                </div>
              </div>
            </div>
          )}

          {active === 'entrenadores' && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-brand" />
                Nuestros Entrenadores
              </h3>
              <p className="text-gray-300">
                Nuestro equipo de entrenadores disponibles son:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {trainers.map((t) => (
                  <div
                    key={t.name}
                    className="bg-zinc-900 rounded-xl p-6 shadow-lg text-center space-y-4"
                  >
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-brand">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 100px, 128px"
                      />
                    </div>
                    <h4 className="text-xl font-semibold">{t.name}</h4>
                    <p className="text-brand font-medium">{t.role}</p>
                    <p className="text-gray-300">{t.bio}</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-brand text-black px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'contacto' && (
            <div className="space-y-6">
              <h3 className="text-3xl font-bold flex items-center gap-2">
                <EnvelopeIcon className="w-6 h-6 text-brand" />
                Contáctanos
              </h3>
              <p className="text-gray-300">
                ¿Tienes alguna pregunta? Estamos aquí para ayudarte.
              </p>

              <div className="bg-zinc-900 rounded-xl p-6 shadow-lg space-y-3">
                <p>
                  <span className="font-semibold">Teléfono:</span> 8661127905
                </p>
                <p>
                  <span className="font-semibold">Email:</span> administracion@muscleupgym.com.mx
                </p>
                <p>
                  <span className="font-semibold">Horario de atención:</span> Lunes a Viernes 8:00 – 20:00
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <a
                  href="https://facebook.com/tu-pagina"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-brand transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2v-3h2v-2c0-2 1-3 3-3h2v3h-2c-.3 0-1 0-1 1v2h3l-.5 3h-2.5v7A10 10 0 0 0 22 12z" />
                  </svg>
                </a>
                <span className="text-gray-400">Síguenos en Facebook</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
