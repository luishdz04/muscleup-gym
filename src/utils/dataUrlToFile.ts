/**
 * Convierte un dataURL (como el que produce un canvas o una captura de imagen) a un objeto File
 * @param dataUrl El dataURL a convertir
 * @param filename Nombre de archivo a usar
 * @returns Un objeto File
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
    // Extraer el tipo MIME y los datos
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    
    // Crear array de bytes
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    // Crear y retornar el objeto File
    return new File([u8arr], filename, { type: mime });
  }