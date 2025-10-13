# TradingView Lightweight Charts: Guía completa para React, Next.js y Supabase

**TradingView Lightweight Charts es una biblioteca de gráficos financieros de 35KB que permite visualizar datos en tiempo real con rendimiento excepcional**. Soporta miles de barras con actualizaciones múltiples por segundo, ideal para dashboards de trading, métricas empresariales y análisis de series temporales. La biblioteca es gratuita, open-source (Apache 2.0), incluye soporte completo para TypeScript, y ofrece 6 tipos de gráficos integrados más la posibilidad de crear series personalizadas mediante plugins. Diseñada específicamente para JavaScript, se integra perfectamente con React y Next.js, aunque requiere renderizado del lado del cliente.

## Tipos de gráficos disponibles y sus características

La biblioteca ofrece **6 tipos de series integradas** más un sistema de plugins para crear series completamente personalizadas. Cada tipo está optimizado para casos de uso específicos.

### Area Series: visualización de tendencias y valores acumulados

El **AreaSeries** muestra datos como un área coloreada entre la línea temporal y una línea que conecta todos los puntos. Es ideal para mostrar evolución de tendencias, indicadores de volumen y métricas acumulativas. El formato de datos requerido es simple: cada punto necesita solo `value` (número) y `time` (timestamp o string de fecha).

```javascript
const areaSeries = chart.addSeries(AreaSeries, {
  lineColor: '#2962FF',
  topColor: '#2962FF',
  bottomColor: 'rgba(41, 98, 255, 0.28)',
  lineWidth: 3,
  lineStyle: LineStyle.Solid, // Solid, Dotted, Dashed, LargeDashed, SparseDotted
  lineType: LineType.Simple, // Simple, WithSteps, Curved
  invertFilledArea: false // Si true, rellena arriba de la línea
});

areaSeries.setData([
  { time: '2018-12-22', value: 32.51 },
  { time: '2018-12-23', value: 31.11 },
  { time: '2018-12-24', value: 27.02 }
]);
```

Las opciones de personalización incluyen gradientes relativos (`relativeGradient`), marcadores de punto circulares (`pointMarkersVisible`), y personalización completa del marcador del crosshair (radio, color de borde, color de fondo).

### Candlestick Series: el estándar para análisis técnico financiero

El **CandlestickSeries** es el tipo más popular para datos financieros. Cada vela muestra el rango de precios con un cuerpo sólido (apertura a cierre) y mechas verticales (alto a bajo). Requiere datos OHLC (Open, High, Low, Close).

```javascript
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350'
});

candlestickSeries.setData([
  { time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },
  { time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 }
]);
```

**Característica avanzada**: Puedes sobrescribir colores por vela individual agregando propiedades `color`, `borderColor` o `wickColor` a puntos de datos específicos. Esto permite resaltar eventos importantes o señales de trading.

### Bar Series: representación tradicional OHLC

El **BarSeries** ilustra movimientos de precio con barras verticales que muestran el rango alto-bajo. La marca izquierda indica el precio de apertura y la derecha el de cierre. Usa el mismo formato de datos que CandlestickSeries.

```javascript
const barSeries = chart.addSeries(BarSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  thinBars: false // Usar estilo de barras delgadas
});
```

### Baseline Series: comparación contra un valor de referencia

El **BaselineSeries** muestra dos áreas de colores distintos arriba y debajo de una línea base de referencia. Perfecto para visualizar ganancias/pérdidas relativas a un objetivo o mostrar desviaciones de un valor estándar.

```javascript
const baselineSeries = chart.addSeries(BaselineSeries, {
  baseValue: { type: 'price', price: 25 }, // O { type: 'percentage', percentage: 50 }
  topLineColor: 'rgba(38, 166, 154, 1)',
  topFillColor1: 'rgba(38, 166, 154, 0.28)',
  topFillColor2: 'rgba(38, 166, 154, 0.05)',
  bottomLineColor: 'rgba(239, 83, 80, 1)',
  bottomFillColor1: 'rgba(239, 83, 80, 0.05)',
  bottomFillColor2: 'rgba(239, 83, 80, 0.28)'
});
```

El valor base puede ser un precio específico o un porcentaje, con gradientes personalizables para cada área.

### Histogram Series: columnas verticales para volumen y distribuciones

El **HistogramSeries** muestra datos como columnas verticales de ancho uniforme. Es el estándar de la industria para indicadores de volumen y distribuciones de histograma.

```javascript
const volumeSeries = chart.addSeries(HistogramSeries, {
  color: '#26a69a',
  priceFormat: { type: 'volume' },
  priceScaleId: '' // String vacío = overlay
});

// Configurar para mostrar en el 30% inferior del gráfico
volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.7, bottom: 0 }
});
```

Cada barra puede tener su propio color mediante la propiedad `color` en el dato individual, útil para codificar por colores según condiciones.

### Line Series: simplicidad y claridad para indicadores

