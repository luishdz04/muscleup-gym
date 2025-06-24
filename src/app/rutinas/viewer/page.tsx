'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Importar PDFViewer dinámicamente
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 bg-black min-h-screen">
      <div className="text-[#FFCC00] text-xl">Cargando visor PDF...</div>
    </div>
  )
});

// Lista de rutinas disponibles
const RUTINAS_DISPONIBLES = [
  { filename: 'rutina-principiante.pdf', nombre: 'Rutina Principiante', descripcion: 'Perfecta para empezar tu journey fitness' },
  { filename: 'rutina-intermedio.pdf', nombre: 'Rutina Intermedio', descripcion: 'Para quienes ya tienen experiencia' },
  { filename: 'rutina-avanzado.pdf', nombre: 'Rutina Avanzado', descripcion: 'Máximo nivel de entrenamiento' },
  { filename: 'rutina-fuerza.pdf', nombre: 'Rutina de Fuerza', descripcion: 'Enfocada en ganar potencia' },
];

export default function RutinasViewer() {
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Verificar autenticación
      const authPassword = sessionStorage.getItem('rutinas_auth');
      if (!authPassword) {
        router.push('/rutinas');
        return;
      }
      setPassword(authPassword);
    }
  }, [mounted, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('rutinas_auth');
      router.push('/rutinas');
    }
  };

  // Mostrar loading hasta que el componente esté montado
  if (!mounted || !password) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#FFCC00] text-xl">Cargando...</div>
      </div>
    );
  }

  if (selectedPDF) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header con botón de regreso */}
        <div className="bg-black/90 border-b border-[#FFCC00]/20 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <button
              onClick={() => setSelectedPDF(null)}
              className="px-4 py-2 bg-[#FFCC00] text-black rounded hover:bg-[#FFD700] transition-colors font-semibold"
            >
              ← Volver a la lista
            </button>
            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        
        <PDFViewer filename={selectedPDF} password={password} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b border-[#FFCC00]/20 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#FFCC00] mb-2">
              Rutinas de Entrenamiento
            </h1>
            <p className="text-gray-300">
              Selecciona una rutina para visualizar
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      {/* Lista de rutinas */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {RUTINAS_DISPONIBLES.map((rutina) => (
            <div
              key={rutina.filename}
              className="bg-zinc-900 border border-[#FFCC00]/20 rounded-lg p-6 hover:border-[#FFCC00]/50 transition-all cursor-pointer group"
              onClick={() => setSelectedPDF(rutina.filename)}
            >
              <h3 className="text-xl font-semibold text-[#FFCC00] mb-2 group-hover:text-[#FFD700]">
                {rutina.nombre}
              </h3>
              <p className="text-gray-300 mb-4">
                {rutina.descripcion}
              </p>
              <div className="text-[#FFCC00] text-sm font-medium">
                Click para abrir →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
