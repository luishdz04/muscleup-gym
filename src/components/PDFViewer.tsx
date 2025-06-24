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
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [scale, setScale] = useState(1.2);

  // Cargar PDF.js
  useEffect(() => {
    async function loadPdfJs() {
      try {
        // Importar la biblioteca principal
        const pdfjsLib = await import('pdfjs-dist');
        
        // Usar una URL de CDN para el worker, asegurándonos de que sea la misma versión
        // Nota: Usamos 5.3.31 porque esa es la versión en tu package.json
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.31/pdf.worker.min.mjs';
        
        return pdfjsLib;
      } catch (error) {
        console.error('Error cargando PDF.js:', error);
        setError('Error al inicializar el visor de PDF');
        setErrorDetails(String(error));
        return null;
      }
    }
    
    loadPdfJs().then((pdfjsLib) => {
      if (pdfjsLib) {
        loadPdfDocument(pdfjsLib);
      }
    });
  }, [filename, password]);

  // Cargar el documento PDF
  const loadPdfDocument = async (pdfjsLib: any) => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      // Obtener el PDF a través de la API
      const response = await fetch(`/api/pdf/${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('El archivo PDF está vacío');
      }
      
      // Cargar el PDF con PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;
      setPdfDoc(pdfDocument);
      setNumPages(pdfDocument.numPages);
      
      // Renderizar la primera página
      await renderPage(pdfDocument, currentPage);
    } catch (error: any) {
      console.error('Error cargando PDF:', error);
      setError('Error al cargar el PDF');
      setErrorDetails(error.message || 'No se pudo cargar el archivo');
      setLoading(false);
    }
  };

  // Renderizar una página específica
  const renderPage = async (pdf: any, pageNum: number) => {
    if (!pdf) return;
    
    try {
      setLoading(true);
      
      // Obtener la página
      const page = await pdf.getPage(pageNum);
      
      // Configurar el viewport
      const viewport = page.getViewport({ scale });
      
      // Configurar el canvas
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas no disponible');
      }
      
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Contexto 2D no disponible');
      }
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Renderizar la página en el canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Añadir marca de agua
      addWatermark(context, canvas.width, canvas.height);
      
      setCurrentPage(pageNum);
      setLoading(false);
    } catch (error: any) {
      console.error('Error renderizando página:', error);
      setError('Error al mostrar la página');
      setErrorDetails(error.message);
      setLoading(false);
    }
  };

  // Cambiar página
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, currentPage);
    }
  }, [currentPage, pdfDoc, scale]);

  // Añadir marca de agua
  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.save();
    context.globalAlpha = 0.1;
    context.font = '20px Arial';
    context.fillStyle = '#FFCC00';
    context.textAlign = 'center';
    context.translate(width/2, height/2);
    context.rotate(-Math.PI/4);
    context.fillText(`Muscle Up Gym - ${new Date().toLocaleDateString()}`, 0, 0);
    context.restore();
  };

  // Ir a página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Ir a página siguiente
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Aumentar zoom
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  // Reducir zoom
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
  };

  // Reintentar cargar el PDF
  const retryLoading = () => {
    window.location.reload();
  };

  // Deshabilitar clic derecho
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-300 text-xl mb-2">{error}</p>
          {errorDetails && (
            <p className="text-red-200/70 text-sm mb-4">{errorDetails}</p>
          )}
          <button
            onClick={retryLoading}
            className="mt-4 px-4 py-2 bg-[#FFCC00] text-black rounded hover:bg-[#FFD700] transition-colors font-semibold"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container bg-black min-h-screen">
      <style jsx global>{`
        .pdf-viewer-container {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
          text-align: center;
        }
        .pdf-viewer-container * {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        .canvas-container {
          display: inline-block;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
          margin: 20px;
        }
      `}</style>
      
      {/* Controles de navegación */}
      <div className="fixed top-[72px] left-0 right-0 z-20 bg-black bg-opacity-90 border-b border-yellow-400/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-2 bg-[#FFCC00] text-black rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFD700] transition-colors"
            >
              ← Anterior
            </button>
            
            <div className="text-white bg-black/60 px-3 py-1 rounded border border-yellow-400/20">
              {loading ? "Cargando..." : `Página ${currentPage} de ${numPages}`}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages || loading}
              className="px-3 py-2 bg-[#FFCC00] text-black rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFD700] transition-colors"
            >
              Siguiente →
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.6 || loading}
              className="px-3 py-2 bg-black text-[#FFCC00] border border-[#FFCC00] rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFCC00]/10"
            >
              <span className="text-lg">−</span>
            </button>
            
            <div className="text-white bg-black/60 px-3 py-1 rounded border border-yellow-400/20">
              {Math.round(scale * 100)}%
            </div>
            
            <button
              onClick={zoomIn}
              disabled={scale >= 3 || loading}
              className="px-3 py-2 bg-black text-[#FFCC00] border border-[#FFCC00] rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFCC00]/10"
            >
              <span className="text-lg">+</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenedor principal con espacio para la barra de navegación fija */}
      <div className="pt-16 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-t-4 border-b-4 border-yellow-400 rounded-full animate-spin mb-4"></div>
              <div className="text-[#FFCC00] text-xl">Cargando PDF...</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="canvas-container border border-yellow-400/20 shadow-2xl">
              <canvas ref={canvasRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Exportar con dynamic import para evitar SSR
const PDFViewer = dynamic(() => Promise.resolve(PDFViewerCore), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center py-20 bg-black min-h-screen">
      <div className="text-[#FFCC00] text-xl">Inicializando visor...</div>
    </div>
  )
});

export default PDFViewer;