El **LineSeries** es el tipo más simple, mostrando solo una línea limpia conectando puntos de datos. Ideal para promedios móviles, indicadores y visualizaciones de tendencias sin ruido visual.

```javascript
const lineSeries = chart.addSeries(LineSeries, {
  color: '#2962FF',
  lineWidth: 2,
  lineStyle: LineStyle.Solid,
  pointMarkersVisible: false
});
```

### Custom Series: extensibilidad ilimitada con plugins

El sistema de plugins permite crear tipos de series completamente nuevos con estructuras de datos personalizadas y lógica de renderizado usando CanvasRenderingContext2D. Ejemplos oficiales incluyen Whisker Box, Heatmaps, Rounded Candles y Volume Profile.

```javascript
class MyCustomSeries {
  // Implementar interfaz ICustomSeriesPaneView
  update() { }
  renderer() { return new MyRenderer(); }
}

const customSeries = chart.addCustomSeries(new MyCustomSeries(), {
  customOption: 10
});
```

## Combinar múltiples series: overlays y comparaciones

**La biblioteca soporta múltiples series en el mismo gráfico con tres patrones de configuración**. Puedes usar la misma escala de precio para comparación directa, escalas separadas para valores de diferentes rangos, u overlays sin escala visible posicionados con márgenes.

```javascript
// Patrón 1: Precio principal + promedio móvil en misma escala
const candleSeries = chart.addSeries(CandlestickSeries);
candleSeries.setData(priceData);

const ma20 = chart.addSeries(LineSeries, {
  color: '#2196F3',
  lineWidth: 2,
  priceLineVisible: false,
  lastValueVisible: false
});
ma20.setData(movingAverageData);

// Patrón 2: Volumen como overlay en el 30% inferior
const volumeSeries = chart.addSeries(HistogramSeries, {
  priceFormat: { type: 'volume' },
  priceScaleId: '' // Overlay sin escala visible
});

volumeSeries.priceScale().applyOptions({
  scaleMargins: { top: 0.7, bottom: 0 }
});
```

Para gráficos multi-pane, puedes crear páneles independientes pasando un índice de pane al agregar la serie: `chart.addSeries(HistogramSeries, {}, 1)` crea la serie en el segundo panel.

## Integración con React y Next.js: patrones oficiales

**TradingView Lightweight Charts es una biblioteca exclusivamente del lado del cliente que NO funciona con server-side rendering**. Para Next.js, debes usar importaciones dinámicas con SSR deshabilitado.

### Componente básico de React con cleanup apropiado

```javascript
import { createChart, AreaSeries, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

export const ChartComponent = ({ data, colors = {} }) => {
  const {
    backgroundColor = 'white',
    lineColor = '#2962FF',
    textColor = 'black',
    areaTopColor = '#2962FF',
    areaBottomColor = 'rgba(41, 98, 255, 0.28)',
  } = colors;

  const chartContainerRef = useRef();

  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    chart.timeScale().fitContent();

    const newSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor
    });

    newSeries.setData(data);

    window.addEventListener('resize', handleResize);

    // Cleanup crítico para prevenir fugas de memoria
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove(); // Operación irreversible que limpia todo
    };
  }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  return <div ref={chartContainerRef} />;
};
```

**Principio clave**: Siempre llama a `chart.remove()` en la función de cleanup del useEffect. Esto elimina todos los elementos del DOM y listeners de eventos.

### Implementación específica para Next.js

```javascript
// app/chart/page.tsx (Next.js 13+ App Router)
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Importación dinámica con SSR deshabilitado
const Chart = dynamic(
  () => import('@/components/TradingChart').then(mod => mod.TradingChart),
  {
    ssr: false,
    loading: () => <div>Cargando gráfico...</div>
  }
);

export default function ChartPage() {
  return (
    <main>
      <Suspense fallback={<div>Cargando...</div>}>
        <Chart />
      </Suspense>
    </main>
  );
}

// components/TradingChart.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ColorType, LineSeries } from 'lightweight-charts';

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
        textColor: 'black',
      },
    });

    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries);
    lineSeries.setData([
      { time: '2018-12-22', value: 32.51 },
      { time: '2018-12-23', value: 31.11 }
    ]);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [isMounted]);

  if (!isMounted) {
    return <div>Cargando...</div>;
  }

  return <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />;
}
```

### Arquitectura avanzada con Context para múltiples componentes

Para estructuras complejas con componentes Chart y Series separados, la documentación oficial recomienda usar React Context con forwardRef y useImperativeHandle:

