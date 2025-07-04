'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface PDFViewerProps {
  filename: string;
  password: string;
}

// Componente interno que usa PDF.js directamente
function PDFViewerCore({ filename, password }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.5);
  const [pdfLib, setPdfLib] = useState<any>(null);
  const [pdf, setPdf] = useState<any>(null);

  // Ajustar escala inicial según el dispositivo
  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScale(0.8);  // Móviles pequeños
      } else if (width < 768) {
        setScale(1.0);  // Tablets
      } else {
        setScale(1.5);  // Desktop
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

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

  const retry = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black px-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 sm:p-6 max-w-md mx-auto text-center">
          <h3 className="text-lg sm:text-xl font-bold text-red-300 mb-4">Error</h3>
          <p className="text-sm sm:text-base text-red-200 mb-6">{error}</p>
          <button
            onClick={retry}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg font-bold hover:bg-[#FFD700] transition-colors text-sm sm:text-base"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black">
      {/* Controles de navegación PDF - Sin el header superior */}
      <div className="sticky top-0 z-20 bg-black/90 border-b border-[#FFCC00]/20 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          {/* Controles de página */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className="px-2 py-1 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base"
            >
              ← Ant
            </button>
            
            <span className="text-white bg-black/60 px-2 py-1 sm:px-3 sm:py-1 rounded border border-[#FFCC00]/20 text-xs sm:text-base whitespace-nowrap">
              {loading ? "..." : `${currentPage}/${numPages}`}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages || loading}
              className="px-2 py-1 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base"
            >
              Sig →
            </button>
          </div>
          
          {/* Controles de zoom */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => changeZoom(Math.max(0.5, scale - 0.25))}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
            >
              -
            </button>
            
            <span className="text-white text-xs sm:text-base min-w-[45px] sm:min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={() => changeZoom(Math.min(3, scale + 0.25))}
              className="px-2 py-1 sm:px-3 sm:py-1 bg-black border border-[#FFCC00] text-[#FFCC00] rounded hover:bg-[#FFCC00]/10 text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      {/* Área del PDF */}
      <div className="p-2 sm:p-4 flex justify-center items-center min-h-[calc(100vh-120px)]">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
              <p className="text-[#FFCC00] text-lg sm:text-xl">Cargando...</p>
            </div>
          </div>
        )}
        
        {/* Canvas para renderizar el PDF */}
        <div className="pdf-container bg-white rounded-lg shadow-lg overflow-auto max-w-full">
          <canvas 
            ref={canvasRef}
            className="block max-w-full"
            style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
          />
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
