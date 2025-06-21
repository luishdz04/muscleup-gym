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
  FaDumbbell,
  FaUserCircle
} from 'react-icons/fa';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  description: string;
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
    description: "Próximamente"
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
    // Aquí implementarías la lógica de logout
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-gray-900 text-[#FFCC00] rounded-lg hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
          transition={{ type: "spring", damping: 25 }}
          className={`fixed lg:relative lg:translate-x-0 top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-40 lg:block ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="MuscleUp Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#FFCC00]">MuscleUp</h2>
                  <p className="text-xs text-gray-400">Panel de Cliente</p>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <FaUserCircle className="text-4xl text-[#FFCC00]" />
                <div>
                  <p className="text-white font-semibold">¡Hola, Cliente!</p>
                  <p className="text-xs text-gray-400">Miembro Activo</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const isDisabled = item.label === "Historial de Accesos";
                  
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => !isDisabled && router.push(item.href)}
                        disabled={isDisabled}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#FFCC00] text-black'
                            : isDisabled
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-[#FFCC00]'
                        }`}
                      >
                        <div className={`${isActive ? 'text-black' : ''}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{item.label}</p>
                          <p className={`text-xs ${
                            isActive ? 'text-gray-800' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        {isDisabled && (
                          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                            Pronto
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaSignOutAlt />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        <div className="p-6 lg:p-8">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6 text-center">
            <h1 className="text-2xl font-bold text-[#FFCC00]">MuscleUp GYM</h1>
          </div>
          
          {/* Page Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