```javascript
import { createContext, forwardRef, useContext, useLayoutEffect, useRef } from 'react';

const Context = createContext();

export function Chart(props) {
  const [container, setContainer] = useState(false);
  const handleRef = useCallback(ref => setContainer(ref), []);

  return (
    <div ref={handleRef}>
      {container && <ChartContainer {...props} container={container} />}
    </div>
  );
}

export const ChartContainer = forwardRef((props, ref) => {
  const { children, container, layout, ...rest } = props;

  const chartApiRef = useRef({
    isRemoved: false,
    api() {
      if (!this._api) {
        this._api = createChart(container, {
          ...rest,
          layout,
          width: container.clientWidth,
          height: 300,
        });
        this._api.timeScale().fitContent();
      }
      return this._api;
    },
    free(series) {
      if (this._api && series) {
        this._api.removeSeries(series);
      }
    },
  });

  useLayoutEffect(() => {
    const currentRef = chartApiRef.current;
    const chart = currentRef.api();

    const handleResize = () => {
      chart.applyOptions({ width: container.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartApiRef.current.isRemoved = true;
      chart.remove();
    };
  }, []);

  return (
    <Context.Provider value={chartApiRef.current}>
      {props.children}
    </Context.Provider>
  );
});
```

**Consideración importante sobre el ciclo de vida**: Los hooks de React se ejecutan en orden bottom-up durante la instanciación pero top-down durante el cleanup. Esto significa que los componentes hijos (Series) se crean antes que los padres (Chart), lo cual puede causar problemas si no se maneja con Context.

## Soporte completo de TypeScript

**El paquete incluye declaraciones TypeScript out-of-the-box**, permitiendo integración sin problemas en proyectos TypeScript. Todas las interfaces y tipos están disponibles para importación.

```typescript
import {
  IChartApi,
  ISeriesApi,
  ChartOptions,
  DeepPartial,
  Time,
  SeriesOptionsCommon,
  CandlestickData,
  LineData
} from 'lightweight-charts';

interface ChartData {
  time: string;
  value: number;
}

interface ChartComponentProps {
  data: ChartData[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
  };
}

export const ChartComponent: React.FC<ChartComponentProps> = ({ data, colors }) => {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  // Implementación...
};
```

Los tipos clave incluyen `IChartApi` (interfaz principal del gráfico), `ISeriesApi<T>` (interfaz de series), `ITimeScaleApi`, `IPriceScaleApi`, y tipos de datos específicos para cada serie.

## Características avanzadas: zoom, crosshair y tooltips

### Control completo de zoom y navegación

El Time Scale API ofrece **control granular sobre el scrolling, zoom y rango visible**. Los métodos clave incluyen:

```javascript
const timeScale = chart.timeScale();

// Ajustar automáticamente para mostrar todos los datos
timeScale.fitContent();

// Establecer rango visible
timeScale.setVisibleRange({
  from: '2018-12-12',
  to: '2018-12-31'
});

// Scrollear a tiempo real (siempre animado)
timeScale.scrollToRealTime();

// Restaurar zoom y scroll predeterminados
timeScale.resetTimeScale();

// Configurar espaciado entre barras (controla nivel de zoom)
timeScale.applyOptions({
  barSpacing: 10, // Píxeles entre barras
  rightOffset: 5, // Margen derecho
  fixLeftEdge: false,
  fixRightEdge: false
});
```

El control de scroll y zoom se configura mediante opciones de manejadores:

```javascript
chart.applyOptions({
  handleScroll: {
    mouseWheel: true, // Scroll con rueda del mouse
    pressedMouseMove: true, // Arrastre para scrollear
    horzTouchDrag: true, // Scroll táctil horizontal
    vertTouchDrag: true // Scroll táctil vertical
  },
  handleScale: {
    mouseWheel: true, // Zoom con rueda
    pinch: true, // Zoom con pellizco
    axisPressedMouseMove: true, // Zoom arrastrando eje
    axisDoubleClickReset: true // Reset con doble click
  }
});
```

### Crosshair personalizable con tres modos

El crosshair tiene **tres modos de operación**: `Magnet` (se adhiere a puntos de datos), `Normal` (movimiento libre), y `MagnetOHLC` (se adhiere a valores OHLC).

```javascript
chart.applyOptions({
  crosshair: {
    mode: CrosshairMode.Magnet,
    vertLine: {
      width: 1,
      color: '#C3BCDB44',
      style: LineStyle.Solid,
      labelBackgroundColor: '#9B7DFF',
      labelVisible: true,
      visible: true
    },
    horzLine: {
      color: '#9B7DFF',
      labelBackgroundColor: '#9B7DFF',
      labelVisible: true,
      visible: true,
      width: 1,
      style: LineStyle.Dashed
    }
  }
});

// Control programático
chart.setCrosshairPosition(price, time, seriesApi);
chart.clearCrosshairPosition();
```

**Evento de movimiento del crosshair** para implementar tooltips personalizados:

```javascript
chart.subscribeCrosshairMove(param => {
  if (!param.point || !param.time) {
    // Cursor fuera del gráfico
    return;
  }

  const data = param.seriesData.get(series);
  if (data) {
    const price = data.value !== undefined ? data.value : data.close;
    console.log(`Tiempo: ${param.time}, Precio: ${price}`);
  }
});
```

### Implementación de tooltips personalizados

