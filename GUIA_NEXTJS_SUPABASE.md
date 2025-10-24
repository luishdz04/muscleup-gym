# 🚀 GUÍA DE INTEGRACIÓN - Next.js + Supabase

## 📋 ÍNDICE
1. [Configuración Inicial](#configuración-inicial)
2. [Tipos TypeScript](#tipos-typescript)
3. [Queries Básicas](#queries-básicas)
4. [Componentes React](#componentes-react)
5. [Filtros Avanzados](#filtros-avanzados)
6. [Búsqueda y Autocomplete](#búsqueda-y-autocomplete)

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Cliente de Supabase (lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

---

## 📝 Tipos TypeScript

### Generar Tipos desde Supabase

```bash
# Instalar CLI de Supabase
npm install -g supabase

# Generar tipos
supabase gen types typescript --project-id "tu-project-id" > lib/database.types.ts
```

### Tipos Manuales (types/exercises.ts)

```typescript
export interface MuscleGroup {
  id: string
  name: string
  description: string
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  type: string
  primary_muscles: string[]
  secondary_muscles: string[]
  material: string
  level: string
  muscle_group_id: string
  initial_position: string
  execution_eccentric: string
  execution_isometric: string
  execution_concentric: string
  common_errors: string[]
  contraindications: string[]
  video_url?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExerciseVariant {
  id: string
  exercise_id: string
  type: 'Por disponibilidad' | 'Por seguridad'
  name: string
  description: string
}

export interface ExerciseWithGroup extends Exercise {
  muscle_groups: MuscleGroup
  exercise_variants?: ExerciseVariant[]
}
```

---

## 🔍 Queries Básicas

### 1. Obtener Todos los Grupos Musculares

```typescript
// app/actions/exercises.ts
'use server'

import { supabase } from '@/lib/supabase'

export async function getMuscleGroups() {
  const { data, error } = await supabase
    .from('muscle_groups')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}
```

### 2. Obtener Ejercicios por Grupo Muscular

```typescript
export async function getExercisesByMuscleGroup(muscleGroupId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      muscle_groups (
        id,
        name,
        description
      ),
      exercise_variants (
        id,
        type,
        name,
        description
      )
    `)
    .eq('muscle_group_id', muscleGroupId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data
}
```

### 3. Buscar Ejercicio por ID

```typescript
export async function getExerciseById(exerciseId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      muscle_groups (*),
      exercise_variants (*)
    `)
    .eq('id', exerciseId)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}
```

### 4. Obtener Estadísticas

```typescript
export async function getExerciseStats() {
  const { data, error } = await supabase
    .rpc('get_exercise_stats')
  
  if (error) throw error
  return data
}
```

---

## ⚛️ Componentes React

### 1. Lista de Grupos Musculares

```typescript
// components/MuscleGroupList.tsx
'use client'

import { useEffect, useState } from 'react'
import { getMuscleGroups } from '@/app/actions/exercises'
import { MuscleGroup } from '@/types/exercises'

export default function MuscleGroupList() {
  const [groups, setGroups] = useState<MuscleGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await getMuscleGroups()
        setGroups(data)
      } catch (error) {
        console.error('Error cargando grupos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {groups.map((group) => (
        <button
          key={group.id}
          className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          onClick={() => {/* Navegar a ejercicios */}}
        >
          <h3 className="font-bold">{group.name}</h3>
          <p className="text-sm mt-1 opacity-90">{group.description}</p>
        </button>
      ))}
    </div>
  )
}
```

### 2. Tarjeta de Ejercicio

```typescript
// components/ExerciseCard.tsx
import { ExerciseWithGroup } from '@/types/exercises'
import Link from 'next/link'

interface ExerciseCardProps {
  exercise: ExerciseWithGroup
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link 
      href={`/exercises/${exercise.id}`}
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {exercise.name}
        </h3>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {exercise.type}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-sm font-semibold text-gray-600">Nivel:</span>
          <span className="ml-2 text-sm text-gray-900">{exercise.level}</span>
        </div>
        
        <div>
          <span className="text-sm font-semibold text-gray-600">Material:</span>
          <span className="ml-2 text-sm text-gray-900">{exercise.material}</span>
        </div>

        <div>
          <span className="text-sm font-semibold text-gray-600">Primarios:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {exercise.primary_muscles.map((muscle, idx) => (
              <span 
                key={idx}
                className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {exercise.exercise_variants && exercise.exercise_variants.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {exercise.exercise_variants.length} variante(s) disponible(s)
          </span>
        </div>
      )}
    </Link>
  )
}
```

### 3. Detalle de Ejercicio

```typescript
// app/exercises/[id]/page.tsx
import { getExerciseById } from '@/app/actions/exercises'
import { notFound } from 'next/navigation'

export default async function ExerciseDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const exercise = await getExerciseById(params.id)
  
  if (!exercise) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {exercise.name}
        </h1>
        <div className="flex gap-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            {exercise.type}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            {exercise.level}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* Posición Inicial */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            ✨ Posición Inicial
          </h2>
          <p className="text-gray-700">{exercise.initial_position}</p>
        </section>

        {/* Ejecución */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            🎯 Ejecución
          </h2>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-800">Fase Excéntrica:</h3>
              <p className="text-gray-700">{exercise.execution_eccentric}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Fase Isométrica:</h3>
              <p className="text-gray-700">{exercise.execution_isometric}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Fase Concéntrica:</h3>
              <p className="text-gray-700">{exercise.execution_concentric}</p>
            </div>
          </div>
        </section>

        {/* Músculos */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            💪 Músculos Trabajados
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Primarios:</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.primary_muscles.map((muscle, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Secundarios:</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.secondary_muscles.map((muscle, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {muscle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Errores Comunes */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-gray-900">
            ⚠️ Errores Comunes
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {exercise.common_errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </section>

        {/* Contraindicaciones */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-red-600">
            🚫 Contraindicaciones
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {exercise.contraindications.map((contra, idx) => (
              <li key={idx}>{contra}</li>
            ))}
          </ul>
        </section>

        {/* Variantes */}
        {exercise.exercise_variants && exercise.exercise_variants.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3 text-gray-900">
              🔄 Variantes
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {exercise.exercise_variants.map((variant) => (
                <div 
                  key={variant.id}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {variant.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {variant.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{variant.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

---

## 🔍 Filtros Avanzados

### 1. Filtrar por Nivel y Material

```typescript
export async function getExercisesFiltered({
  level,
  material,
  muscleGroupId
}: {
  level?: string
  material?: string
  muscleGroupId?: string
}) {
  let query = supabase
    .from('exercises')
    .select('*, muscle_groups(*)')
    .eq('is_active', true)

  if (level) {
    query = query.ilike('level', `%${level}%`)
  }

  if (material) {
    query = query.ilike('material', `%${material}%`)
  }

  if (muscleGroupId) {
    query = query.eq('muscle_group_id', muscleGroupId)
  }

  const { data, error } = await query.order('name')
  
  if (error) throw error
  return data
}
```

### 2. Componente de Filtros

```typescript
// components/ExerciseFilters.tsx
'use client'

import { useState } from 'react'

export default function ExerciseFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    level: '',
    material: '',
  })

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nivel
        </label>
        <select
          value={filters.level}
          onChange={(e) => handleChange('level', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todos los niveles</option>
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Material
        </label>
        <select
          value={filters.material}
          onChange={(e) => handleChange('material', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todos</option>
          <option value="Peso corporal">Peso corporal</option>
          <option value="Mancuernas">Mancuernas</option>
          <option value="Barra">Barra</option>
          <option value="Máquina">Máquina</option>
          <option value="Cable">Cable</option>
        </select>
      </div>
    </div>
  )
}
```

---

## 🔎 Búsqueda y Autocomplete

### 1. Búsqueda de Texto Completo

```typescript
export async function searchExercises(searchTerm: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, muscle_groups(*)')
    .or(`name.ilike.%${searchTerm}%,primary_muscles.cs.{${searchTerm}}`)
    .eq('is_active', true)
    .limit(10)
  
  if (error) throw error
  return data
}
```

### 2. Componente de Búsqueda

```typescript
// components/ExerciseSearch.tsx
'use client'

import { useState, useEffect } from 'react'
import { searchExercises } from '@/app/actions/exercises'
import { ExerciseWithGroup } from '@/types/exercises'
import { useDebounce } from '@/hooks/useDebounce'

export default function ExerciseSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ExerciseWithGroup[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      return
    }

    async function search() {
      setLoading(true)
      try {
        const data = await searchExercises(debouncedQuery)
        setResults(data)
      } catch (error) {
        console.error('Error en búsqueda:', error)
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [debouncedQuery])

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ejercicios..."
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
          {results.map((exercise) => (
            <a
              key={exercise.id}
              href={`/exercises/${exercise.id}`}
              className="block p-4 hover:bg-gray-50 border-b border-gray-100"
            >
              <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {exercise.muscle_groups.name} • {exercise.level}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 3. Hook useDebounce

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

---

## 🎨 Estilos con Tailwind (Opcional)

```typescript
// components/ui/Badge.tsx
export function Badge({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

---

## 📱 Ejemplo Completo de Página

```typescript
// app/exercises/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getMuscleGroups, getExercisesFiltered } from '../actions/exercises'
import ExerciseCard from '@/components/ExerciseCard'
import ExerciseFilters from '@/components/ExerciseFilters'
import ExerciseSearch from '@/components/ExerciseSearch'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const muscleGroups = await getMuscleGroups()
      setGroups(muscleGroups)
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadExercises() {
      setLoading(true)
      try {
        const data = await getExercisesFiltered({
          muscleGroupId: selectedGroup,
          ...filters
        })
        setExercises(data)
      } finally {
        setLoading(false)
      }
    }
    loadExercises()
  }, [selectedGroup, filters])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Biblioteca de Ejercicios</h1>

      <div className="mb-8">
        <ExerciseSearch />
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <div>
              <h2 className="font-bold text-lg mb-3">Grupos Musculares</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedGroup('')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition ${
                    selectedGroup === '' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Todos
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition ${
                      selectedGroup === group.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {group.name}
                  </button>
                ))}
              </div>
            </div>

            <ExerciseFilters onFilterChange={setFilters} />
          </div>
        </aside>

        <main className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {exercises.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          )}

          {!loading && exercises.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No se encontraron ejercicios con los filtros seleccionados
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
```

---

## 🚀 ¡Listo!

Con estos ejemplos tienes todo lo necesario para integrar la Biblioteca MUPAI en tu aplicación Next.js con Supabase. 

**Próximos pasos sugeridos:**
1. Implementar favoritos de usuario
2. Crear rutinas personalizadas
3. Agregar sistema de progreso
4. Implementar análisis y estadísticas

¡Feliz coding! 💪🚀
