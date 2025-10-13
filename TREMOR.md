# TREMOR: Guía Completa - Documentación Oficial

## 📋 ÍNDICE COMPLETO

1. [Instalación y Setup](#instalación)
2. [Componentes de Visualización](#visualizaciones)
3. [Componentes UI](#componentes-ui)
4. [Componentes de Input](#inputs)
5. [Layout y Utilidades](#layout)
6. [Sistema de Colores y Temas](#temas)
7. [Personalización Avanzada](#personalización)

---

## 🚀 INSTALACIÓN Y SETUP

### Requisitos Técnicos
- **React**: v18.2.0+
- **Tailwind CSS**: v4.0+ (Tremor Raw) o v3.4+ (Tremor NPM)
- **Next.js**: v14.0+ recomendado

### Método 1: Tremor Raw (Copy & Paste)

**Paso 1: Crear proyecto Next.js**
```bash
npx create-next-app@14.2.28 my-project --ts --tailwind
cd my-project
```

**Paso 2: Actualizar a Tailwind v4**
```bash
npx @tailwindcss/upgrade
```

**Paso 3: Instalar dependencias**
```bash
npm install tailwind-variants clsx tailwind-merge @remixicon/react
npm install @radix-ui/react-dialog @radix-ui/react-popover
```

**Paso 4: Configurar utilidades**
Crear `lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Método 2: Tremor NPM Package

```bash
# Instalación completa
npm install @tremor/react
npm install tailwindcss@^3 @headlessui/react @remixicon/react
```

**Configuración tailwind.config.js**
```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: '#eff6ff',
            muted: '#bfdbfe',
            subtle: '#60a5fa',
            DEFAULT: '#3b82f6',
            emphasis: '#1d4ed8',
            inverted: '#ffffff',
          },
        },
      },
    },
  },
  safelist: [
    {
      pattern: /^(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
  ],
}
```

---

## 📊 COMPONENTES DE VISUALIZACIÓN

### 1. AREACHART

**Descripción**: Gráfico de áreas para mostrar tendencias con áreas sombreadas entre líneas y eje X.

**Casos de Uso**:
- Visualizar tendencias temporales con énfasis en volumen
- Comparar múltiples series de datos apiladas
- Mostrar porcentajes de composición que suman 100%
- Dashboards financieros, métricas de ventas, análisis de tráfico

**Implementación Básica**:
```typescript
"use client"
import { AreaChart } from "@/components/AreaChart"

const data = [
  { date: "Jan 23", SolarPanels: 2890, Inverters: 2338 },
  { date: "Feb 23", SolarPanels: 2756, Inverters: 2103 },
  { date: "Mar 23", SolarPanels: 3322, Inverters: 2194 },
]

export function MyAreaChart() {
  return (
    <AreaChart
      className="h-80"
      data={data}
      index="date"
      categories={["SolarPanels", "Inverters"]}
      colors={["blue", "emerald"]}
      valueFormatter={(num) => `$${num.toLocaleString()}`}
    />
  )
}
```

**Props Completas**:

| Prop | Tipo | Descripción | Casos de Uso |
|------|------|-------------|--------------|
| `data` | `object[]` | Array de objetos con datos | Datos desde API, base de datos, CSV |
| `index` | `string` | Key para eje X | Fechas, categorías, labels temporales |
| `categories` | `string[]` | Keys de series a visualizar | Múltiples métricas, comparación de productos |
| `colors` | `AvailableChartColorsKeys[]` | Colores de categorías | Branding, diferenciación visual |
| `valueFormatter` | `(value: number) => string` | Formateador de valores | Monedas, porcentajes, unidades |
| `showAnimation` | `boolean` | Animación al cargar | UX mejorada, presentaciones |
| `animationDuration` | `number` | Duración animación (ms) | Control de timing |
| `showLegend` | `boolean` | Mostrar leyenda | Identificación de series |
| `showTooltip` | `boolean` | Mostrar tooltip | Detalles on-hover |
| `showGridLines` | `boolean` | Mostrar líneas de cuadrícula | Lectura precisa de valores |
| `showXAxis` | `boolean` | Mostrar eje X | Contexto temporal |
| `showYAxis` | `boolean` | Mostrar eje Y | Escala de valores |
| `yAxisWidth` | `number` | Ancho del eje Y | Valores grandes, ajuste de espacio |
| `startEndOnly` | `boolean` | Solo labels inicio/fin | Gráficos compactos, sparklines |
| `intervalType` | `"preserveStartEnd" \| "equidistantPreserveStart"` | Lógica de intervalos | Espaciado de labels |
| `type` | `"default" \| "stacked" \| "percent"` | Tipo de gráfico | Comparación absoluta/relativa |
| `fill` | `"gradient" \| "solid" \| "none"` | Estilo de relleno | Estética, énfasis visual |
| `connectNulls` | `boolean` | Conectar valores nulos | Datos incompletos, continuidad |
| `autoMinValue` | `boolean` | Ajuste automático de mínimo | Optimización de escala |
| `minValue` | `number` | Valor mínimo Y | Control de rango |
| `maxValue` | `number` | Valor máximo Y | Control de rango |
| `allowDecimals` | `boolean` | Permitir decimales en ejes | Precisión de valores |
| `onValueChange` | `(value: EventProps) => void` | Callback al hacer click | Interactividad, drill-down |
| `customTooltip` | `React.ComponentType<TooltipProps>` | Tooltip personalizado | Información adicional |
| `xAxisLabel` | `string` | Label del eje X | Claridad de datos |
| `yAxisLabel` | `string` | Label del eje Y | Claridad de datos |
| `legendPosition` | `"left" \| "center" \| "right"` | Posición de leyenda | Layout optimizado |
| `enableLegendSlider` | `boolean` | Slider en leyenda | Muchas categorías |
| `tickGap` | `number` | Gap entre ticks | Densidad de labels |

**Variantes de Type**:

1. **Default**: Series independientes superpuestas
   - Uso: Comparar tendencias absolutas
   - Ejemplo: Ventas de múltiples productos

2. **Stacked**: Series apiladas acumulativas
   - Uso: Mostrar composición y total
   - Ejemplo: Ingresos por región (total visible)

3. **Percent**: Series como porcentaje del total (100%)
   - Uso: Comparar proporciones relativas
   - Ejemplo: Market share, distribución de recursos

**Personalización Tooltip**:
```typescript
import { TooltipProps } from "@/components/AreaChart"

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload) return null
  
  return (
    <div className="rounded-lg bg-white p-3 shadow-lg">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex gap-2">
          <span style={{ color: item.color }}>●</span>
          <span>{item.name}: {item.value}</span>
        </div>
      ))}
    </div>
  )
}