**La biblioteca NO incluye tooltips integrados** - deben implementarse manualmente suscribiéndose a eventos del crosshair. La documentación proporciona tres patrones: tooltips flotantes (se posicionan junto al punto de datos), tooltips de seguimiento (siguen el cursor), y tooltips magnificadores (fijos a lo largo del borde superior).

```javascript
// Crear elemento HTML para tooltip
const toolTip = document.createElement('div');
toolTip.style = `width: 96px; height: 80px; position: absolute;
  display: none; padding: 8px; box-sizing: border-box;
  font-size: 12px; z-index: 1000; pointer-events: none;
  border: 1px solid; border-radius: 2px; background: white;`;
container.appendChild(toolTip);

// Actualizar en movimiento del crosshair
chart.subscribeCrosshairMove(param => {
  if (param.point === undefined || !param.time ||
      param.point.x < 0 || param.point.y < 0) {
    toolTip.style.display = 'none';
  } else {
    toolTip.style.display = 'block';
    const data = param.seriesData.get(series);
    const price = data.value !== undefined ? data.value : data.close;

    toolTip.innerHTML = `<div>${price.toFixed(2)}</div>`;

    // Posicionar usando priceToCoordinate
    const coordinate = series.priceToCoordinate(price);
    toolTip.style.left = param.point.x + 'px';
    toolTip.style.top = coordinate + 'px';
  }
});
```

### Sincronización entre múltiples gráficos

Para sincronizar el rango temporal y crosshair entre múltiples gráficos:

```javascript
const chart1 = createChart(container1);
const chart2 = createChart(container2);

// Sincronizar rangos temporales
chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
  chart2.timeScale().setVisibleLogicalRange(timeRange);
});

chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
  chart1.timeScale().setVisibleLogicalRange(timeRange);
});

// Sincronizar crosshair
chart1.subscribeCrosshairMove(param => {
  if (!param.point) return;
  const time = chart1.timeScale().coordinateToTime(param.point.x);
  if (time) {
    chart2.setCrosshairPosition(price, time, series2);
  }
});
```

## Marcadores, anotaciones y personalización visual

### Sistema de marcadores para anotaciones en series

Los marcadores permiten **anotar eventos específicos en el gráfico** con formas, colores y texto personalizables:

```javascript
import { createSeriesMarkers } from 'lightweight-charts';

const markers = [
  {
    time: { year: 2018, month: 12, day: 23 },
    position: 'aboveBar', // aboveBar, belowBar, inBar
    color: '#f68410',
    shape: 'circle', // circle, square, arrowUp, arrowDown
    text: 'A',
    size: 1
  },
  {
    time: '2019-05-24',
    position: 'atPriceTop', // Posicionamiento basado en precio
    price: 193.50,
    color: '#e91e63',
    shape: 'arrowDown',
    text: 'Venta @ 193.50'
  }
];

createSeriesMarkers(series, markers);
```

**Líneas de precio** para mostrar niveles importantes:

```javascript
const priceLine = series.createPriceLine({
  price: 100,
  color: 'red',
  lineWidth: 2,
  lineStyle: LineStyle.Dashed,
  axisLabelVisible: true,
  title: 'Stop Loss'
});

// Remover cuando ya no sea necesaria
series.removePriceLine(priceLine);
```

### Escalas de precio: múltiples escalas y modos

**La biblioteca soporta múltiples escalas de precio con cuatro modos**: Normal (lineal), Logarítmica, Porcentaje, e IndexedTo100. Cada serie puede vincularse a una escala diferente.

```javascript
chart.applyOptions({
  rightPriceScale: { visible: true },
  leftPriceScale: { visible: true }
});

// Asignar series a escalas diferentes
const leftSeries = chart.addSeries(CandlestickSeries, {
  priceScaleId: 'left'
});

const rightSeries = chart.addSeries(LineSeries, {
  priceScaleId: 'right'
});

// Configurar escala de precio
chart.priceScale().applyOptions({
  mode: PriceScaleMode.Logarithmic,
  autoScale: true,
  invertScale: false,
  scaleMargins: {
    top: 0.1,
    bottom: 0.2
  }
});
```

En la versión 5.0+, puedes controlar el rango visible de precio programáticamente:

```javascript
const priceScale = chart.priceScale();
priceScale.setVisibleRange({ from: 100, to: 200 });
priceScale.setAutoScale(true);
```

### Temas: modo oscuro, claro y personalización completa

La personalización de colores es **extremadamente flexible**, soportando RGB, RGBA, Hex, nombres de colores y HSL:

```javascript
// Tema oscuro
const chart = createChart(container, {
  layout: {
    background: { type: 'solid', color: '#222' },
    textColor: '#DDD'
  },
  grid: {
    vertLines: { color: '#444', style: LineStyle.Solid },
    horzLines: { color: '#444', style: LineStyle.Solid }
  },
  crosshair: {
    vertLine: { color: '#C3BCDB44', labelBackgroundColor: '#9B7DFF' },
    horzLine: { color: '#9B7DFF', labelBackgroundColor: '#9B7DFF' }
  },
  rightPriceScale: { borderColor: '#71649C' },
  timeScale: { borderColor: '#71649C' }
});

// Colores de series
series.applyOptions({
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350'
});
```

