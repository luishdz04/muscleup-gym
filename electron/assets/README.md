# Iconos de la Aplicación Electron

Este directorio contiene los iconos necesarios para la aplicación de escritorio MuscleUp Gym Admin.

## Iconos Requeridos

### Windows
- **icon.ico** - Ícono principal de la aplicación (256x256 o mayor)
  - Formatos incluidos: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

### macOS
- **icon.icns** - Ícono para macOS
  - Debe contener múltiples resoluciones (16x16 hasta 1024x1024)

### Linux
- **icons/** - Directorio con íconos PNG en múltiples tamaños
  - 16x16.png
  - 32x32.png
  - 48x48.png
  - 64x64.png
  - 128x128.png
  - 256x256.png
  - 512x512.png

## Cómo Generar los Iconos

### Opción 1: Herramienta en línea
1. Ve a https://www.electron.build/icons
2. Sube una imagen PNG de alta resolución (1024x1024 recomendado)
3. Descarga los iconos generados

### Opción 2: electron-icon-builder (npm)
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./logo.png --output=./electron/assets
```

### Opción 3: Manual con ImageMagick
```bash
# Para Windows (.ico)
convert logo.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico

# Para macOS (.icns)
png2icns icon.icns logo_1024x1024.png logo_512x512.png logo_256x256.png logo_128x128.png logo_32x32.png logo_16x16.png

# Para Linux (crear carpeta icons/)
mkdir -p icons
for size in 16 32 48 64 128 256 512; do
  convert logo.png -resize ${size}x${size} icons/${size}x${size}.png
done
```

## Imagen Fuente Recomendada

- **Formato**: PNG con fondo transparente
- **Resolución**: 1024x1024 píxeles (mínimo)
- **Diseño**: Simple y reconocible, evitar detalles muy finos
- **Colores**: Usar los colores de la marca (amarillo #FFCC00 y negro)

## Nota Importante

Actualmente se están usando íconos placeholder. Para producción:
1. Diseña el ícono oficial de MuscleUp Gym Admin
2. Genera todos los formatos necesarios
3. Reemplaza los archivos en este directorio
4. Rebuild la aplicación con `npm run electron:build`