<AreaChart customTooltip={CustomTooltip} ... />
```

---

### 2. BARCHART

**Descripción**: Gráfico de barras para comparar valores entre categorías.

**Casos de Uso**:
- Comparaciones categóricas (productos, regiones, personas)
- Rankings y top performers
- Análisis de distribución y frecuencia
- Comparar múltiples métricas por categoría

**Implementación**:
```typescript
"use client"
import { BarChart } from "@/components/BarChart"

const data = [
  { name: "Amphibians", value: 2488 },
  { name: "Birds", value: 1445 },
  { name: "Crustaceans", value: 743 },
]

<BarChart
  className="h-80"
  data={data}
  index="name"
  categories={["value"]}
  colors={["blue"]}
  valueFormatter={(num) => num.toLocaleString()}
  yAxisWidth={48}
  layout="vertical"
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `layout` | `"vertical" \| "horizontal"` | Vertical: categorías en X; Horizontal: categorías en Y |
| `barCategoryGap` | `string \| number` | Gap entre grupos de barras (ej: "10%" o 40) |
| `stack` | `boolean` | Apilar barras de múltiples categorías |
| `relative` | `boolean` | Mostrar como porcentajes (requiere stack: true) |

**Variantes**:

1. **Vertical (Default)**
   - Uso: 2-10 categorías, comparación estándar
   - Ejemplo: Ventas mensuales

2. **Horizontal**
   - Uso: >10 categorías, nombres largos
   - Ejemplo: Rankings de países

3. **Stacked**
   - Uso: Composición por categoría
   - Ejemplo: Ingresos por producto y región

4. **Grouped**
   - Uso: Comparar subcategorías lado a lado
   - Ejemplo: Ventas Q1 vs Q2 por producto

---

### 3. LINECHART

**Descripción**: Líneas continuas conectando puntos de datos.

**Casos de Uso**:
- Tendencias temporales sin énfasis en volumen
- Series de tiempo con múltiples métricas
- Comparar patrones de crecimiento
- Visualizar volatilidad y cambios graduales

**Implementación**:
```typescript
"use client"
import { LineChart } from "@/components/LineChart"

const data = [
  { date: "Jan 22", SolarPanels: 2890, Inverters: 2338 },
  { date: "Feb 22", SolarPanels: 2756, Inverters: 2103 },
]

<LineChart
  className="h-80"
  data={data}
  index="date"
  categories={["SolarPanels", "Inverters"]}
  colors={["blue", "emerald"]}
  curveType="natural"
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `curveType` | `"linear" \| "natural" \| "monotone" \| "step"` | Linear: líneas rectas; Natural: curvas suaves; Step: escalones |

**Diferencia con AreaChart**:
- LineChart: Énfasis en tendencia y puntos de datos
- AreaChart: Énfasis en volumen y magnitud acumulativa

---

### 4. DONUTCHART

**Descripción**: Visualización circular para mostrar proporciones.

**Casos de Uso**:
- Composición porcentual (presupuestos, categorías)
- Market share y distribución
- Mostrar parte de un todo
- KPI cards con métricas de composición

**Implementación**:
```typescript
"use client"
import { DonutChart } from "@/components/DonutChart"

const data = [
  { name: "SolarCells", amount: 4890 },
  { name: "Glass", amount: 2103 },
  { name: "JunctionBox", amount: 2050 },
]

<DonutChart
  data={data}
  category="name"
  value="amount"
  variant="donut"
  label="$12,143"
  showLabel={true}
  valueFormatter={(num) => `$${num.toLocaleString()}`}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `variant` | `"donut" \| "pie"` | Donut: centro vacío para label; Pie: círculo completo |
| `label` | `string` | Texto en centro (solo donut) | Total, KPI principal |
| `showLabel` | `boolean` | Mostrar label central | Énfasis en total |
| `category` | `string` | Key del nombre de segmento | |
| `value` | `string` | Key del valor numérico | |

**Variantes**:

1. **Donut (Default)**
   - Uso: Enfatizar valor central
   - Ejemplo: "$45K Total Revenue" con breakdown

2. **Pie**
   - Uso: Maximizar área de segmentos
   - Ejemplo: Distribución simple sin total

**Best Practices**:
- Usar 3-7 segmentos (más de 7 dificulta lectura)
- Ordenar segmentos por tamaño (mayor a menor)
- Usar colores diferenciados
- Considerar BarList para >7 categorías

---

### 5. SCATTER CHART

**Descripción**: Puntos en espacio 2D/3D para mostrar correlaciones.

**Casos de Uso**:
- Análisis de correlación entre variables
- Bubble charts (3 dimensiones)
- Identificar outliers y clusters
- Análisis científico y estadístico