**Cambio dinámico de tema**:

```javascript
function applyTheme(isDark) {
  const colors = isDark ? {
    backgroundColor: '#222',
    textColor: '#DDD',
    gridColor: '#444'
  } : {
    backgroundColor: 'white',
    textColor: 'black',
    gridColor: '#e1e1e1'
  };

  chart.applyOptions({
    layout: {
      background: { type: 'solid', color: colors.backgroundColor },
      textColor: colors.textColor
    },
    grid: {
      vertLines: { color: colors.gridColor },
      horzLines: { color: colors.gridColor }
    }
  });
}
```

### Diseño responsive con auto-sizing

La biblioteca incluye **auto-sizing automático usando ResizeObserver**:

```javascript
const chart = createChart(container, {
  autoSize: true // El gráfico se redimensiona automáticamente con el contenedor
});

// O manejo manual de resize
window.addEventListener('resize', () => {
  chart.applyOptions({
    width: container.clientWidth,
    height: container.clientHeight
  });
});

// Mantener zoom en resize
chart.timeScale().applyOptions({
  lockVisibleTimeRangeOnResize: true
});
```

## Manejo de datos y actualizaciones en tiempo real

### Formatos de datos y requerimientos estrictos

**Cada tipo de serie requiere un formato de datos específico**. Los datos DEBEN estar ordenados cronológicamente en orden ascendente - la biblioteca NO ordena automáticamente.

```typescript
// Line y Area Series
interface LineData {
  time: Time; // Unix timestamp en segundos o string ISO
  value: number;
}

// Candlestick y Bar Series
interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  color?: string; // Override opcional por vela
  borderColor?: string;
  wickColor?: string;
}

// Histogram Series
interface HistogramData {
  time: Time;
  value: number;
  color?: string; // Override opcional por barra
}
```

**Tres formatos de tiempo soportados**:

1. **Unix timestamp en segundos**: `1642427876` o `Date.now() / 1000`
2. **String de fecha ISO**: `'2018-12-22'` (formato YYYY-MM-DD)
3. **Objeto BusinessDay**: `{ year: 2018, month: 9, day: 22 }`

```javascript
// Para datos intraday, usar timestamps Unix en SEGUNDOS
const intradayData = data.map(row => ({
  time: Math.floor(new Date(row.timestamp).getTime() / 1000),
  value: row.value
}));
```

### setData vs update: cuándo usar cada método

**`setData()` reemplaza TODOS los datos** y debe usarse solo para carga inicial. **`update()` es para actualizaciones incrementales** y es mucho más eficiente para tiempo real.

```javascript
// ✅ Correcto: setData para carga inicial
series.setData(historicalData); // Una sola vez

// ✅ Correcto: update para actualizaciones en tiempo real
series.update({
  time: Date.now() / 1000,
  value: newValue
});

// ❌ Incorrecto: Nunca usar setData repetidamente
// series.setData(allData); // Impacto significativo en rendimiento
```

**Comportamiento de `update()`**:
- Si el tiempo del nuevo item > último tiempo: agrega nuevo punto de datos
- Si el tiempo del nuevo item = último tiempo: actualiza el punto existente
- Si el tiempo del nuevo item < último tiempo: requiere `historicalUpdate: true` (más lento)

### Patrón de actualización en tiempo real

```javascript
// WebSocket o polling
let currentBar = null;

function updateLiveBar(tick) {
  const barTime = Math.floor(tick.timestamp / barInterval) * barInterval;

  if (!currentBar || currentBar.time !== barTime) {
    // Comienza nueva barra
    currentBar = {
      time: barTime,
      open: tick.price,
      high: tick.price,
      low: tick.price,
      close: tick.price
    };
  } else {
    // Actualiza barra actual
    currentBar.high = Math.max(currentBar.high, tick.price);
    currentBar.low = Math.min(currentBar.low, tick.price);
    currentBar.close = tick.price;
  }

  series.update(currentBar);
}
```

### Sistema completo de eventos y callbacks

La API ofrece **suscripciones a eventos para todos los aspectos** de interacción del usuario:

```javascript
// Eventos de clic
chart.subscribeClick(param => {
  if (!param.point) return;
  console.log(`Click en ${param.point.x}, ${param.point.y}. Tiempo: ${param.time}`);
});

// Eventos de doble clic
chart.subscribeDblClick(param => {
  console.log(`Doble click en tiempo: ${param.time}`);
});

// Movimiento del crosshair
chart.subscribeCrosshairMove(param => {
  if (!param.point || !param.time) return;

  // Acceder a datos de series en posición del crosshair
  const dataPoint = param.seriesData.get(series);
  if (dataPoint) {
    const price = dataPoint.value !== undefined ? dataPoint.value : dataPoint.close;
    updateTooltip(price, param.time);
  }
});

// Cambios en rango visible (para scroll infinito)
chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
  const barsInfo = series.barsInLogicalRange(range);

  if (barsInfo !== null && barsInfo.barsBefore < 50) {
    loadMoreHistoricalData(); // Cargar más datos históricos
  }
});

// Cambios en datos de series
series.subscribeDataChanged(() => {
  console.log(`Datos cambiados. Nueva longitud: ${series.data().length}`);
});

// Cleanup: siempre desuscribir
chart.unsubscribeCrosshairMove(handler);
chart.unsubscribeClick(handler);
```

