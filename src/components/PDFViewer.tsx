'use client';
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker - URL del CDN
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface PDFViewerProps {
  filename: string;
  password: string;
}

export default function PDFViewer({ filename, password }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPDF();
  }, [filename, currentPage]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar PDF desde API protegida
      const response = await fetch(`/api/pdf/${filename}`, {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar PDF');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      setNumPages(pdf.numPages);
      
      // Renderizar página actual
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.2 });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Renderizar
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Agregar watermark
      addWatermark(context, canvas.width, canvas.height);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError('Error al cargar el PDF');
      setLoading(false);
    }
  };

  const addWatermark = (context: CanvasRenderingContext2D, width: number, height: number) => {
    context.save();
    context.globalAlpha = 0.1;
    context.font = '20px Arial';
    context.fillStyle = '#FFCC00'; // Usar el color amarillo corporativo
    context.textAlign = 'center';
    context.translate(width/2, height/2);
    context.rotate(-Math.PI/4);
    context.fillText(`@luishdz044 - ${new Date().toLocaleDateString()}`, 0, 0);
    context.restore();
  };

  // Deshabilitar clic derecho y teclas de screenshot
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deshabilitar F12, Ctrl+Shift+I, Ctrl+U, PrtScn
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        alert('Esta acción está deshabilitada');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
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
      `}</style>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-[#FFCC00] text-xl">Cargando PDF...</div>
        </div>
      ) : (
        <>
          {/* Controles */}
          <div className="bg-black/90 p-4 border-b border-[#FFCC00]/20">
            <div className="flex justify-center items-center space-x-4">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-[#FFCC00] text-black rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFD700] transition-colors"
              >
                ← Anterior
              </button>
              
              <span className="text-white">
                Página {currentPage} de {numPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                disabled={currentPage >= numPages}
                className="px-4 py-2 bg-[#FFCC00] text-black rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:bg-[#FFD700] transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
          
          {/* Área del PDF */}
          <div className="p-4 flex justify-center">
            <canvas 
              ref={canvasRef}
              className="border border-[#FFCC00]/20 shadow-2xl max-w-full"
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            />
          </div>
        </>
      )}
    </div>
  );
}