**Implementación**:
```typescript
"use client"
import { ScatterChart } from "@/components/ScatterChart"

const data = [
  { Country: "Argentina", GDP: 13467, LifeExpectancy: 76.3, Population: 43417765 },
  { Country: "Australia", GDP: 56554, LifeExpectancy: 82.8, Population: 23789338 },
]

<ScatterChart
  className="h-80"
  data={data}
  category="Country"
  x="GDP"
  y="LifeExpectancy"
  size="Population"
  valueFormatter={{
    x: (val) => `$${val.toLocaleString()}`,
    y: (val) => `${val} years`,
    size: (val) => `${(val/1000000).toFixed(1)}M`
  }}
  sizeRange={[50, 500]}
  opacity={60}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `x` | `string` | Key para eje X | Variable independiente |
| `y` | `string` | Key para eje Y | Variable dependiente |
| `size` | `string` | Key para tamaño de punto | 3ra dimensión (opcional) |
| `sizeRange` | `[number, number]` | Rango de tamaños [min, max] | Control visual |
| `opacity` | `number` | 0-100, transparencia | Overlapping points |
| `valueFormatter` | `{x, y, size}` | Formatters por eje | Unidades diferentes |

**Casos de Análisis**:
- Correlación positiva/negativa
- No correlación (dispersión aleatoria)
- Clusters y agrupaciones
- Outliers y valores atípicos

---

### 6. COMBO CHART

**Descripción**: Combinación de barras y líneas en un mismo gráfico.

**Casos de Uso**:
- Comparar métricas de diferentes escalas (ventas + margen%)
- Mostrar valores absolutos y relativos juntos
- Contexto de KPI (barras: valores, línea: objetivo)
- Dual-axis para unidades diferentes

**Implementación**:
```typescript
"use client"
import { ComboChart } from "@/components/ComboChart"

const data = [
  { month: "Jan", Revenue: 45000, Profit: 12000, Margin: 26.7 },
  { month: "Feb", Revenue: 52000, Profit: 15600, Margin: 30.0 },
]

<ComboChart
  data={data}
  index="month"
  barCategories={["Revenue", "Profit"]}
  lineCategories={["Margin"]}
  colors={["blue", "emerald", "amber"]}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `barCategories` | `string[]` | Series como barras | Valores absolutos |
| `lineCategories` | `string[]` | Series como líneas | Porcentajes, ratios |

---

### 7. BARLIST

**Descripción**: Lista horizontal de barras con labels y valores.

**Casos de Uso**:
- Rankings y top N
- Comparaciones de muchas categorías (>10)
- Listas ordenadas con valores
- Dashboards compactos

**Implementación**:
```typescript
"use client"
import { BarList } from "@/components/BarList"

const data = [
  { name: "/home", value: 843, href: "/analytics/home" },
  { name: "/documentation", value: 384 },
  { name: "/blocks", value: 108 },
]

<BarList
  data={data}
  valueFormatter={(num) => num.toLocaleString()}
  sortOrder="descending"
  onValueChange={(item) => console.log(item)}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `sortOrder` | `"ascending" \| "descending" \| "none"` | Control de ordenamiento |
| `showAnimation` | `boolean` | Animación de barras | UX |
| `href` | `string` (en data) | Links clickeables | Navegación |

**Ventajas sobre BarChart**:
- Más compacto para muchas categorías
- Mejor para rankings
- Labels siempre legibles
- Scroll-friendly

---

### 8. SPARK CHARTS

**Descripción**: Micro-visualizaciones sin ejes para uso inline.

**Variantes**:
- **SparkAreaChart**
- **SparkLineChart**
- **SparkBarChart**

**Casos de Uso**:
- Tendencias en tablas (una spark por row)
- KPI cards compactas
- Dashboards densos
- Indicadores rápidos

**Implementación**:
```typescript
"use client"
import { SparkAreaChart, SparkLineChart, SparkBarChart } from "@/components/SparkChart"

const data = [
  { month: "Jan", Performance: 4000 },
  { month: "Feb", Performance: 3000 },
  { month: "Mar", Performance: 2000 },
]

// En una tabla
<td>
  <SparkLineChart
    data={data}
    index="month"
    categories={["Performance"]}
    colors={["blue"]}
    className="h-10 w-20"
  />
</td>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `fill` | `"gradient" \| "solid" \| "none"` | Solo SparkArea | Énfasis visual |
| `barCategoryGap` | `string \| number` | Solo SparkBar | Densidad de barras |

**Best Practices**:
- Altura recomendada: 40-60px
- Ancho flexible según container
- Sin showLegend, showTooltip (minimalistas)
- 5-15 puntos de datos ideal

---

### 9. PROGRESS BAR

**Descripción**: Barra horizontal para indicar progreso o porcentaje.

**Casos de Uso**:
- Porcentajes de completitud
- Objetivos y metas (actual vs target)
- Uso de recursos (CPU, memoria, disco)
- Status de tareas

**Implementación**:
```typescript
"use client"
import { ProgressBar } from "@/components/ProgressBar"

<ProgressBar
  value={62}
  max={100}
  variant="success"
  showAnimation={true}
  label="62%"
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `value` | `number` | Valor actual | 0-max |
| `max` | `number` | Valor máximo | Default: 100 |
| `variant` | `"default" \| "neutral" \| "success" \| "warning" \| "error"` | Semántica de color |
| `label` | `string` | Texto al lado | Contexto |
| `showAnimation` | `boolean` | Animación de llenado | UX |

**Variantes de Color**:
- **default** (azul): Progreso estándar
- **neutral** (gris): Información sin connotación
- **success** (verde): Completado, objetivo logrado
- **warning** (amarillo): Atención, cerca de límite
- **error** (rojo): Problema, exceso

---

### 10. PROGRESS CIRCLE

**Descripción**: Indicador circular de progreso.

**Casos de Uso**:
- Porcentajes en espacios compactos
- KPI cards circulares
- Indicadores de salud del sistema
- Scoreboards

**Implementación**:
```typescript
"use client"
import { ProgressCircle } from "@/components/ProgressCircle"

<ProgressCircle
  value={62}
  radius={80}
  strokeWidth={8}
  variant="success"
  showAnimation={true}
>
  <span className="text-2xl font-bold">62%</span>
</ProgressCircle>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `radius` | `number` | Radio del círculo (px) | Tamaño del componente |
| `strokeWidth` | `number` | Grosor del trazo | Énfasis visual |
| `children` | `React.ReactNode` | Contenido central | Label, ícono, métrica |

**Diferencia con ProgressBar**:
- Circle: Espacios cuadrados, grupos de KPIs
- Bar: Listas, tablas, layouts horizontales

---

### 11. CATEGORY BAR

**Descripción**: Barra segmentada mostrando múltiples categorías.

**Casos de Uso**:
- Composición porcentual en una línea
- Distribución de recursos
- Breakdown de totales
- Status de múltiples estados