El objeto `MouseEventParams` incluye: `time` (undefined si fuera del rango de datos), `point` (coordenadas x/y, undefined si fuera del gráfico), `seriesData` (Map con datos en la posición del cursor), `hoveredSeries`, y `hoveredObjectId`.

## Optimización de rendimiento y mejores prácticas

### Consideraciones críticas de rendimiento

La biblioteca está **optimizada para manejar miles de barras con actualizaciones múltiples por segundo**. El bundle base en v5.0 es de solo 35KB (reducción del 16% vs v4) con mejoras en tree-shaking.

**Pautas de rendimiento oficiales**:
- No hay límite duro en puntos de datos, pero el rendimiento degrada con datasets muy grandes (15,000+ puntos mencionados)
- Usa `update()` para tiempo real, NUNCA `setData()`
- Implementa ventanas de datos para datasets grandes
- Los cálculos de marcadores se optimizaron en v5.0+ para 15,000+ puntos

```javascript
// ✅ Patrón eficiente para carga inicial
const historicalData = await fetchData();
series.setData(historicalData); // Una vez

// ✅ Patrón eficiente para actualizaciones
websocket.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  series.update(transformTick(tick)); // Actualización incremental
};

// ❌ Evitar: reemplazar todos los datos repetidamente
// setInterval(() => {
//   series.setData(getAllData()); // Impacto masivo en rendimiento
// }, 1000);
```

### Implementación de scroll infinito con carga de datos on-demand

```javascript
// Cargar datos históricos cuando el usuario scrollea cerca del borde
chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
  if (!range) return;

  const barsInfo = series.barsInLogicalRange(range);

  if (barsInfo !== null && barsInfo.barsBefore < 10) {
    // Menos de 10 barras antes del rango visible
    loadMoreHistory();
  }
});

async function loadMoreHistory() {
  const currentData = series.data();
  const oldestTime = currentData[0].time;

  const historicalData = await fetchHistoricalData(oldestTime);

  // setData con dataset completo
  const allData = [...historicalData, ...currentData];
  series.setData(allData);
}
```

### Gestión de memoria y cleanup apropiado

```javascript
// Patrón completo de cleanup en React
useEffect(() => {
  const chart = createChart(container, options);
  const series = chart.addSeries(LineSeries);

  // Manejadores de eventos
  const handleClick = (param) => console.log(param);
  const handleResize = () => chart.applyOptions({
    width: container.clientWidth
  });

  // Suscribirse
  chart.subscribeClick(handleClick);
  window.addEventListener('resize', handleResize);

  // Cleanup completo
  return () => {
    // 1. Desuscribir eventos
    chart.unsubscribeClick(handleClick);
    window.removeEventListener('resize', handleResize);

    // 2. Remover gráfico (también remueve todas las series)
    chart.remove();
  };
}, []);
```

### Compatibilidad con navegadores y transpilación

**Target de la biblioteca**: ES2020, requiere navegadores modernos:
- Chrome/Edge: 80+
- Firefox: 74+
- Safari: 13.1+

Para navegadores más antiguos, configura transpilación (Babel) en tu sistema de build.

## Integración con Supabase: patrones de producción

### Patrón 1: Carga de datos históricos con REST API

```javascript
import { createClient } from '@supabase/supabase-js';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadHistoricalData() {
  const { data, error } = await supabase
    .from('price_data')
    .select('*')
    .eq('symbol', 'BTC-USD')
    .order('timestamp', { ascending: true })
    .limit(500);

  if (error) {
    console.error('Error cargando datos:', error);
    return;
  }

  // Transformar datos de Supabase al formato de Lightweight Charts
  const chartData = data.map(row => ({
    time: Math.floor(new Date(row.timestamp).getTime() / 1000),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close)
  }));

  series.setData(chartData);
  chart.timeScale().fitContent();
}
```

### Patrón 2: Actualizaciones en tiempo real con Supabase Realtime

```javascript
// Inicializar gráfico y cargar datos históricos
const chart = createChart(container);
const series = chart.addSeries(LineSeries);

async function initialize() {
  // Cargar datos iniciales
  const { data } = await supabase
    .from('metrics')
    .select('timestamp, value')
    .order('timestamp', { ascending: true })
    .limit(1000);

  const chartData = data.map(row => ({
    time: row.timestamp, // Usar ISO string o convertir a Unix
    value: parseFloat(row.value)
  }));

  series.setData(chartData);
  chart.timeScale().fitContent();
}

// Suscribirse a inserciones en tiempo real
const channel = supabase
  .channel('price-updates')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'metrics'
    },
    (payload) => {
      const newData = {
        time: payload.new.timestamp,
        value: parseFloat(payload.new.value)
      };
      series.update(newData);
    }
  )
  .subscribe();

initialize();

// Cleanup en desmontaje
function cleanup() {
  supabase.removeChannel(channel);
  chart.remove();
}
```

