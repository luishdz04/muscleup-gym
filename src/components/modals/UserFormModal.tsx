// ===================================================================
// services/activityService.ts - Service para registro de actividades
// ===================================================================

export interface ActivityLogData {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'file_uploaded' | 'login' | 'system';
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLog extends ActivityLogData {
  id: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

class ActivityService {
  private activities: ActivityLog[] = [];

  // 📝 REGISTRAR NUEVA ACTIVIDAD
  async logActivity(activityData: ActivityLogData): Promise<ApiResponse<ActivityLog>> {
    try {
      const activity: ActivityLog = {
        ...activityData,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
      };

      // 💾 AGREGAR A ALMACENAMIENTO LOCAL (en producción sería BD)
      this.activities.unshift(activity);
      
      // 🧹 MANTENER SOLO LAS ÚLTIMAS 1000 ACTIVIDADES
      if (this.activities.length > 1000) {
        this.activities = this.activities.slice(0, 1000);
      }

      // 💾 PERSISTIR EN ALMACENAMIENTO LOCAL NAVEGADOR
      try {
        localStorage.setItem('userActivities', JSON.stringify(this.activities.slice(0, 100)));
      } catch (error) {
        console.warn('No se pudo guardar en localStorage:', error);
      }

      return {
        success: true,
        data: activity,
        message: 'Actividad registrada',
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al registrar actividad',
      };
    }
  }

  // 📋 OBTENER ACTIVIDADES RECIENTES
  async getRecentActivities(limit: number = 50): Promise<ApiResponse<ActivityLog[]>> {
    try {
      // 🔄 CARGAR DESDE ALMACENAMIENTO LOCAL AL INICIO
      if (this.activities.length === 0) {
        try {
          const stored = localStorage.getItem('userActivities');
          if (stored) {
            const parsedActivities = JSON.parse(stored);
            this.activities = parsedActivities.map((a: any) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            }));
          }
        } catch (error) {
          console.warn('Error al cargar actividades desde localStorage:', error);
        }
      }

      const recentActivities = this.activities.slice(0, limit);

      return {
        success: true,
        data: recentActivities,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al obtener actividades',
      };
    }
  }

  // 🔍 FILTRAR ACTIVIDADES POR TIPO
  async getActivitiesByType(type: ActivityLogData['type']): Promise<ApiResponse<ActivityLog[]>> {
    try {
      const filteredActivities = this.activities.filter(activity => activity.type === type);

      return {
        success: true,
        data: filteredActivities,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al filtrar actividades',
      };
    }
  }

  // 👤 OBTENER ACTIVIDADES DE USUARIO ESPECÍFICO
  async getUserActivities(userId: string): Promise<ApiResponse<ActivityLog[]>> {
    try {
      const userActivities = this.activities.filter(activity => activity.userId === userId);

      return {
        success: true,
        data: userActivities,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al obtener actividades del usuario',
      };
    }
  }

  // 📊 OBTENER ESTADÍSTICAS DE ACTIVIDADES
  async getActivityStats(): Promise<ApiResponse<{
    total: number;
    today: number;
    thisWeek: number;
    byType: Record<string, number>;
  }>> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      const stats = {
        total: this.activities.length,
        today: this.activities.filter(a => a.timestamp >= today).length,
        thisWeek: this.activities.filter(a => a.timestamp >= thisWeek).length,
        byType: this.activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return {
        success: true,
        data: stats,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al obtener estadísticas',
      };
    }
  }

  // 🌐 OBTENER IP DEL CLIENTE (helper privado)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // 🧹 LIMPIAR ACTIVIDADES ANTIGUAS
  async cleanupOldActivities(daysOld: number = 30): Promise<ApiResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const initialCount = this.activities.length;
      this.activities = this.activities.filter(activity => activity.timestamp >= cutoffDate);
      const removedCount = initialCount - this.activities.length;

      // 💾 ACTUALIZAR ALMACENAMIENTO LOCAL
      try {
        localStorage.setItem('userActivities', JSON.stringify(this.activities.slice(0, 100)));
      } catch (error) {
        console.warn('No se pudo actualizar localStorage:', error);
      }

      return {
        success: true,
        data: removedCount,
        message: `${removedCount} actividades antiguas eliminadas`,
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al limpiar actividades antiguas',
      };
    }
  }
}

// Instancia singleton del service
export const activityService = new ActivityService();