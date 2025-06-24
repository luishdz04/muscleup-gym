'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PDFViewerProps {
  filename: string;
  password: string;
}

// Componente interno que usa PDF.js directamente
function PDFViewerCore({ filename, password }: PDFViewerProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [baseScale, setBaseScale] = useState<number>(1.0);
  const [pdfLib, setPdfLib] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('rutinasPassword');
    router.push('/rutinas');
  };

  // Cargar PDF.js y establecer el worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPDFJS = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs';
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
        
        const response = await fetch(`/api/pdf/${encodeURIComponent(filename)}`, {
          headers: { 'Authorization': `Bearer ${password}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const pdfData = await response.arrayBuffer();
        const loadingTask = pdfLib.getDocument(pdfData);
        const pdfDocument = await loadingTask.promise;
        
        setPdf(pdfDocument);
        setNumPages(pdfDocument.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar el documento PDF:', err);
        setError(`No se pudo cargar el documento PDF. ${err instanceof Error ? err.message : ''}`);
        setLoading(false);
      }
    };

    loadDocument();
  }, [pdfLib, filename, password]);

  // Calcular escala base para ajustar al ancho del contenedor
  const calculateBaseScale = async () => {
    if (!pdf || !containerRef.current) return;
    
    try {
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1 });
      
      // Obtener el ancho disponible del contenedor
      const containerWidth = containerRef.current.clientWidth;
      const padding = window.innerWidth < 768 ? 16 : 32; // Menos padding en móvil
      const availableWidth = containerWidth - padding;
      
      // Calcular la escala base para que el PDF se ajuste al ancho
      const calculatedScale = availableWidth / viewport.width;
      
      // En móviles, limitar la escala inicial
      const maxInitialScale = window.innerWidth < 768 ? 0.9 : 1.5;
      const newBaseScale = Math.min(calculatedScale, maxInitialScale);
      
      setBaseScale(newBaseScale);
      
      // Ajustar la escala inicial solo si es la primera vez
      if (scale === 1.0) {
        setScale(1.0);
      }
    } catch (err) {
      console.error('Error calculando escala:', err);
    }
  };

  // Recalcular escala cuando cambie el tamaño de la ventana
  useEffect(() => {
    calculateBaseScale();
    
    const handleResize = () => {
      calculateBaseScale();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdf, currentPage]);

  // Renderizar la página actual cuando cambie
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    
    const renderCurrentPage = async () => {
      try {
        setLoading(true);
        
        const page = await pdf.getPage(currentPage);
        
        // Usar la escala base multiplicada por el zoom del usuario
        const effectiveScale = baseScale * scale;
        const viewport = page.getViewport({ scale: effectiveScale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        
        // Soporte para pantallas HiDPI
        const outputScale = window.devicePixelRatio || 1;
        
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + "px";
        canvas.style.height = Math.floor(viewport.height) + "px";
        
        const transform = outputScale !== 1 
          ? [outputScale, 0, 0, outputScale, 0, 0] 
          : null;
        
        const renderContext = {
          canvasContext: context,
          transform: transform,
          viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        await renderTask.promise;
        
        addWatermark(context, canvas.width, canvas.height, outputScale);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al renderizar la página:', err);
        setError(`Error al mostrar la página ${currentPage}`);
        setLoading(false);
      }
    };
    
    renderCurrentPage();
  }, [pdf, currentPage, scale, baseScale]);

  // Añadir marca de agua
  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number, scale: number) => {
    context.save();
    context.globalAlpha = 0.1;
    const fontSize = Math.floor((width / scale) / 25);
    context.font = fontSize + 'px Arial';
    context.fillStyle = '#FFCC00';
    context.textAlign = 'center';
    context.translate(width/2, height/2);
    context.rotate(-Math.PI/4);
    context.fillText(`Muscle Up Gym - ${new Date().toLocaleDateString()}`, 0, 0);
    context.restore();
  };

  // Navegación
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const changeZoom = (newScale: number) => {
    setScale(newScale);
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const retry = () => {
    window.location.reload();
  };

  // Manejo de gestos táctiles para zoom
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    let initialDistance = 0;
    let initialScale = scale;

    const getDistance = (touches: TouchList) => {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const newScale = (currentDistance / initialDistance) * initialScale;
        setScale(Math.min(Math.max(0.5, newScale), 3));
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale]);

  // Mostrar mensajes de error
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black px-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md w-full text-center">
          <h3 className="text-xl font-bold text-red-300 mb-4">Error</h3>
          <p className="text-red-200 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
      {/* Barra superior fija */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-[#FFCC00]/30 py-2 sm:py-3 px-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link
            href="/rutinas/viewer"
            className="flex items-center gap-1 sm:gap-2 bg-[#FFCC00] text-black px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base"
          >
            ← Volver
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-xs sm:text-base"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Controles de navegación - Responsivos */}
      <div className="fixed top-[44px] sm:top-[56px] left-0 right-0 z-30 bg-black/90 border-b border-[#FFCC00]/20 p-2 sm:p-3">
        <div className="max-w-5xl mx-auto">
          {/* Controles de página */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1 || loading}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base flex-1 sm:flex-none"
              >
                ← Ant
              </button>
              
              <span className="text-white bg-black/60 px-2 py-1 sm:px-3 sm:py-1 rounded border border-[#FFCC00]/20 text-xs sm:text-base whitespace-nowrap">
                {loading ? "..." : `${currentPage}/${numPages}`}
              </span>
              
              <button
                onClick={nextPage}
                disabled={currentPage >= numPages || loading}
                className="px-2 py-1 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base flex-1 sm:flex-none"
              >
                Sig →
              </button>
            </div>
            
            {/* Controles de zoom */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => changeZoom(Math.max(0.5, scale - 0.25))}
                className="px-2 py-1 sm:px-3 sm:py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
              >
                −
              </button>
              
              <button
                onClick={resetZoom}
                className="text-white text-xs sm:text-sm min-w-[50px] sm:min-w-[60px]"
              >
                {Math.round(scale * 100)}%
              </button>
              
              <button
                onClick={() => changeZoom(Math.min(3, scale + 0.25))}
                className="px-2 py-1 sm:px-3 sm:py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Área del PDF con contenedor responsivo */}
      <div className="pt-[100px] sm:pt-[120px] px-2 sm:px-4 pb-4" ref={containerRef}>
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
              <p className="text-[#FFCC00] text-lg sm:text-xl">Cargando...</p>
            </div>
          </div>
        )}
        
        {/* Canvas centrado y responsivo */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg overflow-auto max-w-full">
            <canvas 
              ref={canvasRef}
              className="block max-w-full"
              style={{ touchAction: 'pinch-zoom' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportar con dynamic import para evitar SSR
const PDFViewer = dynamic(() => Promise.resolve(PDFViewerCore), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 bg-black min-h-screen">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
        <div className="text-[#FFCC00] text-xl">Cargando visor de PDF...</div>
      </div>
    </div>
  )
});

export default PDFViewer;