### Patrón 3: Paginación y carga dinámica de históricos

```javascript
let dataCache = [];

async function loadMoreHistoricalData(fromTime) {
  const { data, error } = await supabase
    .from('price_data')
    .select('*')
    .lt('timestamp', fromTime)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error || !data.length) return;

  // Transformar y añadir al cache
  const newData = data.reverse().map(row => ({
    time: Math.floor(new Date(row.timestamp).getTime() / 1000),
    open: parseFloat(row.open),
    high: parseFloat(row.high),
    low: parseFloat(row.low),
    close: parseFloat(row.close)
  }));

  dataCache = [...newData, ...dataCache];
  series.setData(dataCache); // Actualizar con dataset completo
}

// Detectar cuando el usuario scrollea cerca del borde
chart.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
  if (timeRange && shouldLoadMore(timeRange.from)) {
    loadMoreHistoricalData(timeRange.from);
  }
});
```

### Patrón 4: Múltiples activos con consultas paralelas

```javascript
async function loadMultipleAssets() {
  // Consultas paralelas
  const [btcResult, ethResult] = await Promise.all([
    supabase
      .from('prices')
      .select('*')
      .eq('symbol', 'BTC')
      .order('timestamp'),
    supabase
      .from('prices')
      .select('*')
      .eq('symbol', 'ETH')
      .order('timestamp')
  ]);

  const btcSeries = chart.addSeries(LineSeries, {
    color: '#f7931a',
    title: 'Bitcoin'
  });

  const ethSeries = chart.addSeries(LineSeries, {
    color: '#627eea',
    title: 'Ethereum'
  });

  btcSeries.setData(transformData(btcResult.data));
  ethSeries.setData(transformData(ethResult.data));
}
```

### Estrategias de caché para optimización

```javascript
// Clase manager de datos con caché del lado del cliente
class ChartDataManager {
  constructor(supabase, tableName) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.cache = new Map();
  }

  async getData(startTime, endTime) {
    const cacheKey = `${startTime}-${endTime}`;

    // Verificar caché primero
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fetch de Supabase
    const { data } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('timestamp', startTime)
      .lte('timestamp', endTime)
      .order('timestamp');

    // Cachear resultado
    this.cache.set(cacheKey, data);
    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Persistencia con localStorage
const CACHE_KEY = 'chart_data_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

async function loadWithCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_EXPIRY) {
      series.setData(data);
      return;
    }
  }

  // Cargar datos frescos
  const { data } = await supabase
    .from('price_data')
    .select('*')
    .order('timestamp');

  const chartData = transformData(data);

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: chartData,
    timestamp: Date.now()
  }));

  series.setData(chartData);
}
```

## Clase completa de producción para React/Next.js con Supabase

```typescript
// components/TradingChart.tsx
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createChart, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import { useEffect, useRef } from 'react';

interface TradingChartProps {
  supabaseUrl: string;
  supabaseKey: string;
  tableName: string;
  symbol: string;
}

export function TradingChart({ supabaseUrl, supabaseKey, tableName, symbol }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const channelRef = useRef<any>(null);
  const dataCacheRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inicializar Supabase
    supabaseRef.current = createClient(supabaseUrl, supabaseKey);

    // Crear gráfico
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#333'
      },
      grid: {
        vertLines: { color: '#e1e1e1' },
        horzLines: { color: '#e1e1e1' }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    });

    chartRef.current = chart;

    // Agregar serie
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });

    seriesRef.current = series;

    // Cargar datos históricos
    loadHistoricalData();

    // Configurar tiempo real
    setupRealtime();

    // Manejar resize
    const handleResize = () => {
      chart.applyOptions({
        width: containerRef.current!.clientWidth
      });
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current);
      }
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [supabaseUrl, supabaseKey, tableName, symbol]);

  async function loadHistoricalData() {
    if (!supabaseRef.current || !seriesRef.current) return;

    try {
      const { data, error } = await supabaseRef.current
        .from(tableName)
        .select('*')
        .eq('symbol', symbol)
        .order('timestamp', { ascending: true })
        .limit(500);

      if (error) throw error;

      const chartData = data.map(row => ({
        time: Math.floor(new Date(row.timestamp).getTime() / 1000),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close)
      }));

      dataCacheRef.current = chartData;
      seriesRef.current.setData(chartData);
      chartRef.current?.timeScale().fitContent();

    } catch (error) {
      console.error('Error al cargar datos históricos:', error);
    }
  }

  function setupRealtime() {
    if (!supabaseRef.current) return;

    channelRef.current = supabaseRef.current
      .channel(`${symbol}-updates`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: `symbol=eq.${symbol}`
        },
        (payload) => handleRealtimeUpdate(payload.new)
      )
      .subscribe();
  }

  function handleRealtimeUpdate(newRow: any) {
    if (!seriesRef.current) return;

    const newData = {
      time: Math.floor(new Date(newRow.timestamp).getTime() / 1000),
      open: parseFloat(newRow.open),
      high: parseFloat(newRow.high),
      low: parseFloat(newRow.low),
      close: parseFloat(newRow.close)
    };

    dataCacheRef.current.push(newData);
    seriesRef.current.update(newData);
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

## Indicadores técnicos: implementación manual requerida

**TradingView Lightweight Charts NO incluye indicadores técnicos integrados**. Sin embargo, la documentación oficial proporciona ejemplos de implementación para los indicadores más comunes.

La biblioteca ofrece dos métodos para implementar indicadores:

**Método 1: Función helper con sincronización automática**
```javascript
import { applyMovingAverageIndicator } from './indicators/moving-average';