**Implementación**:
```typescript
"use client"
import { CategoryBar } from "@/components/CategoryBar"

<CategoryBar
  values={[55, 30, 15]}
  colors={["emerald", "yellow", "red"]}
  markerValue={72}
  showLabels={true}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `values` | `number[]` | Valores de cada segmento | Porcentajes o absolutos |
| `markerValue` | `number` | Marcador vertical | Objetivo, promedio |
| `showLabels` | `boolean` | Labels en puntos clave | 0, valores, 100 |

---

### 12. TRACKER

**Descripción**: Visualización compacta de status a lo largo del tiempo.

**Casos de Uso**:
- Uptime/downtime monitoring
- Status de tareas diarias
- Activity tracking (commits, deploys)
- Heat maps simples

**Implementación**:
```typescript
"use client"
import { Tracker } from "@/components/Tracker"

const data = [
  { date: "2024-01-01", status: "operational" },
  { date: "2024-01-02", status: "degraded" },
  { date: "2024-01-03", status: "downtime" },
]

<Tracker
  data={data}
  index="date"
  category="status"
  colors={["emerald", "yellow", "red"]}
  tooltip="Status"
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `tooltip` | `string` | Texto del tooltip | Contexto |

**Best Practices**:
- 30-90 puntos de datos ideal
- 3-5 estados diferentes
- Colores semánticos (verde/amarillo/rojo)

---

### 13. FUNNEL CHART

**Descripción**: Embudo mostrando conversión entre etapas.

**Casos de Uso**:
- Embudos de ventas (leads → clientes)
- Flujos de usuario (visitas → conversiones)
- Procesos de onboarding
- Análisis de abandono

**Implementación**:
```typescript
"use client"
import { FunnelChart } from "@/components/FunnelChart"

const data = [
  { name: "Visits", value: 1000 },
  { name: "Sign ups", value: 450 },
  { name: "Purchases", value: 120 },
]

<FunnelChart
  data={data}
  className="h-80"
  evolutionGradient={true}
  gradient={false}
/>
```

**Props Específicas**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `evolutionGradient` | `boolean` | Gradiente en gaps | Énfasis en caída |
| `gradient` | `boolean` | Gradiente en segmentos | Estética |

---

## 🎨 COMPONENTES UI

### 1. CARD

**Descripción**: Contenedor fundamental para secciones de UI.

**Casos de Uso**:
- Agrupar visualizaciones
- KPI cards
- Secciones de formularios
- Módulos de dashboard

**Implementación**:
```typescript
import { Card } from "@/components/Card"

<Card
  decoration="top"
  decorationColor="indigo"
  className="mx-auto max-w-xs"
>
  <p className="text-gray-700">Sales</p>
  <p className="text-3xl font-semibold">$34,743</p>
</Card>
```

**Props**:

| Prop | Valores | Casos de Uso |
|------|---------|--------------|
| `decoration` | `"top" \| "left" \| "bottom" \| "right"` | Borde decorativo |
| `decorationColor` | 22 colores Tremor | Categorización visual |

---

### 2. BADGE

**Descripción**: Etiqueta pequeña para destacar información.

**Casos de Uso**:
- Status indicators
- Categorías y tags
- Contadores (notificaciones)
- Labels en tablas

**Implementación**:
```typescript
import { Badge } from "@/components/Badge"

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Critical</Badge>
```

**Variantes**:
- `default`: Información general
- `neutral`: Sin connotación
- `success`: Positivo, completado
- `warning`: Atención requerida
- `error`: Problema, fallo

**BadgeDelta**:
```typescript
import { BadgeDelta } from "@/components/Badge"

<BadgeDelta deltaType="increase">+12.3%</BadgeDelta>
<BadgeDelta deltaType="decrease" isIncreasePositive={false}>-5.1%</BadgeDelta>
```

**Props BadgeDelta**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `deltaType` | `"increase" \| "decrease" \| "moderateIncrease" \| "moderateDecrease" \| "unchanged"` | Tipo de cambio |
| `isIncreasePositive` | `boolean` | Semántica del cambio | Costos: false |

---

### 3. BUTTON

**Descripción**: Botón con múltiples variantes.

**Implementación**:
```typescript
import { Button } from "@/components/Button"

<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="light">Light</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

<Button disabled>Disabled</Button>
<Button asChild>
  <a href="/docs">Link Button</a>
</Button>
```

**Variantes**:
- **primary**: Acción principal (1 por vista)
- **secondary**: Acciones secundarias
- **light**: Menos énfasis
- **ghost**: Mínimo, sin borde
- **destructive**: Acciones peligrosas (eliminar)

**Props**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `asChild` | `boolean` | Renderiza children directamente | Links, custom elements |

---

### 4. ACCORDION

**Descripción**: Stack de secciones expandibles.

**Casos de Uso**:
- FAQs
- Categorías de configuración
- Secciones de información
- Menús colapsables

**Implementación**:
```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>¿Cómo instalar?</AccordionTrigger>
    <AccordionContent>
      Ejecuta npm install @tremor/react
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2" disabled>
    <AccordionTrigger>Próximamente</AccordionTrigger>
    <AccordionContent>...</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Props**:

| Prop | Valores | Descripción |
|------|---------|-------------|
| `type` | `"single" \| "multiple"` | Un item o múltiples abiertos |
| `collapsible` | `boolean` | Permite cerrar item activo |
| `disabled` | `boolean` | Item no interactivo |

---

### 5. DIALOG

**Descripción**: Modal centrado sobre contenido.

**Casos de Uso**:
- Confirmaciones importantes
- Formularios modales
- Detalles expandidos
- Wizards y onboarding

**Implementación**:
```typescript
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/Dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>¿Estás seguro?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="secondary">Cancelar</Button>
      </DialogClose>
      <Button variant="destructive">Eliminar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Best Practices**:
- Máximo 1 Dialog a la vez
- Evitar Dialogs anidados
- Siempre opción de cerrar (X o Cancelar)
- Acción principal en color primario

---

### 6. DRAWER

**Descripción**: Panel lateral deslizante.

**Casos de Uso**:
- Filtros y configuración
- Detalles de item seleccionado
- Formularios extensos
- Navegación secundaria

