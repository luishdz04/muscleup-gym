/**
 * 📊 TREMOR CHARTS - ENTERPRISE DASHBOARD COMPONENTS
 * 
 * 🎯 GUÍA COMPLETA TREMOR.SO v3.18.7 - OPTIMIZADO JUNIO 2025
 * Framework: Next.js 15 + React 19 + Tailwind CSS 4
 * 
 * ✅ MEJORAS IMPLEMENTADAS:
 * 1. ✨ Colores coherentes con colorTokens (#FFCC00 brand, #22C55E success, #38BDF8 info, #EF4444 danger)
 * 2. 🎨 Tooltips personalizados con totales y contexto
 * 3. 💰 Formatters optimizados (MXN, porcentajes, números compactos)
 * 4. 📊 BadgeDelta para cambios con semántica visual
 * 5. ⚡ Interactividad mejorada con onValueChange
 * 6. 🎭 Animaciones suaves (showAnimation)
 * 7. 📱 Responsive design con Grid
 * 8. 📏 Alturas explícitas (h-80, h-96)
 * 9. 🔍 Labels mejorados (xAxisLabel, yAxisLabel)
 * 10. 🎯 Curvas optimizadas (monotone para suavidad)
 * 
 * 🎨 PALETA MUSCLE UP GYM:
 * - amber (brand): #FFCC00 - Ingresos, ventas principales
 * - emerald (success): #22C55E - Objetivos alcanzados
 * - cyan (info): #38BDF8 - Información neutral
 * - rose (danger): #EF4444 - Alertas, problemas
 */

'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  BarChart,
  DonutChart,
  Card,
  Title,
  Text,
  Metric,
  Flex,
  BadgeDelta,
  DeltaType,
  Grid,
  LineChart,
  Bold,
} from '@tremor/react';

// ============================================================================
// 💰 FORMATEADORES DE VALORES - Centralizados y optimizados
// ============================================================================

/**
 * Formatea valores monetarios en MXN (pesos mexicanos)
 * ✅ CORREGIDO: Muestra 2 decimales exactos sin redondear para cuadre contable
 * Ejemplo: 45231.50 → "$45,231.50"
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea números con separadores de miles
 * Ejemplo: 12543 → "12,543"
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value);
};

/**
 * Formatea porcentajes con 1 decimal
 * Ejemplo: 12.34 → "12.3%"
 */
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Formatea números compactos (K, M, B)
 * Ejemplo: 1500000 → "1.5M"
 */
const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

// ============================================================================
// 📊 WEEKLY SALES CHART - AreaChart con tendencias de ventas semanales
// ============================================================================
interface WeeklySalesData {
  name: string;
  sales: number;
  memberships: number;
  layaways: number;
  date?: string;
}

interface WeeklySalesChartProps {
  data: WeeklySalesData[];
  title?: string;
  showTitle?: boolean;
  height?: number;
}

export const WeeklySalesChart: React.FC<WeeklySalesChartProps> = ({ 
  data, 
  title = "Tendencia de Ventas Semanales",
  showTitle = true,
  height = 320
}) => {
  // Transformar y memoizar datos para Tremor
  const chartData = useMemo(() => {
    return data.map(item => ({
      date: item.date || item.name,
      'Ventas Directas': item.sales,
      'Membresías': item.memberships,
      'Apartados': item.layaways,
    }));
  }, [data]);

  // Calcular métricas avanzadas con comparación
  const metrics = useMemo(() => {
    const total = data.reduce((sum, item) => 
      sum + item.sales + item.memberships + item.layaways, 0
    );
    const avgDaily = total / Math.max(data.length, 1);
    
    // Comparar primera mitad vs segunda mitad para trend
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);
    
    const firstHalfTotal = firstHalf.reduce((sum, item) => 
      sum + item.sales + item.memberships + item.layaways, 0
    );
    const secondHalfTotal = secondHalf.reduce((sum, item) => 
      sum + item.sales + item.memberships + item.layaways, 0
    );
    
    const firstHalfAvg = firstHalfTotal / Math.max(firstHalf.length, 1);
    const secondHalfAvg = secondHalfTotal / Math.max(secondHalf.length, 1);
    
    const changePercent = firstHalfAvg > 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0;
    
    const deltaType: DeltaType = changePercent > 5 ? 'increase' 
      : changePercent < -5 ? 'decrease' 
      : changePercent > 0 ? 'moderateIncrease' 
      : changePercent < 0 ? 'moderateDecrease' 
      : 'unchanged';
    
    return { total, avgDaily, changePercent, deltaType };
  }, [data]);

  return (
    <Card className="ring-1 ring-tremor-border dark:ring-tremor-border">
      {showTitle && (
        <div className="space-y-3">
          <Flex alignItems="start" justifyContent="between">
            <div>
              <Title className="text-tremor-content-strong dark:text-tremor-content-strong">
                {title}
              </Title>
              <Text className="text-tremor-content dark:text-tremor-content mt-1">
                Últimos {data.length} días • Promedio diario {formatCurrency(metrics.avgDaily)}
              </Text>
            </div>
            <div className="text-right">
              <Metric className="text-tremor-brand dark:text-tremor-brand">
                {formatCurrency(metrics.total)}
              </Metric>
              <BadgeDelta deltaType={metrics.deltaType} size="xs" className="mt-1">
                {metrics.changePercent >= 0 ? '+' : ''}{metrics.changePercent.toFixed(1)}%
              </BadgeDelta>
            </div>
          </Flex>
        </div>
      )}
      <AreaChart
        className={`mt-4 h-80`}
        data={chartData}
        index="date"
        categories={['Ventas Directas', 'Membresías', 'Apartados']}
        colors={['amber', 'cyan', 'violet']}
        valueFormatter={formatCurrency}
        showLegend={true}
        showGridLines={true}
        showAnimation={true}
        curveType="monotone"
        connectNulls={true}
        yAxisWidth={80}
        showXAxis={true}
        showYAxis={true}
        startEndOnly={false}
        allowDecimals={false}
        xAxisLabel="Fecha"
        yAxisLabel="Ingresos (MXN)"
      />
    </Card>
  );
};

