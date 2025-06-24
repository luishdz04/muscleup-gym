'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RutinasLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simular verificación (puedes cambiar la contraseña aquí)
    const correctPassword = 'rutinas123'; // Cambia esta contraseña
    
    if (password === correctPassword) {
      // Guardar en sessionStorage
      sessionStorage.setItem('rutinas_auth', password);
      router.push('/rutinas/viewer');
    } else {
      setError('Contraseña incorrecta');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-lg shadow-2xl border border-[#FFCC00]/20 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#FFCC00] mb-2">
            Rutinas de Entrenamiento
          </h1>
          <p className="text-gray-300">
            Ingresa la contraseña para acceder
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black border border-[#FFCC00]/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FFCC00] transition-colors"
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FFCC00] text-black font-semibold rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-[#FFCC00] hover:text-[#FFD700] transition-colors text-sm"
          >
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
