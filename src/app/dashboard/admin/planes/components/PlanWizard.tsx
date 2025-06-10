'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// ✅ INTERFAZ SEGÚN TU ESTRUCTURA DE SUPABASE
interface PlanData {
  nombre: string;
  descripcion: string;
  categoria: 'premium' | 'estandar' | 'basico' | 'promocional';
  color: string;
  icono: string;
  activo: boolean;
  precios: {
    [key: string]: {
      monto: number;
      moneda: string;
      descuento?: number;
    };
  };
  restricciones_horario: {
    dias_permitidos: string[];
    horario_inicio: string;
    horario_fin: string;
    restricciones_especiales?: string[];
  };
  vigencia: {
    tipo: 'ilimitada' | 'periodo' | 'visitas';
    duracion_dias?: number;
    numero_visitas?: number;
    renovacion_automatica: boolean;
  };
  caracteristicas: {
    incluidas: string[];
    limitaciones: string[];
    beneficios_especiales: string[];
  };
  promociones: {
    descuento_primer_mes?: number;
    meses_gratis?: number;
    precio_especial?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
}

interface PlanWizardProps {
  onSave: (data: PlanData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<PlanData>;
  mode?: 'create' | 'edit' | 'view';
}

const STEPS = [
  { id: 1, title: 'Información Básica', description: 'Nombre, categoría y apariencia' },
  { id: 2, title: 'Estructura de Precios', description: 'Modalidades y tarifas' },
  { id: 3, title: 'Horarios y Restricciones', description: 'Acceso y limitaciones' },
  { id: 4, title: 'Vigencia y Validez', description: 'Duración y renovación' },
  { id: 5, title: 'Características y Promociones', description: 'Beneficios y ofertas' },
  { id: 6, title: 'Resumen y Confirmación', description: 'Revisar toda la información' }
];

const CATEGORIAS = [
  { value: 'premium', label: 'Premium', color: '#FFD700', description: 'Plan exclusivo con todos los beneficios' },
  { value: 'estandar', label: 'Estándar', color: '#4A90E2', description: 'Plan equilibrado para la mayoría de usuarios' },
  { value: 'basico', label: 'Básico', color: '#7ED321', description: 'Plan básico para comenzar' },
  { value: 'promocional', label: 'Promocional', color: '#FF6B6B', description: 'Plan con ofertas especiales' }
];

const ICONOS = [
  'fitness_center', 'sports_gymnastics', 'pool', 'sports_martial_arts', 
  'sports_tennis', 'sports_soccer', 'sports_basketball', 'sports_volleyball',
  'self_improvement', 'directions_run', 'sports_handball', 'sports_hockey'
];

const MODALIDADES_PAGO = [
  { value: 'visita', label: 'Por Visita', descripcion: 'Pago individual por cada visita' },
  { value: 'semana', label: 'Semanal', descripcion: 'Acceso por una semana' },
  { value: 'quincena', label: 'Quincenal', descripcion: 'Acceso por dos semanas' },
  { value: 'mes', label: 'Mensual', descripcion: 'Acceso por un mes' },
  { value: 'bimestre', label: 'Bimestral', descripcion: 'Acceso por dos meses' },
  { value: 'trimestre', label: 'Trimestral', descripcion: 'Acceso por tres meses' },
  { value: 'cuatrimestre', label: 'Cuatrimestral', descripcion: 'Acceso por cuatro meses' },
  { value: 'semestre', label: 'Semestral', descripcion: 'Acceso por seis meses' },
  { value: 'anual', label: 'Anual', descripcion: 'Acceso por un año completo' }
];

const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
];

export function PlanWizard({ onSave, onCancel, initialData = {}, mode = 'create' }: PlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // ✅ ESTADO INICIAL SEGÚN TU ESTRUCTURA
  const [planData, setPlanData] = useState<PlanData>({
    nombre: initialData.nombre || '',
    descripcion: initialData.descripcion || '',
    categoria: initialData.categoria || 'estandar',
    color: initialData.color || '#ffcc00',
    icono: initialData.icono || 'fitness_center',
    activo: initialData.activo ?? true,
    precios: initialData.precios || {
      mes: { monto: 0, moneda: 'MXN' }
    },
    restricciones_horario: initialData.restricciones_horario || {
      dias_permitidos: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
      horario_inicio: '06:00',
      horario_fin: '22:00',
      restricciones_especiales: []
    },
    vigencia: initialData.vigencia || {
      tipo: 'periodo',
      duracion_dias: 30,
      renovacion_automatica: true
    },
    caracteristicas: initialData.caracteristicas || {
      incluidas: [],
      limitaciones: [],
      beneficios_especiales: []
    },
    promociones: initialData.promociones || {}
  });

  // Estados auxiliares
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState('');
  const [nuevaLimitacion, setNuevaLimitacion] = useState('');
  const [nuevoBeneficio, setNuevoBeneficio] = useState('');

  const isReadOnly = mode === 'view';
  const isEdit = mode === 'edit';

  // Actualizar datos cuando cambie initialData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setPlanData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        categoria: initialData.categoria || 'estandar',
        color: initialData.color || '#ffcc00',
        icono: initialData.icono || 'fitness_center',
        activo: initialData.activo ?? true,
        precios: initialData.precios || {
          mes: { monto: 0, moneda: 'MXN' }
        },
        restricciones_horario: initialData.restricciones_horario || {
          dias_permitidos: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
          horario_inicio: '06:00',
          horario_fin: '22:00',
          restricciones_especiales: []
        },
        vigencia: initialData.vigencia || {
          tipo: 'periodo',
          duracion_dias: 30,
          renovacion_automatica: true
        },
        caracteristicas: initialData.caracteristicas || {
          incluidas: [],
          limitaciones: [],
          beneficios_especiales: []
        },
        promociones: initialData.promociones || {}
      });
    }
  }, [initialData]);

  const updatePlanData = (field: keyof PlanData, value: any) => {
    setPlanData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const updateNestedData = (field: keyof PlanData, subfield: string, value: any) => {
    setPlanData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as any),
        [subfield]: value
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (!planData.nombre.trim()) {
          newErrors.nombre = 'El nombre del plan es requerido';
        } else if (planData.nombre.length < 3) {
          newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        }
        
        if (!planData.descripcion.trim()) {
          newErrors.descripcion = 'La descripción es requerida';
        } else if (planData.descripcion.length < 10) {
          newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres';
        }
        break;
        
      case 2:
        const tienePrecio = Object.values(planData.precios).some(precio => precio.monto > 0);
        if (!tienePrecio) {
          newErrors.precios = 'Debe configurar al menos un precio';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;
    
    try {
      setIsLoading(true);
      await onSave(planData);
      toast.success(isEdit ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente');
    } catch (error) {
      toast.error(isEdit ? 'Error al actualizar el plan' : 'Error al crear el plan');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isEdit || mode === 'create') {
      if (confirm('¿Estás seguro de que deseas cancelar? Se perderán todos los cambios.')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Funciones auxiliares
  const agregarCaracteristica = () => {
    if (nuevaCaracteristica.trim()) {
      const caracteristicasActuales = { ...planData.caracteristicas };
      caracteristicasActuales.incluidas = [...caracteristicasActuales.incluidas, nuevaCaracteristica.trim()];
      updatePlanData('caracteristicas', caracteristicasActuales);
      setNuevaCaracteristica('');
    }
  };

  const eliminarCaracteristica = (index: number) => {
    const caracteristicasActuales = { ...planData.caracteristicas };
    caracteristicasActuales.incluidas = caracteristicasActuales.incluidas.filter((_, i) => i !== index);
    updatePlanData('caracteristicas', caracteristicasActuales);
  };

  const agregarLimitacion = () => {
    if (nuevaLimitacion.trim()) {
      const caracteristicasActuales = { ...planData.caracteristicas };
      caracteristicasActuales.limitaciones = [...caracteristicasActuales.limitaciones, nuevaLimitacion.trim()];
      updatePlanData('caracteristicas', caracteristicasActuales);
      setNuevaLimitacion('');
    }
  };

  const eliminarLimitacion = (index: number) => {
    const caracteristicasActuales = { ...planData.caracteristicas };
    caracteristicasActuales.limitaciones = caracteristicasActuales.limitaciones.filter((_, i) => i !== index);
    updatePlanData('caracteristicas', caracteristicasActuales);
  };

  const agregarBeneficio = () => {
    if (nuevoBeneficio.trim()) {
      const caracteristicasActuales = { ...planData.caracteristicas };
      caracteristicasActuales.beneficios_especiales = [...caracteristicasActuales.beneficios_especiales, nuevoBeneficio.trim()];
      updatePlanData('caracteristicas', caracteristicasActuales);
      setNuevoBeneficio('');
    }
  };

  const eliminarBeneficio = (index: number) => {
    const caracteristicasActuales = { ...planData.caracteristicas };
    caracteristicasActuales.beneficios_especiales = caracteristicasActuales.beneficios_especiales.filter((_, i) => i !== index);
    updatePlanData('caracteristicas', caracteristicasActuales);
  };

  const actualizarPrecio = (modalidad: string, campo: 'monto' | 'moneda' | 'descuento', valor: any) => {
    const preciosActuales = { ...planData.precios };
    if (!preciosActuales[modalidad]) {
      preciosActuales[modalidad] = { monto: 0, moneda: 'MXN' };
    }
    preciosActuales[modalidad] = {
      ...preciosActuales[modalidad],
      [campo]: valor
    };
    updatePlanData('precios', preciosActuales);
  };

  const eliminarModalidadPrecio = (modalidad: string) => {
    const preciosActuales = { ...planData.precios };
    delete preciosActuales[modalidad];
    updatePlanData('precios', preciosActuales);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Nombre del Plan */}
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-white">
                Nombre del Plan *
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Plan Premium Muscle Up"
                value={planData.nombre}
                onChange={(e) => updatePlanData('nombre', e.target.value)}
                disabled={isReadOnly}
                className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400 disabled:opacity-50 ${
                  errors.nombre ? 'border-red-500' : ''
                }`}
              />
              {errors.nombre && (
                <p className="text-red-400 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>
            
            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-white">
                Descripción *
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Describe las características principales del plan..."
                value={planData.descripcion}
                onChange={(e) => updatePlanData('descripcion', e.target.value)}
                disabled={isReadOnly}
                rows={4}
                className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400 disabled:opacity-50 ${
                  errors.descripcion ? 'border-red-500' : ''
                }`}
              />
              {errors.descripcion && (
                <p className="text-red-400 text-sm mt-1">{errors.descripcion}</p>
              )}
              <p className="text-gray-400 text-sm">
                {planData.descripcion.length}/500 caracteres
              </p>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label className="text-white">Categoría del Plan *</Label>
              <div className="grid grid-cols-2 gap-4">
                {CATEGORIAS.map((categoria) => (
                  <div 
                    key={categoria.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      planData.categoria === categoria.value
                        ? 'border-yellow-400 bg-yellow-400 bg-opacity-10'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => !isReadOnly && updatePlanData('categoria', categoria.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoria.color }}
                      />
                      <div>
                        <div className="text-white font-medium">{categoria.label}</div>
                        <div className="text-gray-400 text-sm">{categoria.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Color e Ícono */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="color" className="text-white">
                  Color del Plan
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="color"
                    value={planData.color}
                    onChange={(e) => updatePlanData('color', e.target.value)}
                    disabled={isReadOnly}
                    className="w-12 h-10 rounded border border-gray-600 bg-gray-900 disabled:opacity-50"
                  />
                  <Input
                    value={planData.color}
                    onChange={(e) => updatePlanData('color', e.target.value)}
                    disabled={isReadOnly}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Ícono del Plan</Label>
                <select
                  value={planData.icono}
                  onChange={(e) => updatePlanData('icono', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
                >
                  {ICONOS.map(icono => (
                    <option key={icono} value={icono}>
                      {icono.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vista previa */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <Label className="text-white block mb-3">Vista Previa del Plan</Label>
              <div 
                className="p-4 rounded-lg border-2 transition-all"
                style={{ 
                  borderColor: planData.color,
                  backgroundColor: `${planData.color}15`
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: planData.color,
                      color: planData.color === '#ffffff' ? '#000000' : '#ffffff'
                    }}
                  >
                    {planData.icono.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{planData.nombre || 'Nombre del Plan'}</div>
                    <Badge 
                      className="text-xs"
                      style={{ 
                        backgroundColor: planData.color,
                        color: planData.color === '#ffffff' ? '#000000' : '#ffffff'
                      }}
                    >
                      {CATEGORIAS.find(c => c.value === planData.categoria)?.label}
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  {planData.descripcion || 'Descripción del plan aparecerá aquí...'}
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">💰 Estructura de Precios</h3>
                <p className="text-gray-400 text-sm">
                  Configura las diferentes modalidades de pago para tu plan
                </p>
              </div>
              {!isReadOnly && (
                <Button
                  onClick={() => {
                    const modalidadesDisponibles = MODALIDADES_PAGO.filter(
                      m => !planData.precios[m.value]
                    );
                    if (modalidadesDisponibles.length > 0) {
                      const nuevaModalidad = modalidadesDisponibles[0].value;
                      actualizarPrecio(nuevaModalidad, 'monto', 0);
                    }
                  }}
                  disabled={Object.keys(planData.precios).length >= MODALIDADES_PAGO.length}
                  className="bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Agregar Modalidad
                </Button>
              )}
            </div>

            {errors.precios && (
              <div className="bg-red-900 border border-red-500 rounded-lg p-4">
                <div className="flex items-center">
                  <InformationCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-400">{errors.precios}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(planData.precios).map(([modalidad, precio]) => {
                const modalidadInfo = MODALIDADES_PAGO.find(m => m.value === modalidad);
                return (
                  <Card key={modalidad} className="bg-gray-800 border-gray-600">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-white text-lg">
                            {modalidadInfo?.label || modalidad}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {modalidadInfo?.descripcion}
                          </CardDescription>
                        </div>
                        {!isReadOnly && Object.keys(planData.precios).length > 1 && (
                          <Button
                            onClick={() => eliminarModalidadPrecio(modalidad)}
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white">Monto *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={precio.monto || ''}
                              onChange={(e) => actualizarPrecio(modalidad, 'monto', parseFloat(e.target.value) || 0)}
                              disabled={isReadOnly}
                              className="pl-8 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Moneda</Label>
                          <select
                            value={precio.moneda}
                            onChange={(e) => actualizarPrecio(modalidad, 'moneda', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-400 focus:outline-none"
                          >
                            <option value="MXN">MXN - Peso Mexicano</option>
                            <option value="USD">USD - Dólar Americano</option>
                            <option value="EUR">EUR - Euro</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Descuento (opcional)</Label>
                        <div className="relative">
                          <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="100"
                            value={precio.descuento || ''}
                            onChange={(e) => actualizarPrecio(modalidad, 'descuento', parseFloat(e.target.value) || 0)}
                            disabled={isReadOnly}
                            className="pr-8 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                          />
                        </div>
                        {precio.descuento && precio.descuento > 0 && (
                          <div className="text-sm text-yellow-400">
                            Precio con descuento: ${((precio.monto || 0) * (1 - (precio.descuento || 0) / 100)).toFixed(2)} {precio.moneda}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {Object.keys(planData.precios).length === 0 && (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No hay modalidades de precio configuradas</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">⏰ Horarios y Restricciones</h3>
              <p className="text-gray-400 text-sm">
                Define cuándo y cómo pueden acceder los usuarios con este plan
              </p>
            </div>

            {/* Días permitidos */}
            <div className="space-y-3">
              <Label className="text-white">Días de la semana permitidos</Label>
              <div className="grid grid-cols-7 gap-2">
                {DIAS_SEMANA.map((dia) => (
                  <div
                    key={dia.value}
                    className={`p-3 text-center rounded-lg cursor-pointer transition-all border-2 ${
                      planData.restricciones_horario.dias_permitidos.includes(dia.value)
                        ? 'bg-yellow-400 text-black border-yellow-400'
                        : 'bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => {
                      if (isReadOnly) return;
                      const diasActuales = [...planData.restricciones_horario.dias_permitidos];
                      const index = diasActuales.indexOf(dia.value);
                      if (index > -1) {
                        diasActuales.splice(index, 1);
                      } else {
                        diasActuales.push(dia.value);
                      }
                      updateNestedData('restricciones_horario', 'dias_permitidos', diasActuales);
                    }}
                  >
                    <div className="text-xs font-medium">{dia.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Hora de inicio</Label>
                <Input
                  type="time"
                  value={planData.restricciones_horario.horario_inicio}
                  onChange={(e) => updateNestedData('restricciones_horario', 'horario_inicio', e.target.value)}
                  disabled={isReadOnly}
                  className="bg-gray-900 border-gray-700 text-white focus:border-yellow-400"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Hora de fin</Label>
                <Input
                  type="time"
                  value={planData.restricciones_horario.horario_fin}
                  onChange={(e) => updateNestedData('restricciones_horario', 'horario_fin', e.target.value)}
                  disabled={isReadOnly}
                  className="bg-gray-900 border-gray-700 text-white focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Restricciones especiales */}
            <div className="space-y-3">
              <Label className="text-white">Restricciones especiales (opcional)</Label>
              <div className="space-y-2">
                {planData.restricciones_horario.restricciones_especiales?.map((restriccion, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <span className="text-white">{restriccion}</span>
                    {!isReadOnly && (
                      <Button
                        onClick={() => {
                          const restriccionesActuales = [...(planData.restricciones_horario.restricciones_especiales || [])];
                          restriccionesActuales.splice(index, 1);
                          updateNestedData('restricciones_horario', 'restricciones_especiales', restriccionesActuales);
                        }}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {!isReadOnly && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: No se permite el acceso en días festivos"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          const restriccionesActuales = [...(planData.restricciones_horario.restricciones_especiales || [])];
                          restriccionesActuales.push(e.currentTarget.value.trim());
                          updateNestedData('restricciones_horario', 'restricciones_especiales', restriccionesActuales);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                        if (input?.value.trim()) {
                          const restriccionesActuales = [...(planData.restricciones_horario.restricciones_especiales || [])];
                          restriccionesActuales.push(input.value.trim());
                          updateNestedData('restricciones_horario', 'restricciones_especiales', restriccionesActuales);
                          input.value = '';
                        }
                      }}
                      className="bg-yellow-400 text-black hover:bg-yellow-500"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen visual */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <Label className="text-white block mb-3">Resumen de Restricciones</Label>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  <span className="text-yellow-400">Días permitidos:</span> {
                    planData.restricciones_horario.dias_permitidos.length === 7 
                      ? 'Todos los días'
                      : planData.restricciones_horario.dias_permitidos.map(dia => 
                          DIAS_SEMANA.find(d => d.value === dia)?.label
                        ).join(', ')
                  }
                </div>
                <div className="text-gray-300">
                  <span className="text-yellow-400">Horario:</span> {planData.restricciones_horario.horario_inicio} - {planData.restricciones_horario.horario_fin}
                </div>
                {planData.restricciones_horario.restricciones_especiales && planData.restricciones_horario.restricciones_especiales.length > 0 && (
                  <div className="text-gray-300">
                    <span className="text-yellow-400">Restricciones:</span> {planData.restricciones_horario.restricciones_especiales.length} configurada(s)
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">📅 Vigencia y Validez</h3>
              <p className="text-gray-400 text-sm">
                Configure la duración y renovación del plan
              </p>
            </div>

            {/* Tipo de vigencia */}
            <div className="space-y-3">
              <Label className="text-white">Tipo de vigencia</Label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'ilimitada', label: 'Ilimitada', description: 'Sin fecha de vencimiento' },
                  { value: 'periodo', label: 'Por período', description: 'Vence después de X días' },
                  { value: 'visitas', label: 'Por visitas', description: 'Vence después de X visitas' }
                ].map((tipo) => (
                  <div
                    key={tipo.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      planData.vigencia.tipo === tipo.value
                        ? 'border-yellow-400 bg-yellow-400 bg-opacity-10'
                        : 'border-gray-600 hover:border-gray-500'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => !isReadOnly && updateNestedData('vigencia', 'tipo', tipo.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        planData.vigencia.tipo === tipo.value ? 'bg-yellow-400 border-yellow-400' : 'border-gray-400'
                      }`} />
                      <div>
                        <div className="text-white font-medium">{tipo.label}</div>
                        <div className="text-gray-400 text-sm">{tipo.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración específica */}
            {planData.vigencia.tipo === 'periodo' && (
              <div className="space-y-2">
                <Label className="text-white">Duración en días</Label>
                <Input
                  type="number"
                  placeholder="30"
                  min="1"
                  value={planData.vigencia.duracion_dias || ''}
                  onChange={(e) => updateNestedData('vigencia', 'duracion_dias', parseInt(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
              </div>
            )}

            {planData.vigencia.tipo === 'visitas' && (
              <div className="space-y-2">
                <Label className="text-white">Número de visitas</Label>
                <Input
                  type="number"
                  placeholder="10"
                  min="1"
                  value={planData.vigencia.numero_visitas || ''}
                  onChange={(e) => updateNestedData('vigencia', 'numero_visitas', parseInt(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
              </div>
            )}

            {/* Renovación automática */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div>
                <Label className="text-white font-medium">Renovación automática</Label>
                <p className="text-gray-400 text-sm">El plan se renovará automáticamente al vencer</p>
              </div>
              <Switch
                checked={planData.vigencia.renovacion_automatica}
                onCheckedChange={(checked) => updateNestedData('vigencia', 'renovacion_automatica', checked)}
                disabled={isReadOnly}
                className="data-[state=checked]:bg-yellow-400"
              />
            </div>

            {/* Resumen */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <Label className="text-white block mb-3">Resumen de Vigencia</Label>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">
                  <span className="text-yellow-400">Tipo:</span> {
                    planData.vigencia.tipo === 'ilimitada' ? 'Sin vencimiento' :
                    planData.vigencia.tipo === 'periodo' ? `${planData.vigencia.duracion_dias || 0} días` :
                    `${planData.vigencia.numero_visitas || 0} visitas`
                  }
                </div>
                <div className="text-gray-300">
                  <span className="text-yellow-400">Renovación:</span> {
                    planData.vigencia.renovacion_automatica ? 'Automática' : 'Manual'
                  }
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">🎯 Características y Promociones</h3>
              <p className="text-gray-400 text-sm">
                Define qué incluye el plan y las promociones especiales
              </p>
            </div>

            {/* Características incluidas */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-white">✅ Características incluidas</Label>
                {!isReadOnly && (
                  <Button
                    onClick={agregarCaracteristica}
                    disabled={!nuevaCaracteristica.trim()}
                    size="sm"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>
              
              {!isReadOnly && (
                <Input
                  placeholder="Ej: Acceso completo a máquinas de cardio"
                  value={nuevaCaracteristica}
                  onChange={(e) => setNuevaCaracteristica(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarCaracteristica()}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
              )}
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {planData.caracteristicas.incluidas.map((caracteristica, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                      <span className="text-white">{caracteristica}</span>
                    </div>
                    {!isReadOnly && (
                      <Button
                        onClick={() => eliminarCaracteristica(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Limitaciones */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-white">❌ Limitaciones</Label>
                {!isReadOnly && (
                  <Button
                    onClick={agregarLimitacion}
                    disabled={!nuevaLimitacion.trim()}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>
              
              {!isReadOnly && (
                <Input
                  placeholder="Ej: No incluye acceso a área VIP"
                  value={nuevaLimitacion}
                  onChange={(e) => setNuevaLimitacion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarLimitacion()}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
              )}
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {planData.caracteristicas.limitaciones.map((limitacion, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center">
                      <XMarkIcon className="w-5 h-5 text-red-400 mr-3" />
                      <span className="text-white">{limitacion}</span>
                    </div>
                    {!isReadOnly && (
                      <Button
                        onClick={() => eliminarLimitacion(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficios especiales */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-white">⭐ Beneficios especiales</Label>
                {!isReadOnly && (
                  <Button
                    onClick={agregarBeneficio}
                    disabled={!nuevoBeneficio.trim()}
                    size="sm"
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>
              
              {!isReadOnly && (
                <Input
                  placeholder="Ej: Descuento en suplementos"
                  value={nuevoBeneficio}
                  onChange={(e) => setNuevoBeneficio(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarBeneficio()}
                  className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
              )}
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {planData.caracteristicas.beneficios_especiales.map((beneficio, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center">
                      <StarIcon className="w-5 h-5 text-yellow-400 mr-3" />
                      <span className="text-white">{beneficio}</span>
                    </div>
                    {!isReadOnly && (
                      <Button
                        onClick={() => eliminarBeneficio(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Promociones */}
            <div className="space-y-4">
              <Label className="text-white text-lg">🎁 Promociones (opcional)</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Descuento primer mes (%)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={planData.promociones.descuento_primer_mes || ''}
                    onChange={(e) => updateNestedData('promociones', 'descuento_primer_mes', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Meses gratis</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={planData.promociones.meses_gratis || ''}
                    onChange={(e) => updateNestedData('promociones', 'meses_gratis', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Precio especial</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={planData.promociones.precio_especial || ''}
                    onChange={(e) => updateNestedData('promociones', 'precio_especial', parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="pl-8 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Fecha inicio promoción</Label>
                  <Input
                    type="date"
                    value={planData.promociones.fecha_inicio || ''}
                    onChange={(e) => updateNestedData('promociones', 'fecha_inicio', e.target.value)}
                    disabled={isReadOnly}
                    className="bg-gray-900 border-gray-700 text-white focus:border-yellow-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white">Fecha fin promoción</Label>
                  <Input
                    type="date"
                    value={planData.promociones.fecha_fin || ''}
                    onChange={(e) => updateNestedData('promociones', 'fecha_fin', e.target.value)}
                    disabled={isReadOnly}
                    className="bg-gray-900 border-gray-700 text-white focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {isReadOnly ? 'Detalles del Plan' : 'Resumen y Confirmación'}
              </h3>
              <p className="text-gray-400">
                {isReadOnly ? 'Información completa del plan' : 'Revisa toda la información antes de guardar'}
              </p>
            </div>

            <Card className="bg-gray-800 border-gray-600">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{ 
                        backgroundColor: planData.color,
                        color: planData.color === '#ffffff' ? '#000000' : '#ffffff'
                      }}
                    >
                      {planData.icono.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{planData.nombre}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        <Badge 
                          style={{ 
                            backgroundColor: planData.color,
                            color: planData.color === '#ffffff' ? '#000000' : '#ffffff'
                          }}
                        >
                          {CATEGORIAS.find(c => c.value === planData.categoria)?.label}
                        </Badge>
                        {planData.activo && (
                          <Badge className="bg-green-600 text-white">✅ Activo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-gray-400 mt-3">
                  {planData.descripcion}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Precios */}
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Precios
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(planData.precios).map(([modalidad, precio]) => {
                      const modalidadInfo = MODALIDADES_PAGO.find(m => m.value === modalidad);
                      return (
                        <div key={modalidad} className="bg-gray-900 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">{modalidadInfo?.label}:</span>
                            <div className="text-right">
                              <span className="text-white font-medium">
                                ${precio.monto} {precio.moneda}
                              </span>
                              {precio.descuento && precio.descuento > 0 && (
                                <div className="text-yellow-400 text-xs">
                                  -{precio.descuento}% desc.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Horarios */}
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Horarios y Acceso
                  </h4>
                  <div className="bg-gray-900 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Días permitidos:</span>
                      <span className="text-white text-sm">
                        {planData.restricciones_horario.dias_permitidos.length === 7 
                          ? 'Todos los días'
                          : `${planData.restricciones_horario.dias_permitidos.length} días`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horario:</span>
                      <span className="text-white text-sm">
                        {planData.restricciones_horario.horario_inicio} - {planData.restricciones_horario.horario_fin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vigencia */}
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Vigencia
                  </h4>
                  <div className="bg-gray-900 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo:</span>
                      <span className="text-white text-sm">
                        {planData.vigencia.tipo === 'ilimitada' ? 'Sin vencimiento' :
                         planData.vigencia.tipo === 'periodo' ? `${planData.vigencia.duracion_dias || 0} días` :
                         `${planData.vigencia.numero_visitas || 0} visitas`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Renovación:</span>
                      <span className="text-white text-sm">
                        {planData.vigencia.renovacion_automatica ? 'Automática' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Características */}
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <TagIcon className="w-5 h-5 mr-2" />
                    Características
                  </h4>
                  <div className="space-y-3">
                    {planData.caracteristicas.incluidas.length > 0 && (
                      <div>
                        <div className="text-green-400 text-sm font-medium mb-2">✅ Incluidas ({planData.caracteristicas.incluidas.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {planData.caracteristicas.incluidas.slice(0, 4).map((caracteristica, index) => (
                            <div key={index} className="flex items-center text-sm">
                              <CheckIcon className="w-4 h-4 text-green-400 mr-2" />
                              <span className="text-gray-300">{caracteristica}</span>
                            </div>
                          ))}
                          {planData.caracteristicas.incluidas.length > 4 && (
                            <div className="text-gray-400 text-sm">
                              +{planData.caracteristicas.incluidas.length - 4} más...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {planData.caracteristicas.limitaciones.length > 0 && (
                      <div>
                        <div className="text-red-400 text-sm font-medium mb-2">❌ Limitaciones ({planData.caracteristicas.limitaciones.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {planData.caracteristicas.limitaciones.slice(0, 2).map((limitacion, index) => (
                                                        <div key={index} className="flex items-center text-sm">
                                                        <XMarkIcon className="w-4 h-4 text-red-400 mr-2" />
                                                        <span className="text-gray-300">{limitacion}</span>
                                                      </div>
                                                    ))}
                                                    {planData.caracteristicas.limitaciones.length > 2 && (
                                                      <div className="text-gray-400 text-sm">
                                                        +{planData.caracteristicas.limitaciones.length - 2} más...
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                          
                                              {planData.caracteristicas.beneficios_especiales.length > 0 && (
                                                <div>
                                                  <div className="text-yellow-400 text-sm font-medium mb-2">⭐ Beneficios especiales ({planData.caracteristicas.beneficios_especiales.length})</div>
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {planData.caracteristicas.beneficios_especiales.slice(0, 2).map((beneficio, index) => (
                                                      <div key={index} className="flex items-center text-sm">
                                                        <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                                                        <span className="text-gray-300">{beneficio}</span>
                                                      </div>
                                                    ))}
                                                    {planData.caracteristicas.beneficios_especiales.length > 2 && (
                                                      <div className="text-gray-400 text-sm">
                                                        +{planData.caracteristicas.beneficios_especiales.length - 2} más...
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                          
                                          {/* Promociones */}
                                          {(planData.promociones.descuento_primer_mes || planData.promociones.meses_gratis || planData.promociones.precio_especial) && (
                                            <div>
                                              <h4 className="font-semibold text-white mb-3 flex items-center">
                                                🎁 Promociones Activas
                                              </h4>
                                              <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/30 p-3 rounded-lg space-y-2">
                                                {planData.promociones.descuento_primer_mes && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Descuento primer mes:</span>
                                                    <span className="text-yellow-400 font-medium">{planData.promociones.descuento_primer_mes}%</span>
                                                  </div>
                                                )}
                                                {planData.promociones.meses_gratis && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Meses gratis:</span>
                                                    <span className="text-yellow-400 font-medium">{planData.promociones.meses_gratis}</span>
                                                  </div>
                                                )}
                                                {planData.promociones.precio_especial && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Precio especial:</span>
                                                    <span className="text-yellow-400 font-medium">${planData.promociones.precio_especial}</span>
                                                  </div>
                                                )}
                                                {planData.promociones.fecha_inicio && planData.promociones.fecha_fin && (
                                                  <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Vigencia:</span>
                                                    <span className="text-gray-400">
                                                      {new Date(planData.promociones.fecha_inicio).toLocaleDateString()} - {new Date(planData.promociones.fecha_fin).toLocaleDateString()}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                          
                                      {/* Estado del plan */}
                                      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                                        <div>
                                          <Label className="text-white font-medium">Estado del Plan</Label>
                                          <p className="text-gray-400 text-sm">El plan estará {planData.activo ? 'disponible' : 'oculto'} para los usuarios</p>
                                        </div>
                                        <Switch
                                          checked={planData.activo}
                                          onCheckedChange={(checked) => updatePlanData('activo', checked)}
                                          disabled={isReadOnly}
                                          className="data-[state=checked]:bg-yellow-400"
                                        />
                                      </div>
                                    </div>
                                  );
                          
                                default:
                                  return null;
                              }
                            };
                          
                            return (
                              <div className="min-h-screen bg-black py-8">
                                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                                  {/* Progress Bar */}
                                  <div className="mb-8">
                                    <div className="flex items-center justify-between mb-4">
                                      <h2 className="text-2xl font-bold text-white">
                                        {mode === 'view' ? 'Ver Plan' : mode === 'edit' ? 'Editar Plan' : 'Crear Nuevo Plan'}
                                      </h2>
                                      <div className="text-yellow-400 font-medium">
                                        {mode === 'view' ? 'Solo lectura' : `${Math.round((currentStep / STEPS.length) * 100)}% Completado`}
                                      </div>
                                    </div>
                                    
                                    <div className="relative">
                                      <div className="flex items-center justify-between mb-2">
                                        {STEPS.map((step, index) => (
                                          <div key={step.id} className="flex flex-col items-center">
                                            <div
                                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                                                step.id <= currentStep
                                                  ? 'bg-yellow-400 text-black border-yellow-400'
                                                  : 'bg-gray-900 text-gray-400 border-gray-600'
                                              }`}
                                            >
                                              {step.id < currentStep ? (
                                                <CheckIcon className="w-5 h-5" />
                                              ) : (
                                                step.id
                                              )}
                                            </div>
                                            <div className="mt-2 text-center">
                                              <div className={`text-xs font-medium ${
                                                step.id <= currentStep ? 'text-yellow-400' : 'text-gray-400'
                                              }`}>
                                                {step.title}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1 max-w-24">
                                                {step.description}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-700 -z-10">
                                        <div 
                                          className="h-full bg-yellow-400 transition-all duration-300"
                                          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                          
                                  {/* Step Content */}
                                  <Card className="bg-gray-900 border-gray-700">
                                    <CardHeader>
                                      <CardTitle className="text-white">{STEPS[currentStep - 1].title}</CardTitle>
                                      <CardDescription className="text-gray-400">
                                        {STEPS[currentStep - 1].description}
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      {renderStepContent()}
                                    </CardContent>
                                  </Card>
                          
                                  {/* Navigation Buttons */}
                                  <div className="flex justify-between mt-8">
                                    <div className="flex gap-3">
                                      <Button
                                        onClick={handleCancel}
                                        variant="outline"
                                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                                      >
                                        {isReadOnly ? 'Cerrar' : 'Cancelar'}
                                      </Button>
                                      
                                      {currentStep > 1 && !isReadOnly && (
                                        <Button
                                          onClick={prevStep}
                                          variant="outline"
                                          className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                                        >
                                          <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                          Anterior
                                        </Button>
                                      )}
                                    </div>
                          
                                    <div>
                                      {isReadOnly ? (
                                        currentStep < STEPS.length && (
                                          <Button
                                            onClick={nextStep}
                                            className="bg-yellow-400 text-black hover:bg-yellow-500"
                                          >
                                            Siguiente
                                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                                          </Button>
                                        )
                                      ) : currentStep < STEPS.length ? (
                                        <Button
                                          onClick={nextStep}
                                          className="bg-yellow-400 text-black hover:bg-yellow-500"
                                          disabled={Object.keys(errors).length > 0}
                                        >
                                          Siguiente
                                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                                        </Button>
                                      ) : (
                                        <Button
                                          onClick={handleSave}
                                          disabled={isLoading}
                                          className="bg-yellow-400 text-black hover:bg-yellow-500"
                                        >
                                          {isLoading ? 'Guardando...' : isEdit ? 'Actualizar Plan' : 'Crear Plan'}
                                          <CheckIcon className="w-4 h-4 ml-2" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }