"use client";

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, 
  FaCreditCard, 
  FaShoppingCart, 
  FaHistory,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
  FaChevronRight
} from 'react-icons/fa';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description: string;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    icon: <FaUser className="text-xl" />,
    label: "Mi Información",
    href: "/dashboard/cliente",
    description: "Gestiona tu perfil personal"
  },
  {
    icon: <FaCreditCard className="text-xl" />,
    label: "Pagos",
    href: "/dashboard/cliente/pagos",
    description: "Historial de membresías"
  },
  {
    icon: <FaShoppingCart className="text-xl" />,
    label: "Compras",
    href: "/dashboard/cliente/compras",
    description: "Productos y servicios"
  },
  {
    icon: <FaHistory className="text-xl" />,
    label: "Historial de Accesos",
    href: "/dashboard/cliente/historial",
    description: "Próximamente",
    disabled: true
  }
];

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Implementar lógica de logout
    router.push('/');
  };

  const handleNavigation = (href: string, disabled?: boolean) => {
    if (!disabled) {
      router.push(href);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Botón de menú flotante */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-6 left-6 z-50 w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors"
      >
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaTimes className="text-black text-xl" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaBars className="text-black text-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Overlay oscuro */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-80 bg-gray-900 z-50 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header con logo */}
              <div className="p-6 bg-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="relative w-12 h-12"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <Image
                        src="/logo.png"
                        alt="MuscleUp Logo"
                        fill
                        className="object-contain"
                      />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold text-[#FFCC00]">MuscleUp GYM</h2>
                      <p className="text-xs text-gray-400">Panel de Cliente</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del usuario */}
              <div className="px-6 py-4 bg-gray-800/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#FFCC00] rounded-full flex items-center justify-center">
                    <FaUserCircle className="text-2xl text-black" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Cliente MuscleUp</p>
                    <p className="text-xs text-[#FFCC00]">Miembro Premium</p>
                  </div>
                </div>
              </div>

              {/* Navegación */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    
                    return (
                      <motion.li
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <button
                          onClick={() => handleNavigation(item.href, item.disabled)}
                          disabled={item.disabled}
                          className={`w-full group relative overflow-hidden rounded-lg transition-all duration-300 ${
                            isActive
                              ? 'bg-[#FFCC00] text-black shadow-lg'
                              : item.disabled
                              ? 'bg-gray-800/50 cursor-not-allowed'
                              : 'hover:bg-gray-800'
                          }`}
                        >
                          {/* Efecto de hover */}
                          {!item.disabled && !isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                          )}
                          
                          <div className="relative flex items-center p-4">
                            <div className={`mr-4 ${isActive ? 'text-black' : 'text-[#FFCC00]'}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className={`font-semibold ${
                                isActive ? 'text-black' : 'text-white'
                              } ${item.disabled ? 'opacity-50' : ''}`}>
                                {item.label}
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                isActive ? 'text-gray-800' : 'text-gray-400'
                              } ${item.disabled ? 'opacity-50' : ''}`}>
                                {item.description}
                              </p>
                            </div>
                            {!item.disabled && (
                              <FaChevronRight className={`ml-2 text-sm transition-transform group-hover:translate-x-1 ${
                                isActive ? 'text-black' : 'text-gray-600'
                              }`} />
                            )}
                            {item.disabled && (
                              <span className="ml-2 text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                                Pronto
                              </span>
                            )}
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Botón de salir */}
              <div className="p-4 border-t border-gray-800">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-300 shadow-lg group"
                >
                  <FaSignOutAlt className="transition-transform group-hover:-translate-x-1" />
                  <span className="font-semibold">Cerrar Sesión</span>
                </motion.button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <main className="min-h-screen">
        <div className="p-6 lg:p-8 pt-20 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
