'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Importa dinámicamente el botón de instalación PWA
const InstallPWA = dynamic(() => import('@/components/InstallPWA'), { ssr: false });

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { href: '/planes', label: 'Planes' },
  { href: '/suplementos', label: 'Suplementos' },
  { href: '/rutinas', label: 'Rutinas' },
];

const actionItems = [
  { href: '/login', label: 'Acceso MUP', style: 'outline' },
  { href: '/registro/paso1', label: 'Registro MUP', style: 'solid' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
     <motion.nav 
  className="fixed top-0 left-0 right-0 z-50 bg-black shadow-lg border-b border-yellow-400/20"
  initial={{ y: -100 }}
  animate={{ y: 0 }}
  transition={{ duration: 0.5 }}
>
  <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
    <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* 🏋️ SOLO LOGO (SIN TEXTO) */}
            <motion.div 
              className="flex items-center -ml-2 lg:-ml-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/" className="flex items-center group">
                <motion.img 
                  src="/logo.png" 
                  alt="Muscle Up Gym" 
                  className="h-12 lg:h-14 w-auto drop-shadow-lg"
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>

            {/* 🖥️ MENÚ DESKTOP - DISTRIBUIDO MEJOR */}
            <div className="hidden lg:flex items-center space-x-8">
              
              {/* Enlaces de navegación normales */}
              <div className="flex items-center space-x-6">
                {navItems.map(({ href, label }, index) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      href={href}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group text-white hover:text-yellow-400 hover:bg-white/5"
                    >
                      {label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Separador visual */}
              <div className="w-px h-6 bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent" />
              
              {/* Botones de acción */}
              <div className="flex items-center space-x-3">
                {actionItems.map(({ href, label, style }, index) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  >
                    <Link
                      href={href}
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 shadow-lg relative overflow-hidden group ${
                        style === 'solid'
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 hover:shadow-yellow-400/25'
                          : 'border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-yellow-400/25'
                      }`}
                    >
                      <span className="relative z-10">{label}</span>
                      {style === 'outline' && (
                        <span className="absolute inset-0 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                      )}
                    </Link>
                  </motion.div>
                ))}
                {/* Botón de instalar PWA */}
                <div className="flex items-center">
                  <InstallPWA />
                </div>
              </div>
            </div>

            {/* 📱 BOTÓN HAMBURGUESA MÓVIL */}
            <motion.button
              className="lg:hidden relative w-10 h-10 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center"
              onClick={() => setIsOpen(!isOpen)}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <motion.span
                  className={`w-6 h-0.5 bg-yellow-400 transition-all duration-300 ${
                    isOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <motion.span
                  className={`w-6 h-0.5 bg-yellow-400 my-1 transition-all duration-300 ${
                    isOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <motion.span
                  className={`w-6 h-0.5 bg-yellow-400 transition-all duration-300 ${
                    isOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* 📱 MENÚ MÓVIL DESPLEGABLE */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menú móvil */}
            <motion.div
              className="fixed top-16 right-4 left-4 bg-black/95 backdrop-blur-md border border-yellow-400/20 rounded-2xl shadow-2xl z-50 lg:hidden overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-6">
                {/* Enlaces normales */}
                {navItems.map(({ href, label }, index) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={handleLinkClick}
                      className="block px-6 py-4 text-base font-medium transition-all duration-300 border-l-4 border-transparent hover:border-yellow-400 hover:bg-yellow-400/5 text-white hover:text-yellow-400"
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Separador */}
                <div className="mx-6 my-4 h-px bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent" />
                
                {/* Botones de acción en móvil */}
                <div className="px-6 space-y-3">
                  {actionItems.map(({ href, label, style }, index) => (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: (navItems.length + index) * 0.05 }}
                    >
                      <Link
                        href={href}
                        onClick={handleLinkClick}
                        className={`block w-full px-4 py-3 rounded-lg text-center font-bold transition-all duration-300 ${
                          style === 'solid'
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400'
                            : 'border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black'
                        }`}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  ))}
                  {/* Botón instalar PWA también en menú móvil */}
                  <div className="flex justify-center pt-2">
                    <InstallPWA />
                  </div>
                </div>
              </div>
              
              {/* Footer del menú móvil */}
              <div className="border-t border-yellow-400/20 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src="/logo.png" 
                    alt="Muscle Up Gym" 
                    className="h-8 w-auto"
                  />
                  <div>
                    <div className="text-yellow-400 font-bold text-sm">Muscle Up Gym</div>
                    <div className="text-yellow-400/60 text-xs">Tu mejor versión te espera</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Espaciador para compensar navbar fijo */}
      <div className="h-16 lg:h-20" />
    </>
  );
}