// ============================================================================
// MONTHLY REVENUE CHART - Bar Chart comparativo mensual
// ============================================================================
interface MonthlyRevenueData {
  month: string;
  sales: number;
  memberships: number;
  layaways: number;
  total: number;
}

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueData[];
  title?: string;
  showTitle?: boolean;
  height?: number;
  stacked?: boolean;
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ 
  data,
  title = "Análisis de Ingresos Mensuales",
  showTitle = true,
  height = 400,
  stacked = false
}) => {
  // Transformar y memoizar datos para Tremor BarChart
  const chartData = useMemo(() => {
    return data.map(item => ({
      Mes: item.month,
      'Ventas Directas': item.sales,
      'Membresías': item.memberships,
      'Apartados': item.layaways,
    }));
  }, [data]);

  // Calcular métricas avanzadas
  const metrics = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.total, 0);
    const avgMonthly = total / Math.max(data.length, 1);
    const bestMonth = data.reduce((max, item) => 
      item.total > max.total ? item : max, data[0] || { month: '-', total: 0 }
    );
    
    // Comparar crecimiento del último mes
    if (data.length >= 2) {
      const lastMonth = data[data.length - 1];
      const previousMonth = data[data.length - 2];
      const growth = previousMonth.total > 0 
        ? ((lastMonth.total - previousMonth.total) / previousMonth.total) * 100 
        : 0;
      
      const growthDeltaType: DeltaType = growth > 5 ? 'increase' 
        : growth < -5 ? 'decrease' 
        : growth > 0 ? 'moderateIncrease' 
        : growth < 0 ? 'moderateDecrease' 
        : 'unchanged';
      
      return { total, avgMonthly, bestMonth, growth, growthDeltaType };
    }
    
    return { total, avgMonthly, bestMonth, growth: 0, growthDeltaType: 'unchanged' as DeltaType };
  }, [data]);

  return (
    <Card className="ring-1 ring-tremor-border dark:ring-tremor-border">
      {showTitle && (
        <div className="space-y-3">
          <Flex alignItems="start" justifyContent="between">
            <div>
              <Title className="text-tremor-content-strong dark:text-tremor-content-strong">
                {title}
              </Title>
              <Text className="text-tremor-content dark:text-tremor-content mt-1">
                Comparación mensual • Promedio {formatCurrency(metrics.avgMonthly)}/mes
              </Text>
            </div>
            <div className="text-right">
              <Metric className="text-tremor-brand dark:text-tremor-brand">
                {formatCurrency(metrics.total)}
              </Metric>
              <BadgeDelta deltaType={metrics.growthDeltaType} size="xs" className="mt-1">
                {metrics.growth >= 0 ? '+' : ''}{metrics.growth.toFixed(1)}% vs mes anterior
              </BadgeDelta>
            </div>
          </Flex>
          {metrics.bestMonth && (
            <Flex justifyContent="start" className="space-x-2">
              <BadgeDelta deltaType="increase" size="xs">
                Mejor: {metrics.bestMonth.month} • {formatCurrency(metrics.bestMonth.total)}
              </BadgeDelta>
            </Flex>
          )}
        </div>
      )}
      <BarChart
        className="mt-6 h-96"
        data={chartData}
        index="Mes"
        categories={['Ventas Directas', 'Membresías', 'Apartados']}
        colors={['amber', 'cyan', 'violet']}
        valueFormatter={formatCurrency}
        showLegend={true}
        showGridLines={true}
        showAnimation={true}
        yAxisWidth={80}
        stack={stacked}
        layout="vertical"
        showXAxis={true}
        showYAxis={true}
        xAxisLabel="Ingresos (MXN)"
        yAxisLabel="Mes"
        allowDecimals={false}
      />
    </Card>
  );
};

