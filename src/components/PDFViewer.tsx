'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PDFViewerProps {
  filename: string;
  password: string;
}

// Componente interno que usa PDF.js siguiendo los ejemplos oficiales de Mozilla
function PDFViewerCore({ filename, password }: PDFViewerProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfLib, setPdfLib] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('rutinasPassword');
    router.push('/rutinas');
  };

  // Cargar PDF.js siguiendo los ejemplos oficiales
  useEffect(() => {
    const loadPDFJS = async () => {
      try {
        // Importar la biblioteca principal
        const pdfjsLib = await import('pdfjs-dist');
        
        // Configurar el worker (siguiendo el enfoque de los ejemplos de Mozilla)
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
        pdfjsLib.GlobalWorkerOptions.workerPort = pdfjsWorker;
        
        setPdfLib(pdfjsLib);
      } catch (error) {
        console.error('Error al cargar PDF.js:', error);
        setError('No se pudo inicializar el visor de PDF');
      }
    };

    loadPDFJS();
  }, []);

  // Cargar el documento PDF cuando pdfLib esté disponible
  useEffect(() => {
    if (!pdfLib) return;

    const loadDocument = async () => {
      try {
        setLoading(true);
        
        // Obtener el PDF a través de la API
        const response = await fetch(`/api/pdf/${encodeURIComponent(filename)}`, {
          headers: { 'Authorization': `Bearer ${password}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const pdfData = await response.arrayBuffer();
        
        // Siguiendo el ejemplo básico de Mozilla para cargar un documento
        const loadingTask = pdfLib.getDocument({
          data: pdfData,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        });
        
        loadingTask.promise.then(
          (doc) => {
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setLoading(false);
          },
          (reason) => {
            setError(`Error al cargar el PDF: ${reason}`);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error al cargar el documento PDF:', err);
        setError(`No se pudo cargar el documento PDF. ${err instanceof Error ? err.message : ''}`);
        setLoading(false);
      }
    };

    loadDocument();
  }, [pdfLib, filename, password]);

  // Renderizar la página actual cuando cambie
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const renderCurrentPage = async () => {
      try {
        setLoading(true);
        
        // Obtener la página siguiendo el ejemplo oficial
        pdfDoc.getPage(currentPage).then((page) => {
          const viewport = page.getViewport({ scale });
          
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const context = canvas.getContext('2d');
          if (!context) return;
          
          // Siguiendo el ejemplo oficial de Mozilla para el renderizado
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Añadir soporte para pantallas HiDPI como en los ejemplos oficiales
          const outputScale = window.devicePixelRatio || 1;
          
          if (outputScale > 1) {
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = Math.floor(viewport.width) + 'px';
            canvas.style.height = Math.floor(viewport.height) + 'px';
            
            // Escalar el contexto para coincidir con la densidad de píxeles
            context.scale(outputScale, outputScale);
          }
          
          // Configuración de renderizado estándar
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            enableWebGL: true,
            renderInteractiveForms: true
          };
          
          // Renderizar la página
          const renderTask = page.render(renderContext);
          renderTask.promise.then(
            () => {
              // Añadir marca de agua
              addWatermark(context, viewport.width, viewport.height);
              setLoading(false);
            },
            (error) => {
              console.error('Error al renderizar la página:', error);
              setError(`Error al mostrar la página ${currentPage}`);
              setLoading(false);
            }
          );
        });
      } catch (err) {
        console.error('Error al renderizar la página:', err);
        setError(`Error al mostrar la página ${currentPage}`);
        setLoading(false);
      }
    };
    
    renderCurrentPage();
  }, [pdfDoc, currentPage, scale]);

  // Añadir marca de agua
  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.save();
    context.globalAlpha = 0.1;
    const fontSize = Math.floor(width/25);
    context.font = `${fontSize}px Arial`;
    context.fillStyle = '#FFCC00';
    context.textAlign = 'center';
    context.translate(width/2, height/2);
    context.rotate(-Math.PI/4);
    context.fillText(`Muscle Up Gym - ${new Date().toLocaleDateString()}`, 0, 0);
    context.restore();
  };

  // Navegar a la página anterior
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Navegar a la página siguiente
  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Cambiar el nivel de zoom
  const changeZoom = (newScale: number) => {
    setScale(newScale);
  };

  // Reintentar en caso de error
  const retry = () => {
    if (scale > 0.8) {
      setScale(0.8);
    }
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Mostrar mensajes de error si los hay
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black px-4 pt-16 pb-8">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto text-center">
          <h3 className="text-xl font-bold text-red-300 mb-4">Error</h3>
          <p className="text-red-200 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/rutinas/viewer"
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg font-bold hover:bg-neutral-700 transition-colors"
            >
              Volver a la lista
            </Link>
            <button
              onClick={retry}
              className="px-4 py-2 bg-[#FFCC00] text-black rounded-lg font-bold hover:bg-[#FFD700] transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Barra superior con botones de navegación principales */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-[#FFCC00]/30 py-3 px-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link
            href="/rutinas/viewer"
            className="flex items-center gap-2 bg-[#FFCC00] text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold hover:bg-[#FFD700] transition-colors text-sm sm:text-base"
          >
            ← Volver
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Controles de navegación PDF */}
      <div className="fixed top-[53px] left-0 right-0 z-20 bg-black/90 border-b border-[#FFCC00]/20 p-2 sm:p-3">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-sm"
            >
              ← Anterior
            </button>
            
            <span className="text-white bg-black/60 px-2 py-1 rounded border border-[#FFCC00]/20 text-xs sm:text-sm whitespace-nowrap">
              {loading ? "Cargando..." : `Pág ${currentPage}/${numPages}`}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages || loading}
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-sm"
            >
              Siguiente →
            </button>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 md:mt-0 w-full md:w-auto justify-center">
            <button
              onClick={() => changeZoom(Math.max(0.5, scale - 0.2))}
              className="px-2 py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
            >
              <span className="text-lg">−</span>
            </button>
            
            <span className="text-white text-xs sm:text-sm whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => changeZoom(Math.min(2.5, scale + 0.2))}
              className="px-2 py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Área del PDF */}
      <div className="pt-[110px] pb-6 px-1 sm:px-2 md:px-4">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-4 border-b-4 border-yellow-400 rounded-full animate-spin mb-4"></div>
              <p className="text-[#FFCC00] text-base sm:text-xl">Cargando documento...</p>
            </div>
          </div>
        )}
        
        {/* Canvas para renderizar el PDF */}
        <div className="flex justify-center overflow-auto">
          <div className="bg-white rounded-lg shadow-lg">
            <canvas 
              ref={canvasRef}
              className="block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportar con dynamic import
const PDFViewer = dynamic(() => Promise.resolve(PDFViewerCore), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 bg-black min-h-screen">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-4 border-b-4 border-yellow-400 rounded-full animate-spin mb-4"></div>
        <div className="text-[#FFCC00] text-xl">Inicializando visor...</div>
      </div>
    </div>
  )
});

export default PDFViewer;
