// components/PDFViewer.tsx (Versión con marca de agua JavaScript)
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.mjs`;



interface PDFViewerProps {
  filename: string;
  password: string;
}

// Componente interno que usa React-PDF
function PDFViewerCore({ filename, password }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.5);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [documentLoading, setDocumentLoading] = useState<boolean>(false);
  const pageRef = useRef<HTMLDivElement>(null);

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

  // Cargar el PDF desde la API
  useEffect(() => {
    if (!filename || !password) return;

    let mounted = true;

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/pdf/${encodeURIComponent(filename)}`, {
          headers: { 'Authorization': `Bearer ${password}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (mounted) {
          setPdfUrl(url);
        }
      } catch (err) {
        console.error('Error al cargar el documento PDF:', err);
        if (mounted) {
          setError(`No se pudo cargar el documento PDF. ${err instanceof Error ? err.message : ''}`);
          setLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      mounted = false;
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [filename, password]);

  // Limpiar URL cuando se desmonte el componente
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Añadir marca de agua después de que se renderice la página
  useEffect(() => {
    if (!pageRef.current || documentLoading) return;

    const addWatermark = () => {
      const pageElement = pageRef.current;
      if (!pageElement) return;

      // Remover marca de agua anterior
      const existingWatermark = pageElement.querySelector('.watermark-overlay');
      if (existingWatermark) {
        existingWatermark.remove();
      }

      // Crear nueva marca de agua
      const watermark = document.createElement('div');
      watermark.className = 'watermark-overlay';
      watermark.textContent = `Muscle Up Gym - ${new Date().toLocaleDateString()}`;
      
      // Estilos de la marca de agua
      Object.assign(watermark.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: `${Math.max(20, pageElement.clientWidth / 20)}px`,
        color: 'rgba(255, 204, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: '10',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        userSelect: 'none'
      });

      pageElement.appendChild(watermark);
    };

    // Añadir la marca de agua después de un pequeño delay para asegurar que el canvas esté renderizado
    const timer = setTimeout(addWatermark, 100);

    return () => clearTimeout(timer);
  }, [currentPage, scale, documentLoading]);

  // Callbacks para el documento
  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    setDocumentLoading(true);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error al cargar documento:', error);
    setError(`Error al cargar el documento: ${error.message}`);
    setLoading(false);
    setDocumentLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(() => {
    setDocumentLoading(false);
  }, []);

  const onPageLoadError = useCallback((error: Error) => {
    console.error('Error al cargar página:', error);
    setError(`Error al mostrar la página ${currentPage}: ${error.message}`);
    setDocumentLoading(false);
  }, [currentPage]);

  // Controles de navegación
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setDocumentLoading(true);
    }
  }, [currentPage]);

  const nextPage = useCallback(() => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
      setDocumentLoading(true);
    }
  }, [currentPage, numPages]);

  // Control de zoom
  const changeZoom = useCallback((newScale: number) => {
    setScale(newScale);
    setDocumentLoading(true);
  }, []);

  // Función para reintentar
  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  // Renderizado de error
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
      {/* Controles de navegación PDF */}
      <div className="sticky top-0 z-20 bg-black/90 border-b border-[#FFCC00]/20 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          {/* Controles de página */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading || documentLoading}
              className="px-2 py-1 sm:px-4 sm:py-2 bg-[#FFCC00] text-black rounded-lg disabled:opacity-50 font-bold hover:bg-[#FFD700] transition-colors text-xs sm:text-base"
            >
              ← Ant
            </button>
            
            <span className="text-white bg-black/60 px-2 py-1 sm:px-3 sm:py-1 rounded border border-[#FFCC00]/20 text-xs sm:text-base whitespace-nowrap">
              {loading || documentLoading ? "..." : `${currentPage}/${numPages}`}
            </span>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages || loading || documentLoading}
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
        {/* Loading overlay */}
        {(loading || documentLoading) && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
              <p className="text-[#FFCC00] text-lg sm:text-xl">
                {loading ? 'Cargando documento...' : 'Renderizando página...'}
              </p>
            </div>
          </div>
        )}
        
        {/* Documento PDF */}
        {pdfUrl && (
          <div className="pdf-container bg-white rounded-lg shadow-lg overflow-auto max-w-full">
            <Document
              file={pdfUrl}
              onLoadStart={onDocumentLoadStart}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
            >
              <div ref={pageRef} style={{ position: 'relative' }}>
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  loading=""
                  error=""
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="pdf-page"
                />
              </div>
            </Document>
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
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-t-4 border-b-4 border-[#FFCC00] rounded-full animate-spin mb-4"></div>
        <div className="text-[#FFCC00] text-xl">Cargando visor de PDF...</div>
      </div>
    </div>
  )
});

export default PDFViewer;