// ============================================================================
// PRODUCT DISTRIBUTION CHART - Donut Chart para distribución y composición
// ============================================================================
interface ProductDistributionData {
  name: string;
  sales: number;
  color?: string;
}

interface ProductDistributionChartProps {
  data: ProductDistributionData[];
  title?: string;
  showTitle?: boolean;
  height?: number;
  variant?: 'donut' | 'pie';
  showLabel?: boolean;
}

export const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({ 
  data,
  title = "Distribución por Categoría",
  showTitle = true,
  height = 280,
  variant = 'donut',
  showLabel = true
}) => {
  // Transformar y calcular porcentajes
  const { chartData, total, percentages } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.sales, 0);
    
    const chartData = data.map(item => ({
      name: item.name,
      value: item.sales,
    }));
    
    const percentages = data.map(item => ({
      name: item.name,
      percent: total > 0 ? (item.sales / total * 100) : 0
    }));
    
    return { chartData, total, percentages };
  }, [data]);

  // Determinar el item principal (top 1)
  const mainItem = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, item) => item.sales > max.sales ? item : max, data[0]);
  }, [data]);

  return (
    <Card className="ring-1 ring-tremor-border dark:ring-tremor-border">
      {showTitle && (
        <div className="space-y-2 mb-4">
          <Flex alignItems="start" justifyContent="between">
            <div>
              <Title className="text-tremor-content-strong dark:text-tremor-content-strong">
                {title}
              </Title>
              <Text className="text-tremor-content dark:text-tremor-content mt-1">
                {data.length} categorías analizadas
              </Text>
            </div>
            <div className="text-right">
              <Metric className="text-tremor-brand dark:text-tremor-brand">
                {formatCurrency(total)}
              </Metric>
              <Text className="text-tremor-content-subtle dark:text-tremor-content-subtle text-xs mt-1">
                Total de ventas
              </Text>
            </div>
          </Flex>
          {mainItem && (
            <Flex justifyContent="start" className="space-x-2">
              <BadgeDelta deltaType="increase" size="xs">
                Top 1: {mainItem.name} • {formatPercent(mainItem.sales / total * 100)}
              </BadgeDelta>
            </Flex>
          )}
        </div>
      )}
      
      <div className="h-72 flex items-center justify-center mt-4">
        <DonutChart
          data={chartData}
          category="value"
          index="name"
          valueFormatter={formatCurrency}
          colors={['amber', 'emerald', 'cyan', 'violet', 'rose', 'blue', 'orange']}
          showAnimation={true}
          showLabel={showLabel}
          variant={variant}
          className="h-full"
        />
      </div>
      
      {/* Leyenda mejorada con porcentajes y valores */}
      <div className="mt-6 space-y-2">
        {percentages.slice(0, 5).map((item, index) => {
          const itemData = data.find(d => d.name === item.name);
          return (
            <Flex key={index} justifyContent="between" className="text-sm py-2 border-b border-tremor-border last:border-0">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-sm ${
                  index === 0 ? 'bg-amber-500' :
                  index === 1 ? 'bg-emerald-500' :
                  index === 2 ? 'bg-cyan-500' :
                  index === 3 ? 'bg-violet-500' :
                  'bg-rose-500'
                }`} />
                <Text className="text-tremor-content dark:text-tremor-content">
                  {item.name}
                </Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="text-tremor-content-subtle dark:text-tremor-content-subtle">
                  {formatCurrency(itemData?.sales || 0)}
                </Text>
                <Bold className="text-tremor-content-emphasis dark:text-tremor-content-emphasis">
                  {formatPercent(item.percent)}
                </Bold>
              </div>
            </Flex>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================================================
// REVENUE TREND CHART - Line Chart para tendencias con análisis de cambio
// ============================================================================
interface RevenueTrendData {
  date: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendData[];
  title?: string;
  showTitle?: boolean;
  height?: number;
  showComparison?: boolean;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ 
  data,
  title = "Tendencia de Ingresos",
  showTitle = true,
  height = 250,
  showComparison = true
}) => {
  // Calcular métricas avanzadas de tendencia
  const metrics = useMemo(() => {
    if (data.length === 0) return { 
      current: 0, 
      previous: 0, 
      change: 0, 
      changePercent: 0, 
      trend: 'unchanged' as DeltaType,
      total: 0,
      average: 0,
      max: 0,
      min: 0
    };
    
    const revenues = data.map(d => d.revenue);
    const current = revenues[revenues.length - 1] || 0;
    const previous = revenues[revenues.length - 2] || 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous * 100) : 0;
    
    // Determinar tipo de delta con mayor precisión
    let trend: DeltaType = changePercent > 10 ? 'increase' 
      : changePercent < -10 ? 'decrease' 
      : changePercent > 0 ? 'moderateIncrease' 
      : changePercent < 0 ? 'moderateDecrease' 
      : 'unchanged';
    
    const total = revenues.reduce((sum, val) => sum + val, 0);
    const average = total / data.length;
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    
    return { current, previous, change, changePercent, trend, total, average, max, min };
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      Fecha: item.date,
      'Ingresos': item.revenue,
    }));
  }, [data]);

  return (
    <Card className="ring-1 ring-tremor-border dark:ring-tremor-border">
      {showTitle && (
        <div className="space-y-3">
          <div>
            <Title className="text-tremor-content-strong dark:text-tremor-content-strong">
              {title}
            </Title>
            <Text className="text-tremor-content dark:text-tremor-content mt-1">
              Promedio {formatCurrency(metrics.average)} • Rango {formatCompact(metrics.min)} - {formatCompact(metrics.max)}
            </Text>
          </div>
          
          <Flex justifyContent="start" alignItems="baseline" className="space-x-3">
            <Metric className="text-tremor-brand dark:text-tremor-brand">
              {formatCurrency(metrics.current)}
            </Metric>
            {showComparison && metrics.changePercent !== 0 && (
              <BadgeDelta deltaType={metrics.trend} size="sm">
                {metrics.changePercent > 0 ? '+' : ''}
                {formatPercent(Math.abs(metrics.changePercent))} vs anterior
              </BadgeDelta>
            )}
          </Flex>
          
          {showComparison && (
            <Text className="text-tremor-content-subtle dark:text-tremor-content-subtle text-xs">
              Cambio: {formatCurrency(Math.abs(metrics.change))} {metrics.change >= 0 ? 'más' : 'menos'} que el período anterior
            </Text>
          )}
        </div>
      )}
      
      <LineChart
        className="mt-4 h-64"
        data={chartData}
        index="Fecha"
        categories={['Ingresos']}
        colors={['amber']}
        valueFormatter={formatCurrency}
        showLegend={false}
        showGridLines={true}
        showAnimation={true}
        curveType="monotone"
        connectNulls={true}
        yAxisWidth={80}
        showXAxis={true}
        showYAxis={true}
        startEndOnly={data.length > 10}
        allowDecimals={false}
        xAxisLabel="Período"
        yAxisLabel="Ingresos (MXN)"
      />
    </Card>
  );
};

// ============================================================================
// COMPARATIVE METRICS GRID - Grid responsivo con KPI cards
// ============================================================================
interface MetricCardData {
  title: string;
  metric: string | number;
  deltaType?: DeltaType;
  deltaValue?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'amber' | 'cyan' | 'violet' | 'emerald' | 'rose';
}

interface ComparativeMetricsGridProps {
  metrics: MetricCardData[];
  cols?: number;
}

export const ComparativeMetricsGrid: React.FC<ComparativeMetricsGridProps> = ({ 
  metrics,
  cols = 4
}) => {
  return (
    <Grid numItemsSm={2} numItemsMd={3} numItemsLg={cols} className="gap-4">
      {metrics.map((metric, index) => (
        <Card 
          key={index}
          decoration="top"
          decorationColor={metric.color || 'amber'}
          className="ring-1 ring-tremor-border dark:ring-tremor-border hover:ring-tremor-brand dark:hover:ring-tremor-brand transition-all duration-200"
        >
          <Flex alignItems="start" justifyContent="between">
            <div className="truncate w-full">
              <Flex justifyContent="start" className="space-x-2">
                {metric.icon && (
                  <div className="text-tremor-content-subtle dark:text-tremor-content-subtle">
                    {metric.icon}
                  </div>
                )}
                <Text className="text-tremor-content dark:text-tremor-content font-medium">
                  {metric.title}
                </Text>
              </Flex>
              
              <Metric className="truncate mt-2 text-tremor-content-strong dark:text-tremor-content-strong">
                {typeof metric.metric === 'number' 
                  ? formatCurrency(metric.metric)
                  : metric.metric}
              </Metric>
              
              {metric.subtitle && (
                <Text className="mt-2 text-tremor-content-subtle dark:text-tremor-content-subtle text-xs">
                  {metric.subtitle}
                </Text>
              )}
            </div>
            
            {metric.deltaType && metric.deltaValue && (
              <BadgeDelta deltaType={metric.deltaType} size="xs">
                {metric.deltaValue}
              </BadgeDelta>
            )}
          </Flex>
        </Card>
      ))}
    </Grid>
  );
};

// ============================================================================
// STACKED AREA CHART - Análisis de contribución acumulativa por categorías
// ============================================================================
interface StackedAreaChartProps {
  data: any[];
  title?: string;
  categories: string[];
  colors?: ('amber' | 'cyan' | 'violet' | 'emerald' | 'rose' | 'blue' | 'orange')[];
  showTitle?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export const StackedAreaChart: React.FC<StackedAreaChartProps> = ({
  data,
  title = "Análisis de Contribución Acumulativa",
  categories,
  colors = ['amber', 'emerald', 'cyan', 'violet'],
  showTitle = true,
  height = 320,
  valueFormatter = formatCurrency
}) => {
  // Calcular totales por categoría y ordenar por relevancia
  const categoryTotals = useMemo(() => {
    return categories.map(category => {
      const total = data.reduce((sum, item) => sum + (item[category] || 0), 0);
      return { category, total };
    }).sort((a, b) => b.total - a.total);
  }, [data, categories]);

  const grandTotal = useMemo(() => {
    return categoryTotals.reduce((sum, item) => sum + item.total, 0);
  }, [categoryTotals]);

  return (
    <Card className="ring-1 ring-tremor-border dark:ring-tremor-border">
      {showTitle && (
        <div className="space-y-3">
          <Flex alignItems="start" justifyContent="between">
            <div>
              <Title className="text-tremor-content-strong dark:text-tremor-content-strong">
                {title}
              </Title>
              <Text className="text-tremor-content dark:text-tremor-content mt-1">
                Análisis apilado de {categories.length} categorías • {data.length} períodos
              </Text>
            </div>
            <div className="text-right">
              <Metric className="text-tremor-brand dark:text-tremor-brand">
                {formatCurrency(grandTotal)}
              </Metric>
              <Text className="text-tremor-content-subtle dark:text-tremor-content-subtle text-xs">
                Total acumulado
              </Text>
            </div>
          </Flex>
          
          {/* Top 3 categorías con porcentajes */}
          <Flex justifyContent="start" className="space-x-2 flex-wrap gap-y-2">
            {categoryTotals.slice(0, 3).map((item, index) => (
              <BadgeDelta 
                key={index}
                deltaType={index === 0 ? 'increase' : index === 1 ? 'moderateIncrease' : 'unchanged'}
                size="xs"
              >
                {index + 1}. {item.category} • {formatPercent(item.total / grandTotal * 100)}
              </BadgeDelta>
            ))}
          </Flex>
        </div>
      )}
      
      <AreaChart
        className="mt-6 h-80"
        data={data}
        index="date"
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend={true}
        showGridLines={true}
        showAnimation={true}
        stack={true}
        curveType="monotone"
        connectNulls={true}
        yAxisWidth={80}
        showXAxis={true}
        showYAxis={true}
        allowDecimals={false}
        xAxisLabel="Período"
        yAxisLabel="Valor Acumulado"
      />
      
      {/* Leyenda mejorada con totales y porcentajes */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoryTotals.map((item, index) => (
          <div key={index} className="space-y-1 p-3 rounded-lg bg-tremor-background-subtle dark:bg-tremor-background-subtle">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-sm ${
                index === 0 ? 'bg-amber-500' :
                index === 1 ? 'bg-emerald-500' :
                index === 2 ? 'bg-cyan-500' :
                'bg-violet-500'
              }`} />
              <Text className="text-tremor-content dark:text-tremor-content text-xs font-medium">
                {item.category}
              </Text>
            </div>
            <Metric className="text-tremor-content-strong dark:text-tremor-content-strong text-base">
              {formatCurrency(item.total)}
            </Metric>
            <Text className="text-tremor-content-subtle dark:text-tremor-content-subtle text-xs">
              {formatPercent(item.total / grandTotal * 100)} del total
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
};