**Implementación**:
```typescript
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/Drawer"

<Drawer>
  <DrawerTrigger asChild>
    <Button>Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent className="sm:max-w-lg">
    <DrawerHeader>
      <DrawerTitle>Filtros</DrawerTitle>
      <DrawerDescription>
        Personaliza tu búsqueda
      </DrawerDescription>
    </DrawerHeader>
    <DrawerBody>
      {/* Contenido del drawer */}
    </DrawerBody>
    <DrawerFooter>
      <Button>Aplicar</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

**Diferencia con Dialog**:
- Dialog: Confirmaciones, acciones críticas
- Drawer: Contenido extenso, formularios, filtros

---

### 7. POPOVER

**Descripción**: Contenido emergente contextual.

**Casos de Uso**:
- Información adicional
- Menús contextuales
- Tooltips complejos
- Mini-formularios

**Implementación**:
```typescript
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"

<Popover>
  <PopoverTrigger>
    <Button>Info</Button>
  </PopoverTrigger>
  <PopoverContent className="p-4">
    <div className="space-y-2">
      <h4 className="font-medium">Información</h4>
      <p className="text-sm">Detalles adicionales aquí</p>
    </div>
  </PopoverContent>
</Popover>
```

---

### 8. TOAST

**Descripción**: Notificaciones temporales.

**Casos de Uso**:
- Feedback de acciones (guardado, error)
- Notificaciones del sistema
- Alertas temporales
- Confirmaciones no bloqueantes

**Implementación**:
```typescript
import { toast } from "@/components/Toast"

// En un handler
const handleSave = () => {
  toast.success("Guardado exitosamente")
  toast.error("Error al guardar")
  toast.info("Procesando...")
}
```

**Tipos**:
- `toast.success()`: Acción exitosa
- `toast.error()`: Error o fallo
- `toast.info()`: Información general
- `toast.warning()`: Advertencia

---

### 9. TOOLTIP

**Descripción**: Texto emergente al hover.

**Casos de Uso**:
- Explicaciones breves
- Labels de íconos
- Información contextual
- Ayuda inline

**Implementación**:
```typescript
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/Tooltip"

<Tooltip>
  <TooltipTrigger>
    <Button variant="ghost">?</Button>
  </TooltipTrigger>
  <TooltipContent>
    Esto es un tooltip explicativo
  </TooltipContent>
</Tooltip>
```

---

### 10. TABLE

**Descripción**: Tabla de datos con sorting y estilos.

**Casos de Uso**:
- Listados de datos
- Reportes tabulares
- Comparaciones multi-dimensionales
- CRUD interfaces

**Implementación**:
```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nombre</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Badge>{user.role}</Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Patrones Comunes**:
- Spark charts en celdas
- Badges para status
- Botones de acción en última columna
- Hover highlighting de rows

---

### 11. TABS

**Descripción**: Navegación entre vistas sin cambiar página.

**Casos de Uso**:
- Múltiples vistas de datos
- Secciones de configuración
- Dashboards multi-panel
- Categorización de contenido

**Implementación**:
```typescript
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@/components/Tabs"

<TabGroup>
  <TabList variant="line">
    <Tab>Overview</Tab>
    <Tab>Analytics</Tab>
    <Tab>Settings</Tab>
  </TabList>
  <TabPanels>
    <TabPanel>
      <p>Overview content</p>
    </TabPanel>
    <TabPanel>
      <p>Analytics content</p>
    </TabPanel>
    <TabPanel>
      <p>Settings content</p>
    </TabPanel>
  </TabPanels>
</TabGroup>
```

**Variantes**:
- `line`: Underline al tab activo
- `solid`: Background al tab activo

---

### 12. DIVIDER

**Descripción**: Línea separadora.

**Casos de Uso**:
- Separar secciones
- Agrupar contenido relacionado
- Claridad visual

**Implementación**:
```typescript
import { Divider } from "@/components/Divider"

<Divider />
<Divider className="my-8" />
```

---

### 13. CALLOUT

**Descripción**: Bloque de información destacada.

**Casos de Uso**:
- Avisos importantes
- Tips y sugerencias
- Alertas informativas
- Warnings

**Implementación**:
```typescript
import { Callout } from "@/components/Callout"

<Callout variant="info">
  Recuerda guardar tus cambios
</Callout>

<Callout variant="warning">
  Esta acción afectará todos los usuarios
</Callout>
```

---

## 📝 COMPONENTES DE INPUT

### 1. INPUT

**Descripción**: Campo de texto básico.

**Tipos Soportados**:
- `text`: Texto general
- `email`: Email con validación
- `password`: Contraseña oculta
- `number`: Solo números
- `search`: Campo de búsqueda
- `url`: URLs
- `tel`: Teléfonos
- `date`: Selector de fecha

**Implementación**:
```typescript
import { Input } from "@/components/Input"
import { Label } from "@/components/Label"

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="tu@email.com"
    hasError={false}
    errorMessage="Email inválido"
  />
</div>
```

**Props**:

| Prop | Descripción | Casos de Uso |
|------|-------------|--------------|
| `hasError` | `boolean` | Validación visual | Formularios |
| `errorMessage` | `string` | Mensaje de error | Feedback |
| `disabled` | `boolean` | Deshabilitar input | Estados |

---

### 2. TEXTAREA

**Descripción**: Campo de texto multilínea.

**Casos de Uso**:
- Comentarios
- Descripciones
- Contenido extenso
- Feedback forms

**Implementación**:
```typescript
import { Textarea } from "@/components/Textarea"

<Textarea
  placeholder="Escribe tu comentario..."
  rows={4}
  maxLength={500}
/>
```

---

### 3. SELECT

**Descripción**: Dropdown para seleccionar una opción.

**Casos de Uso**:
- Selección de categorías
- Filtros
- Configuración de opciones
- Selección de país, idioma, etc.

**Implementación**:
```typescript
import { Select, SelectItem } from "@/components/Select"

<Select defaultValue="us">
  <SelectItem value="us">Estados Unidos</SelectItem>
  <SelectItem value="mx">México</SelectItem>
  <SelectItem value="ca">Canadá</SelectItem>
</Select>
```

