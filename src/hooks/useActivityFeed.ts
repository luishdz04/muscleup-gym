
'use client';

import { useState, useCallback } from 'react';

export interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'file_uploaded' | 'login' | 'system';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const useActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // ➕ AGREGAR NUEVA ACTIVIDAD
  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setActivities(prev => [newActivity, ...prev].slice(0, 100)); // Máximo 100 actividades
  }, []);

  // 🔍 FILTRAR ACTIVIDADES
  const getActivitiesByType = useCallback((type: Activity['type']) => {
    return activities.filter(activity => activity.type === type);
  }, [activities]);

  // 🔍 OBTENER ACTIVIDADES DE USUARIO
  const getActivitiesByUser = useCallback((userId: string) => {
    return activities.filter(activity => activity.userId === userId);
  }, [activities]);

  // 🧹 LIMPIAR ACTIVIDADES ANTIGUAS
  const clearOldActivities = useCallback((daysOld: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    setActivities(prev => 
      prev.filter(activity => activity.timestamp >= cutoffDate)
    );
  }, []);

  // 📊 ESTADÍSTICAS DE ACTIVIDADES
  const getActivityStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    return {
      total: activities.length,
      today: activities.filter(a => a.timestamp >= today).length,
      thisWeek: activities.filter(a => a.timestamp >= thisWeek).length,
      byType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [activities]);

  // 🎯 HELPERS PARA CREAR ACTIVIDADES COMUNES
  const logUserActivity = useCallback((
    type: 'user_created' | 'user_updated' | 'user_deleted',
    userName: string,
    userId: string,
    details?: string
  ) => {
    const titles = {
      user_created: 'Usuario creado',
      user_updated: 'Usuario actualizado', 
      user_deleted: 'Usuario eliminado',
    };

    const descriptions = {
      user_created: `Se creó el usuario ${userName}`,
      user_updated: `Se actualizó la información de ${userName}`,
      user_deleted: `Se eliminó el usuario ${userName}`,
    };

    addActivity({
      type,
      title: titles[type],
      description: details || descriptions[type],
      userId,
      userName,
      metadata: { userName, details },
    });
  }, [addActivity]);

  const logFileActivity = useCallback((fileName: string, userId: string, userName: string) => {
    addActivity({
      type: 'file_uploaded',
      title: 'Archivo subido',
      description: `${userName} subió el archivo ${fileName}`,
      userId,
      userName,
      metadata: { fileName },
    });
  }, [addActivity]);

  const logSystemActivity = useCallback((title: string, description: string) => {
    addActivity({
      type: 'system',
      title,
      description,
      metadata: { source: 'system' },
    });
  }, [addActivity]);

  return {
    // Estado
    activities,
    loading,

    // Acciones básicas
    addActivity,
    clearOldActivities,

    // Filtros
    getActivitiesByType,
    getActivitiesByUser,
    getActivityStats,

    // Helpers específicos
    logUserActivity,
    logFileActivity,
    logSystemActivity,
  };
}