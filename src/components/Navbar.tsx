'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-black/95 backdrop-blur-md border-b border-yellow-400/20 shadow-lg' 
            : 'bg-black/90 backdrop-blur-sm'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            
            {/* 🏋️ LOGO */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/" className="flex items-center space-x-3 group">
                <motion.img 
                  src="/logo.png" 
                  alt="Muscle Up Gym" 
                  className="h-10 lg:h-12 w-auto drop-shadow-lg"
                  whileHover={{ rotate: 5 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="hidden sm:block">
                  <motion.span 
                    className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-white to-yellow-400 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                  >
                    Muscle Up
                  </motion.span>
                  <div className="text-xs lg:text-sm text-yellow-400/80 font-medium tracking-wider">
                    GYM
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* 🖥️ MENÚ DESKTOP */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map(({ href, label }, index) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={href}
                    className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-300 relative group ${
                      href === '/login' || href === '/registro/paso1'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-yellow-400/25'
                        : 'text-white hover:text-yellow-400 hover:bg-white/5'
                    }`}
                  >
                    {label}
                    
                    {/* Animación de subrayado para enlaces normales */}
                    {href !== '/login' && href !== '/registro/paso1' && (
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 transition-all duration-300 group-hover:w-full" />
                    )}
                  </Link>
                </motion.div>
              ))}
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
                      className={`block px-6 py-4 text-base font-medium transition-all duration-300 border-l-4 border-transparent hover:border-yellow-400 hover:bg-yellow-400/5 ${
                        href === '/login' || href === '/registro/paso1'
                          ? 'text-yellow-400 bg-yellow-400/10'
                          : 'text-white hover:text-yellow-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{label}</span>
                        {(href === '/login' || href === '/registro/paso1') && (
                          <motion.span
                            className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full font-bold"
                            whileHover={{ scale: 1.1 }}
                          >
                            MUP
                          </motion.span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
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
