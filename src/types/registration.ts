// src/types/registration.ts
import { UseFormRegister, Control, UseFormWatch, FieldErrors } from 'react-hook-form';
import { RegistrationFormData } from '@/schemas/registrationSchema';

// ✅ INTERFACES CORREGIDAS PARA TODOS LOS COMPONENTES

export interface PersonalDataStepProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  control: Control<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  getCurrentMexicoDate: () => string;
  validateAge: (birthDate: string) => boolean | string; // ✅ Coincide con el componente
  handleProfilePhotoCapture: (file: File) => Promise<void>;
  previewUrl: string | null;
  clearPhoto: () => void;
  onNext: () => Promise<void>;
}

export interface EmergencyContactStepProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  control: Control<RegistrationFormData>;
  onNext: () => Promise<void>;
  onBack: () => void;
}

export interface MembershipInfoStepProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  onNext: () => Promise<void>;
  onBack: () => void;
}

export interface ContractSignatureStepProps {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  isSubmitting: boolean;
  showTutorField: boolean;
  tutorINEUrl: string | null;
  handleTutorINECapture: (file: File) => Promise<void>;
  clearTutorINE: () => void;
  sigCanvas: React.RefObject<any>;
  clearSignature: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

// ✅ TIPO PARA EL HOOK
export interface UseRegistrationFormReturn {
  // Estados
  step: number;
  formProgress: number;
  isSubmitting: boolean;
  showTutorField: boolean;
  completedSteps: number[];
  showSuccessModal: boolean;
  userId: string | null;
  previewUrl: string | null;
  tutorINEUrl: string | null;
  profilePhotoFile: File | null;
  tutorINEFile: File | null;
  
  // Refs
  sigCanvas: React.RefObject<any>;
  
  // Métodos de formulario
  register: UseFormRegister<RegistrationFormData>;
  handleSubmit: any;
  control: Control<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  isDirty: boolean;
  trigger: any;
  setValue: any;
  reset: any;
  getValues: any;
  formValues: any;
  
  // Funciones de navegación
  goNext: () => Promise<void>;
  goBack: () => void;
  goToStep: (step: number) => void;
  
  // Funciones de archivos
  handleProfilePhotoCapture: (file: File) => Promise<void>;
  handleTutorINECapture: (file: File) => Promise<void>;
  clearPhoto: () => void;
  clearTutorINE: () => void;
  clearSignature: () => void;
  
  // Función de envío
  onSubmit: any;
  
  // Función de cierre modal
  handleCloseSuccessModal: () => void;
  
  // Utilidades
  getCurrentMexicoDate: () => string;
  validateAge: (birthDate: string) => boolean | string;
}