'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Interfaz para rutinas
interface Rutina {
  filename: string;
  nombre: string;
  descripcion: string;
}

// Importar PDFViewer dinámicamente
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 bg-black min-h-screen">
      <div className="text-[#FFCC00] text-xl">Cargando visor PDF...</div>
    </div>
  )
});

export default function RutinasViewer() {
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [password, setPassword] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      
      // Cargar lista de PDFs disponibles
      fetchPDFs(authPassword);
    }
  }, [mounted, router]);

  const fetchPDFs = async (authPassword: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/pdfs', {
        headers: {
          'Authorization': `Bearer ${authPassword}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar la lista de PDFs');
      }
      
      const data = await response.json();
      setRutinas(data.pdfs);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar PDFs:', err);
      setError('No se pudieron cargar las rutinas disponibles');
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-[#FFCC00] text-xl">Cargando rutinas disponibles...</div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => fetchPDFs(password)}
              className="mt-4 px-4 py-2 bg-[#FFCC00] text-black rounded hover:bg-[#FFD700] transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : rutinas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No se encontraron rutinas disponibles</p>
            <p className="text-gray-500 mt-2">Contacta al administrador para más información</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rutinas.map((rutina) => (
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
        )}
      </div>
    </div>
  );
}