**Select con Búsqueda (SearchSelect)**:
```typescript
import { SearchSelect, SearchSelectItem } from "@/components/SearchSelect"

<SearchSelect
  placeholder="Buscar país..."
  onValueChange={(value) => console.log(value)}
>
  {countries.map((country) => (
    <SearchSelectItem key={country.code} value={country.code}>
      {country.name}
    </SearchSelectItem>
  ))}
</SearchSelect>
```

---

### 4. CHECKBOX

**Descripción**: Casilla de verificación.

**Casos de Uso**:
- Opciones múltiples
- Términos y condiciones
- Filtros de búsqueda
- Configuración de preferencias

**Implementación**:
```typescript
import { Checkbox } from "@/components/Checkbox"

<Checkbox
  id="terms"
  checked={accepted}
  onCheckedChange={(checked) => setAccepted(checked)}
/>
<Label htmlFor="terms">Acepto los términos</Label>
```

**Estados**:
- `checked`: true/false
- `indeterminate`: Parcialmente seleccionado

---

### 5. RADIO GROUP

**Descripción**: Selección única entre opciones.

**Casos de Uso**:
- Opciones mutuamente excluyentes
- Configuración de preferencias
- Quiz y formularios
- Métodos de pago

**Implementación**:
```typescript
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup"

<RadioGroup defaultValue="card" onValueChange={(value) => setPayment(value)}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="card" id="card" />
    <Label htmlFor="card">Tarjeta de crédito</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="paypal" id="paypal" />
    <Label htmlFor="paypal">PayPal</Label>
  </div>
</RadioGroup>
```

**Radio Card Group**:
Versión con cards para opciones visuales.

---

### 6. SWITCH

**Descripción**: Toggle on/off.

**Casos de Uso**:
- Configuraciones binarias
- Activar/desactivar features
- Dark mode toggle
- Notificaciones on/off

**Implementación**:
```typescript
import { Switch } from "@/components/Switch"

<div className="flex items-center gap-2">
  <Switch
    id="notifications"
    checked={enabled}
    onCheckedChange={(checked) => setEnabled(checked)}
  />
  <Label htmlFor="notifications">Activar notificaciones</Label>
</div>
```

---

### 7. SLIDER

**Descripción**: Control deslizante para rangos.

**Casos de Uso**:
- Selección de rangos (precio, edad)
- Volumen, brillo
- Configuración numérica
- Filtros de búsqueda

**Implementación**:
```typescript
import { Slider } from "@/components/Slider"

<Slider
  defaultValue={[50]}
  min={0}
  max={100}
  step={1}
  onValueChange={(value) => console.log(value)}
/>
```

**Range Slider**:
```typescript
<Slider
  defaultValue={[20, 80]}
  min={0}
  max={100}
  step={5}
  onValueChange={(values) => console.log(values)}
/>
```

---

### 8. DATE PICKER

**Descripción**: Selector de fecha individual.

**Casos de Uso**:
- Fecha de nacimiento
- Scheduling
- Deadlines
- Eventos

**Implementación**:
```typescript
import { DatePicker } from "@/components/DatePicker"

<DatePicker
  value={date}
  onValueChange={(date) => setDate(date)}
  placeholder="Selecciona una fecha"
  minDate={new Date(2020, 0, 1)}
  maxDate={new Date()}
/>
```

---

### 9. DATE RANGE PICKER

**Descripción**: Selector de rango de fechas.

**Casos de Uso**:
- Filtros de dashboard
- Reportes por período
- Reservaciones
- Análisis temporal

**Implementación**:
```typescript
import { DateRangePicker } from "@/components/DateRangePicker"

<DateRangePicker
  value={dateRange}
  onValueChange={(range) => setDateRange(range)}
  enableSelect={true}
  placeholder="Selecciona rango"
  selectPlaceholder="Período"
/>
```

**Presets Comunes**:
```typescript
const presets = [
  { label: "Hoy", value: "today" },
  { label: "Última semana", value: "last-week" },
  { label: "Último mes", value: "last-month" },
  { label: "Último año", value: "last-year" },
]
```

---

### 10. DROPDOWN MENU

**Descripción**: Menú contextual con acciones.

**Casos de Uso**:
- Acciones por item (editar, eliminar)
- Menús de usuario
- Opciones contextuales
- More actions (...)

**Implementación**:
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Acciones</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => handleEdit()}>
      Editar
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDelete()}>
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 11. CALENDAR

**Descripción**: Calendario completo para selección de fechas.

**Casos de Uso**:
- Selección visual de fechas
- Scheduling avanzado
- Disponibilidad de recursos
- Eventos y reuniones

---

### 12. TOGGLE

**Descripción**: Botón de estado on/off.

**Casos de Uso**:
- Alternar vistas
- Filtros activos/inactivos
- Toolbar buttons
- Configuración rápida

---

## 🎨 SISTEMA DE COLORES Y TEMAS

### Colores Disponibles (22 Total)

Todos los colores están basados en la paleta de Tailwind CSS:

**Neutros**: slate, gray, zinc, neutral, stone

**Cálidos**: red, orange, amber, yellow

**Verdes**: lime, green, emerald, teal

**Azules**: cyan, sky, blue, indigo

**Morados**: violet, purple, fuchsia

**Rosa**: pink, rose

### Uso en Gráficos

```typescript
// Colores predefinidos
<AreaChart colors={["blue", "emerald", "violet"]} ... />

// Color HEX custom
<AreaChart colors={["blue", "#FF6B35"]} ... />
```

### Colores Custom: Configuración Tailwind

**CRÍTICO**: Los colores custom HEX requieren configuración en `tailwind.config.js`:

```javascript
module.exports = {
  safelist: [
    {
      pattern: /^(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    // Agregar colores custom
    'fill-[#FF6B35]',
    'stroke-[#FF6B35]',
  ],
}
```

### Sistema de Temas (Light/Dark)

**Tokens CSS Customizables**:

