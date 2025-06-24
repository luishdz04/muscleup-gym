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
  const [scale, setScale] = useState<number>(1.5);
  const [pdfLib, setPdfLib] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('rutinasPassword');
    router.push('/rutinas');
  };

  // Detectar ancho del contenedor para responsividad
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Ajustar escala automáticamente en dispositivos pequeños
  useEffect(() => {
    if (containerWidth === 0) return;
    
    if (containerWidth < 768) {
      if (pdf) {
        pdf.getPage(currentPage).then((page: any) => {
          const viewport = page.getViewport({ scale: 1.0 });
          const idealScale = (containerWidth - 40) / viewport.width;
          setScale(Math.min(idealScale, 1.5));
        });
      }
    }
  }, [containerWidth, pdf, currentPage]);

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

  // Renderizar la página actual cuando cambie
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    
    const renderCurrentPage = async () => {
      try {
        setLoading(true);
        
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;
        
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
        
        addWatermark(context, canvas.width, canvas.height);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al renderizar la página:', err);
        setError(`Error al mostrar la página ${currentPage}`);
        setLoading(false);
      }
    };
    
    renderCurrentPage();
  }, [pdf, currentPage, scale]);

  // Añadir marca de agua
  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.save();
    context.globalAlpha = 0.1;
    context.font = Math.floor(width/20) + 'px Arial';
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
    window.location.reload();
  };

  // Mostrar mensajes de error si los hay
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-black px-4 pt-20 pb-8">
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
      <div className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-[#FFCC00]/30 py-4 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link
            href="/rutinas/viewer"
            className="flex items-center gap-2 bg-[#FFCC00] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#FFD700] transition-colors"
          >
            ← Volver a la lista
          </Link>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Controles de navegación PDF - con mayor espacio superior */}
      <div className="fixed top-[60px] left-0 right-0 z-20 bg-black/90 border-b border-[#FFCC00]/20 p-3 md:p-4">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-3">
          {/* Navegación de páginas */}
          <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-sm md:text-base"
            >
              ← Anterior
            </button>
            
            <span className="text-white bg-black/60 px-3 py-1 rounded border border-[#FFCC00]/20 text-sm md:text-base whitespace-nowrap">
              {loading ? "Cargando..." : `Página ${currentPage} de ${numPages}`}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages || loading}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-sm md:text-base"
            >
              Siguiente →
            </button>
          </div>
          
          {/* Controles de zoom */}
          <div className="flex items-center space-x-3 mt-2 md:mt-0 w-full md:w-auto justify-center">
            <button
              onClick={() => changeZoom(Math.max(0.5, scale - 0.25))}
              className="px-3 py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10"
            >
              <span className="text-lg">−</span>
            </button>
            
            <span className="text-white text-sm md:text-base whitespace-nowrap">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => changeZoom(Math.min(3, scale + 0.25))}
              className="px-3 py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Área del PDF - Aumentando el espaciado superior para acomodar las dos barras */}
      <div className="pt-[124px] sm:pt-[120px] pb-6 px-2 md:px-4" ref={containerRef}>
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
              <p className="text-[#FFCC00] text-xl">Cargando...</p>
            </div>
          </div>
        )}
        
        {/* Canvas para renderizar el PDF */}
        <div className="flex justify-center">
          <div className="pdf-container bg-white rounded-lg shadow-lg overflow-auto max-w-full">
            <canvas 
              ref={canvasRef}
              className="max-w-full inline-block"
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