const chart = createChart(document.body);
const mainSeries = chart.addSeries(CandlestickSeries);
mainSeries.setData(symbolData);

// Crea y sincroniza automáticamente la serie EMA
applyMovingAverageIndicator(mainSeries, {
  length: 20,
  type: 'EMA',
  source: 'close'
});
```

**Método 2: Cálculo manual**
```javascript
function calculateMovingAverage(candleData, maLength) {
  const maData = [];

  for (let i = 0; i < candleData.length; i++) {
    if (i < maLength - 1) {
      maData.push({ time: candleData[i].time }); // Whitespace
    } else {
      let sum = 0;
      for (let j = 0; j < maLength; j++) {
        sum += candleData[i - j].close;
      }
      maData.push({
        time: candleData[i].time,
        value: sum / maLength
      });
    }
  }

  return maData;
}

// Uso
const candleSeries = chart.addSeries(CandlestickSeries);
candleSeries.setData(candleData);

const ma20Data = calculateMovingAverage(candleData, 20);
const ma20Series = chart.addSeries(LineSeries, {
  color: 'rgba(4, 111, 232, 1)',
  lineWidth: 2
});
ma20Series.setData(ma20Data);
```

El repositorio oficial incluye ejemplos de implementación para: Moving Averages (SMA, EMA, WMA), Bollinger Bands, RSI, MACD, Stochastic Oscillator, ATR, y VWAP.

## Sistema de plugins: extensibilidad total

La versión 5.0 introduce un **sistema de plugins completo con tres tipos**: Custom Series (nuevos tipos de series), Series Primitives (elementos de dibujo adjuntos a series), y Pane Primitives (elementos a nivel de panel).

### Custom Series para tipos de gráficos personalizados

```javascript
class MyCustomSeries {
  // Implementar interfaz ICustomSeriesPaneView
  update() { }
  renderer() { return new MyRenderer(); }
}

const customSeries = chart.addCustomSeries(new MyCustomSeries(), {
  customOption: 10
});

// Datos pueden tener propiedades personalizadas
customSeries.setData([
  { time: 1642425322, value: 123, customValue: 456 }
]);
```

### Series Primitives para elementos de dibujo

```javascript
class MyCustomPrimitive {
  // Implementar ISeriesPrimitive
  updateAllViews() { }
  paneViews() { return []; }
  priceAxisViews() { return []; }
  timeAxisViews() { return []; }
}

const myPrimitive = new MyCustomPrimitive();
lineSeries.attachPrimitive(myPrimitive);

// Desadjuntar cuando termine
lineSeries.detachPrimitive(myPrimitive);
```

Los ejemplos oficiales de plugins incluyen: Heatmaps, Alerts, Watermarks (texto e imagen), Tooltips, Background shade series, Up/Down markers, y herramientas de dibujo personalizadas. Puedes verlos en https://tradingview.github.io/lightweight-charts/plugin-examples

## Conclusión: herramienta profesional para visualización financiera

TradingView Lightweight Charts combina **tamaño mínimo (35KB), rendimiento excepcional, y funcionalidad completa** en una biblioteca open-source. Su integración con React/Next.js requiere solo seguir patrones de importación dinámica, mientras que la conexión con Supabase es directa mediante su REST API y sistema Realtime. La biblioteca no impone opiniones sobre arquitectura de datos, permitiéndote implementar la estrategia de caché y actualización que mejor se ajuste a tu caso de uso.

Los puntos clave para implementación exitosa: siempre usa `update()` para tiempo real en lugar de `setData()`, implementa cleanup apropiado con `chart.remove()`, aprovecha el sistema de eventos para tooltips e interactividad, y considera caching del lado del cliente para optimizar consultas a Supabase. Con soporte TypeScript completo, API bien documentada, y sistema de plugins extensible, la biblioteca está lista para aplicaciones de producción desde dashboards de trading hasta visualización de métricas empresariales.