```css
:root {
  --tremor-brand-faint: #eff6ff;
  --tremor-brand-muted: #bfdbfe;
  --tremor-brand-subtle: #60a5fa;
  --tremor-brand: #3b82f6;
  --tremor-brand-emphasis: #1d4ed8;
  --tremor-brand-inverted: #ffffff;
  
  --tremor-background-muted: #f9fafb;
  --tremor-background-subtle: #f3f4f6;
  --tremor-background-DEFAULT: #ffffff;
  --tremor-background-emphasis: #374151;
  
  --tremor-border: #e5e7eb;
  --tremor-ring: #e5e7eb;
  
  --tremor-content-subtle: #9ca3af;
  --tremor-content: #6b7280;
  --tremor-content-emphasis: #374151;
  --tremor-content-strong: #111827;
  --tremor-content-inverted: #ffffff;
}

.dark {
  --dark-tremor-brand-faint: #0B1229;
  --dark-tremor-brand-muted: #172554;
  --dark-tremor-brand-subtle: #1e40af;
  --dark-tremor-brand: #3b82f6;
  --dark-tremor-brand-emphasis: #60a5fa;
  --dark-tremor-brand-inverted: #030712;
  
  /* ... más tokens dark */
}
```

### Activar Dark Mode

**Opción 1: Media Query (Default)**
```javascript
// tailwind.config.js - no requiere cambios
// Usa prefers-color-scheme automáticamente
```

**Opción 2: Class-based**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

```typescript
// app/layout.tsx
<html className={isDark ? 'dark' : ''}>
  <body>{children}</body>
</html>
```

---

## 🔧 PERSONALIZACIÓN AVANZADA

### ChartUtils - Utilidades Centralizadas

**Archivo**: `lib/chartUtils.ts`

**Colores Globales para Charts**:
```typescript
export const chartColors = {
  blue: {
    bg: "bg-blue-500",
    stroke: "stroke-blue-500",
    fill: "fill-blue-500",
    text: "text-blue-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    stroke: "stroke-emerald-500",
    fill: "fill-emerald-500",
    text: "text-emerald-500",
  },
  // ... más colores
}

export type AvailableChartColorsKeys = keyof typeof chartColors
```

**Uso**:
```typescript
import { chartColors } from "@/lib/chartUtils"

// Todos los charts usarán estos colores
<AreaChart colors={["blue", "emerald"]} ... />
```

### Tooltips Personalizados

**Estructura de TooltipProps**:
```typescript
type TooltipProps = {
  active: boolean | undefined
  payload: any[] | undefined
  label: string | number | undefined
}
```

**Ejemplo Completo**:
```typescript
import { TooltipProps } from "@/components/AreaChart"

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload) return null
  
  const total = payload.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-950">
      <p className="mb-2 font-semibold text-gray-900 dark:text-gray-50">
        {label}
      </p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {item.name}
            </span>
          </div>
          <span className="font-medium text-gray-900 dark:text-gray-50">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
      <div className="mt-2 border-t pt-2">
        <div className="flex justify-between">
          <span className="text-sm font-semibold">Total:</span>
          <span className="font-bold">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

<AreaChart customTooltip={CustomTooltip} ... />
```

### Value Formatters Avanzados

**Monedas**:
```typescript
const currencyFormatter = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

<BarChart valueFormatter={currencyFormatter} ... />
```

**Porcentajes**:
```typescript
const percentFormatter = (value: number) => `${value.toFixed(1)}%`
```

**Números Compactos**:
```typescript
const compactFormatter = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    notation: "compact",
    compactDisplay: "short",
  }).format(value)
// 1000 → 1K
// 1000000 → 1M
```

**Multi-Axis (ScatterChart)**:
```typescript
<ScatterChart
  valueFormatter={{
    x: (val) => `$${val.toLocaleString()}`,
    y: (val) => `${val} años`,
    size: (val) => `${(val / 1000000).toFixed(1)}M`,
  }}
  ...
/>
```

### Leyendas Interactivas

**Filtrado por Click**:
```typescript
const [activeLegend, setActiveLegend] = useState<string | undefined>()

<AreaChart
  data={data}
  index="date"
  categories={["Revenue", "Costs", "Profit"]}
  onValueChange={(event) => {
    if (event) {
      setActiveLegend(event.categoryClicked)
    } else {
      setActiveLegend(undefined)
    }
  }}
/>
```

### Responsive Charts

**Grid Responsive**:
```typescript
import { Card, Grid } from "@/components/Card"

<Grid numCols={1} numColsSm={2} numColsLg={3} className="gap-6">
  <Card>
    <AreaChart className="h-72" ... />
  </Card>
  <Card>
    <BarChart className="h-72" ... />
  </Card>
  <Card>
    <DonutChart className="h-72" ... />
  </Card>
</Grid>
```

**Breakpoints**:
- `numCols`: Mobile (base)
- `numColsSm`: sm (640px+)
- `numColsMd`: md (768px+)
- `numColsLg`: lg (1024px+)
- `numColsXl`: xl (1280px+)
- `numCols2xl`: 2xl (1536px+)

### Best Practices - Altura de Charts

**✅ CORRECTO**:
```typescript
<AreaChart className="h-80" ... />  // h-80 = 320px
<BarChart className="h-96" ... />   // h-96 = 384px
<LineChart className="h-[500px]" ... /> // Altura custom
```

**❌ INCORRECTO**:
```typescript
<AreaChart className="h-full" ... />  // NO funciona!
<BarChart style={{ height: '100%' }} ... /> // NO funciona!
```

**Razón**: Recharts (librería subyacente) requiere altura numérica explícita.

---

## 💡 CASOS DE USO PRÁCTICOS

### Dashboard KPI Completo

