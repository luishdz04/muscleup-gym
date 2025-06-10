import React from 'react';

interface SuccessModalProps {
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-8 max-w-md w-full mx-4 border border-yellow-500">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-green-900 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-4">¡Registro Exitoso!</h2>
        
        <p className="text-center text-gray-200 mb-6">
          Tu registro se ha completado con éxito. ¡Bienvenido a Muscle Up Gym!
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;