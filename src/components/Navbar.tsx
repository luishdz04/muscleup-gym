'use client';
import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { href: '/planes', label: 'Planes' },
  { href: '/suplementos', label: 'Suplementos' },
  { href: '/bolsa-trabajo', label: 'Bolsa de Trabajo' },
  { href: '/ejercicios', label: 'Ejercicios' },
  { href: '/login', label: 'Acceso MUP' },
  { href: '/registro/paso1', label: 'Registro MUP' },
];

export default function Navbar() {
  return (
    <nav className="bg-black text-white py-4 px-6 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Muscle Up Gym
        </Link>
        <ul className="hidden md:flex space-x-6">
          {navItems.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-white hover:text-brand-hover transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}