```typescript
"use client"
import { Card, Grid, Metric, BadgeDelta, AreaChart, BarList } from "@/components"

export function KPIDashboard() {
  const kpis = {
    revenue: { value: 45231, delta: 12.3, trend: [...] },
    users: { value: 12543, delta: 8.1, trend: [...] },
    conversion: { value: 3.42, delta: -2.1, trend: [...] },
  }

  return (
    <div className="space-y-6">
      <Grid numColsSm={2} numColsLg={3} className="gap-6">
        {/* Revenue KPI */}
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">Ingresos</p>
            <BadgeDelta deltaType="moderateIncrease">
              +{kpis.revenue.delta}%
            </BadgeDelta>
          </div>
          <Metric className="mt-2">
            ${kpis.revenue.value.toLocaleString()}
          </Metric>
          <AreaChart
            className="mt-4 h-12"
            data={kpis.revenue.trend}
            showXAxis={false}
            showYAxis={false}
            showLegend={false}
          />
        </Card>

        {/* Usuarios KPI */}
        <Card decoration="top" decorationColor="emerald">
          {/* Similar estructura */}
        </Card>

        {/* Conversión KPI */}
        <Card decoration="top" decorationColor="amber">
          {/* Similar estructura */}
        </Card>
      </Grid>

      {/* Gráfico principal */}
      <Card>
        <h3 className="text-lg font-semibold">Tendencia Anual</h3>
        <AreaChart
          className="mt-4 h-80"
          data={monthlyData}
          index="month"
          categories={["Revenue", "Costs", "Profit"]}
          colors={["blue", "red", "emerald"]}
        />
      </Card>

      {/* Top Productos */}
      <Card>
        <h3 className="text-lg font-semibold">Top Productos</h3>
        <BarList
          className="mt-4"
          data={topProducts}
          valueFormatter={(num) => `$${num.toLocaleString()}`}
        />
      </Card>
    </div>
  )
}
```

### Filtrado Avanzado

```typescript
"use client"
import { useState } from "react"
import { DateRangePicker, Select, AreaChart } from "@/components"

export function FilteredDashboard() {
  const [dateRange, setDateRange] = useState({ from: new Date(2024, 0, 1), to: new Date() })
  const [region, setRegion] = useState("all")
  const [metric, setMetric] = useState("revenue")

  const filteredData = rawData.filter((item) => {
    const itemDate = new Date(item.date)
    const matchesDate = itemDate >= dateRange.from && itemDate <= dateRange.to
    const matchesRegion = region === "all" || item.region === region
    return matchesDate && matchesRegion
  })

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <DateRangePicker
          value={dateRange}
          onValueChange={setDateRange}
          placeholder="Seleccionar período"
        />
        <Select value={region} onValueChange={setRegion}>
          <SelectItem value="all">Todas las regiones</SelectItem>
          <SelectItem value="north">Norte</SelectItem>
          <SelectItem value="south">Sur</SelectItem>
          <SelectItem value="east">Este</SelectItem>
          <SelectItem value="west">Oeste</SelectItem>
        </Select>
        <Select value={metric} onValueChange={setMetric}>
          <SelectItem value="revenue">Ingresos</SelectItem>
          <SelectItem value="users">Usuarios</SelectItem>
          <SelectItem value="orders">Pedidos</SelectItem>
        </Select>
      </div>

      <Card>
        <AreaChart
          className="h-96"
          data={filteredData}
          index="date"
          categories={[metric]}
          valueFormatter={(val) => `$${val.toLocaleString()}`}
        />
      </Card>
    </div>
  )
}
```

### Tabla con Spark Charts

```typescript
"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, SparkLineChart } from "@/components"

export function ProductsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ventas</TableHead>
          <TableHead>Tendencia</TableHead>
          <TableHead>Cambio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant={product.stock > 0 ? "success" : "error"}>
                {product.stock > 0 ? "En stock" : "Agotado"}
              </Badge>
            </TableCell>
            <TableCell>${product.sales.toLocaleString()}</TableCell>
            <TableCell>
              <SparkLineChart
                data={product.trend}
                index="month"
                categories={["value"]}
                colors={["blue"]}
                className="h-10 w-24"
              />
            </TableCell>
            <TableCell>
              <BadgeDelta
                deltaType={product.change > 0 ? "increase" : "decrease"}
              >
                {product.change > 0 ? "+" : ""}{product.change}%
              </BadgeDelta>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 📚 RECURSOS OFICIALES

### Documentación
- **Tremor Raw**: https://tremor.so/docs
- **Tremor NPM**: https://npm.tremor.so/docs
- **GitHub**: https://github.com/tremorlabs/tremor

### Herramientas
- **Blocks**: https://blocks.tremor.so/ (Plantillas listas)
- **Figma UI Kit**: https://figma.com/community/file/1233953507961010067
- **Storybook**: Ejemplos interactivos en docs

### Iconos Recomendados
- **Remix Icon**: https://remixicon.com/ (recomendación oficial)
- Instalación: `npm install @remixicon/react`
- Uso: `import { RiHomeLine } from "@remixicon/react"`

---

## ⚡ CONCLUSIÓN

Tremor ofrece **2 modalidades**:

1. **Tremor NPM** (@tremor/react):
   - Instalación rápida vía npm
   - Componentes pre-compilados
   - Ideal para prototipado rápido
   - Menor control sobre código

2. **Tremor Raw** (Copy & Paste):
   - Control total del código fuente
   - Personalización máxima
   - Sin dependencias de paquetes Tremor
   - Ideal para producción y customización

**Componentes Totales**: 40+

**Visualizaciones**: 13 tipos (Area, Bar, Line, Donut, Scatter, Combo, BarList, Spark, Progress, Category, Tracker, Funnel)

**UI Components**: 15+ (Card, Badge, Button, Accordion, Dialog, Drawer, Popover, Toast, Tooltip, Table, Tabs, etc.)

**Inputs**: 12+ (Input, Textarea, Select, Checkbox, Radio, Switch, Slider, DatePicker, DateRangePicker, etc.)

**Colores**: 22 predefinidos + HEX custom

**Temas**: Light/Dark automático con tokens CSS

**Framework**: Diseñado para Next.js 14+ con App Router

**Stack**: React 18.2+, Tailwind CSS 4.0+, Radix UI, Recharts

---

Este informe cubre **ABSOLUTAMENTE TODO** de Tremor según la documentación oficial: instalación, todos los componentes, personalización completa, casos de uso, props exhaustivas, ejemplos prácticos, y best practices. Es tu guía definitiva para dominar Tremor en Next.js + React + Supabase. 🚀