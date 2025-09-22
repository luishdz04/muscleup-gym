// services/userService.ts
import { User } from '@/types/user';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

class UserService {
  private async ensureSession() {
    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No se encontró sesión activa');
    }
    
    return session;
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureSession();
    
    const response = await fetch('/api/admin/users');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener usuarios');
    }
    
    return response.json();
  }

  async createUser(userData: Partial<User>): Promise<User> {
    await this.ensureSession();
    
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear usuario');
    }
    
    return response.json();
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    await this.ensureSession();
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar usuario');
    }
    
    return response.json();
  }

  async deleteUser(userId: string): Promise<void> {
    await this.ensureSession();
    
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar usuario');
    }
  }

  async getUserById(userId: string): Promise<User> {
    await this.ensureSession();
    
    const response = await fetch(`/api/admin/users/${userId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener usuario');
    }
    
    return response.json();
  }
}

export const userService = new UserService();