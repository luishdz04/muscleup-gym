import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function useWindowSize(): WindowSize {
  // Estado inicial con valores de servidor o predeterminados
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Manejador para actualizar tamaño de ventana
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Actualizar tamaño inicial
    handleResize();
    
    // Agregar listener
    window.addEventListener('resize', handleResize);
    
    // Remover listener cuando componente se desmonta
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

export default useWindowSize;