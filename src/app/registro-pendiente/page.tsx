'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function RegistroPendientePage() {
  const searchParams = useSearchParams()
  const [showRetry, setShowRetry] = useState(false)
  
  const error = searchParams.get('error')

  const errorMessages = {
    'parametros-faltantes': {
      title: 'Enlace incompleto',
      description: 'El enlace de confirmación está incompleto o dañado.',
      icon: '🔗',
      canRetry: false
    },
    'token-expirado': {
      title: 'Enlace expirado',
      description: 'El enlace de confirmación ha expirado. Los enlaces expiran en 1 hora por seguridad.',
      icon: '⏰',
      canRetry: true
    },
    'token-invalido': {
      title: 'Enlace inválido',
      description: 'El enlace de confirmación no es válido o ya fue usado anteriormente.',
      icon: '❌',
      canRetry: true
    },
    'formato-invalido': {
      title: 'Formato de enlace incorrecto',
      description: 'El enlace no tiene el formato esperado.',
      icon: '🔗',
      canRetry: true
    },
    'verificacion-fallida': {
      title: 'Error de verificación',
      description: 'No se pudo verificar el enlace de confirmación.',
      icon: '⚠️',
      canRetry: true
    },
    'usuario-no-encontrado': {
      title: 'Usuario no encontrado',
      description: 'No encontramos tu registro en el sistema.',
      icon: '👤',
      canRetry: false
    },
    'actualizacion-fallida': {
      title: 'Error de sistema',
      description: 'Ocurrió un error al actualizar tu cuenta.',
      icon: '⚠️',
      canRetry: true
    },
    'error-critico': {
      title: 'Error del sistema',
      description: 'Ocurrió un error inesperado en el servidor.',
      icon: '🔧',
      canRetry: true
    }
  }

  const currentError = error ? errorMessages[error as keyof typeof errorMessages] : null

  const handleResendEmail = async () => {
    setShowRetry(true)
    // Aquí podrías implementar la lógica para reenviar el email
    setTimeout(() => setShowRetry(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-red-400 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">{currentError?.icon || '📧'}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Confirmación pendiente
            </h1>
            <p className="text-orange-100 text-lg">
              Necesitamos confirmar tu cuenta para continuar
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {currentError ? (
              <div className="mb-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                    <span className="mr-2">{currentError.icon}</span>
                    {currentError.title}
                  </h3>
                  <p className="text-red-700">{currentError.description}</p>
                </div>

                {currentError.canRetry && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Solución:</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      Puedes solicitar un nuevo enlace de confirmación.
                    </p>
                    <button
                      onClick={handleResendEmail}
                      disabled={showRetry}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
                    >
                      {showRetry ? '📤 Enviando...' : '📧 Reenviar confirmación'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-yellow-800 mb-2">📧 Revisa tu correo</h3>
                  <p className="text-yellow-700">
                    Te hemos enviado un enlace de confirmación. Revisa tu bandeja de entrada y spam.
                  </p>
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-gray-800">📋 Pasos a seguir:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <h4 className="font-medium text-gray-800">Revisa tu correo electrónico</h4>
                    <p className="text-sm text-gray-600">Busca el email de Muscle Up Gym en tu bandeja de entrada y spam.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <h4 className="font-medium text-gray-800">Haz clic en "Confirmar cuenta"</h4>
                    <p className="text-sm text-gray-600">El botón amarillo en el email te llevará a confirmar tu registro.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <h4 className="font-medium text-gray-800">¡Listo para entrenar!</h4>
                    <p className="text-sm text-gray-600">Una vez confirmado, recibirás tu contrato y podrás comenzar.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">¿Necesitas ayuda? 🤝</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <a href="tel:866-112-7905" className="text-blue-600 hover:underline">866-112-7905</a>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <a href="mailto:administracion@muscleupgym.fitness" className="text-blue-600 hover:underline">
                    administracion@muscleupgym.fitness
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📍</span>
                  <span className="text-gray-600">Saltillo, Coahuila</span>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                🏠 Volver al inicio
              </Link>
              
              <Link 
                href="/registro"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
              >
                🔄 Intentar nuevo registro
              </Link>
            </div>

            {/* Info adicional */}
            <div className="text-center mt-6 text-xs text-gray-500">
              <p>Los enlaces de confirmación expiran en 24 horas por seguridad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}