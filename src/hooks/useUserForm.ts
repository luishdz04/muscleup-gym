// hooks/useUserForm.ts
'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';

// Interfaces
interface User {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: string;
  profilePictureUrl?: string;
  whatsapp: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  isMinor: boolean;
  emailSent: boolean;
  emailSentAt?: string;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  signatureUrl?: string;
  contractPdfUrl?: string;
  fingerprint: boolean;
}

interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

interface MembershipInfo {
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

interface FormValidationErrors {
  [key: string]: string;
}

interface UseUserFormProps {
  initialUser?: User | null;
  onFormChange?: (hasChanges: boolean) => void;
}

// ✅ NUEVA INTERFAZ PARA DATOS RELACIONADOS
interface RelatedData {
  address?: Address;
  emergency?: EmergencyContact;
  membership?: MembershipInfo;
}

// Funciones de conversión memoizadas
const convertMaritalStatusToCode = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'Soltero/a': 'soltero',
    'Soltero': 'soltero',
    'Soltera': 'soltero',
    'Casado/a': 'casado',
    'Casado': 'casado',
    'Casada': 'casado',
    'Divorciado/a': 'divorciado',
    'Divorciado': 'divorciado',
    'Divorciada': 'divorciado',
    'Viudo/a': 'viudo',
    'Viudo': 'viudo',
    'Viuda': 'viudo'
  };
  return statusMap[status] || status.toLowerCase();
};

const convertMaritalStatusToDisplay = (code: string): string => {
  const codeMap: { [key: string]: string } = {
    'soltero': 'Soltero/a',
    'casado': 'Casado/a',
    'divorciado': 'Divorciado/a',
    'viudo': 'Viudo/a'
  };
  return codeMap[code] || code;
};

const convertTrainingLevelToCode = (level: string): string => {
  return level ? level.toLowerCase() : 'principiante';
};

const convertTrainingLevelToDisplay = (code: string): string => {
  const levelMap: { [key: string]: string } = {
    'principiante': 'Principiante',
    'intermedio': 'Intermedio',
    'avanzado': 'Avanzado'
  };
  return levelMap[code] || code;
};

export const useUserForm = ({ initialUser, onFormChange }: UseUserFormProps) => {
  // Estados principales del formulario
  const [formData, setFormData] = useState<User>(() => ({
    firstName: '',
    lastName: '',
    email: '',
    rol: 'cliente',
    whatsapp: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    isMinor: false,
    emailSent: false,
    whatsappSent: false,
    fingerprint: false
  }));

  const [addressData, setAddressData] = useState<Address>(() => ({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'México'
  }));

  const [emergencyData, setEmergencyData] = useState<EmergencyContact>(() => ({
    name: '',
    phone: '',
    medicalCondition: '',
    bloodType: ''
  }));

  const [membershipData, setMembershipData] = useState<MembershipInfo>(() => ({
    referredBy: '',
    mainMotivation: '',
    receivePlans: false,
    trainingLevel: 'principiante'
  }));

  // Estados para control de cambios
  const [originalFormData, setOriginalFormData] = useState<User>(formData);
  const [originalAddressData, setOriginalAddressData] = useState<Address>(addressData);
  const [originalEmergencyData, setOriginalEmergencyData] = useState<EmergencyContact>(emergencyData);
  const [originalMembershipData, setOriginalMembershipData] = useState<MembershipInfo>(membershipData);

  // Estados de validación
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [birthDate, setBirthDate] = useState<dayjs.Dayjs | null>(null);

  // Referencias para optimización
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Función de validación memoizada
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: FormValidationErrors = {};
    
    if (step === 0) {
      // Validaciones paso básico
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'El nombre es obligatorio';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'El apellido es obligatorio';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'El email es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email inválido';
      }
      
      if (!formData.whatsapp.trim()) {
        newErrors.whatsapp = 'El WhatsApp es obligatorio';
      } else if (!/^\+?\d{10,15}$/.test(formData.whatsapp.replace(/[\s-]/g, ''))) {
        newErrors.whatsapp = 'Número de WhatsApp inválido';
      }
      
      if (!formData.birthDate) {
        newErrors.birthDate = 'La fecha de nacimiento es obligatoria';
      } else {
        const birthDate = dayjs(formData.birthDate);
        const today = dayjs();
        if (birthDate.isAfter(today)) {
          newErrors.birthDate = 'La fecha no puede ser futura';
        } else if (today.diff(birthDate, 'year') > 120) {
          newErrors.birthDate = 'Fecha de nacimiento inválida';
        }
      }
      
      if (!formData.gender) {
        newErrors.gender = 'El género es obligatorio';
      }
      
      if (!formData.maritalStatus) {
        newErrors.maritalStatus = 'El estado civil es obligatorio';
      }
    } else if (step === 1 && formData.rol === 'cliente') {
      // Validaciones de dirección
      if (!addressData.street.trim()) {
        newErrors.address_street = 'La calle es obligatoria';
      }
      
      if (!addressData.number.trim()) {
        newErrors.address_number = 'El número es obligatorio';
      }
      
      if (!addressData.neighborhood.trim()) {
        newErrors.address_neighborhood = 'La colonia es obligatoria';
      }
      
      if (!addressData.city.trim()) {
        newErrors.address_city = 'La ciudad es obligatoria';
      }
      
      if (!addressData.state.trim()) {
        newErrors.address_state = 'El estado es obligatorio';
      }
      
      if (!addressData.postalCode.trim()) {
        newErrors.address_postalCode = 'El código postal es obligatorio';
      } else if (!/^\d{5}$/.test(addressData.postalCode)) {
        newErrors.address_postalCode = 'Código postal debe ser de 5 dígitos';
      }
    } else if (step === 2 && formData.rol === 'cliente') {
      // Validaciones de emergencia
      if (!emergencyData.name.trim()) {
        newErrors.emergency_name = 'El nombre del contacto es obligatorio';
      }
      
      if (!emergencyData.phone.trim()) {
        newErrors.emergency_phone = 'El teléfono del contacto es obligatorio';
      } else if (!/^\+?\d{10,15}$/.test(emergencyData.phone.replace(/[\s-]/g, ''))) {
        newErrors.emergency_phone = 'Número de teléfono inválido';
      }
      
      if (!emergencyData.bloodType.trim()) {
        newErrors.emergency_bloodType = 'El tipo de sangre es obligatorio';
      }
    } else if (step === 3 && formData.rol === 'cliente') {
      // Validaciones de membresía
      if (!membershipData.mainMotivation.trim()) {
        newErrors.membership_mainMotivation = 'La motivación principal es obligatoria';
      } else if (membershipData.mainMotivation.trim().length < 10) {
        newErrors.membership_mainMotivation = 'Por favor proporciona más detalles (mínimo 10 caracteres)';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, addressData, emergencyData, membershipData]);

  // Detectar cambios en el formulario
  const hasFormChanges = useMemo(() => {
    const fieldsToCompare = [
      'firstName', 'lastName', 'email', 'whatsapp', 'birthDate', 
      'gender', 'maritalStatus', 'rol', 'isMinor', 'emailSent', 
      'whatsappSent', 'fingerprint'
    ];
    
    const userDataChanged = fieldsToCompare.some(field => {
      const current = formData[field as keyof User];
      const original = originalFormData[field as keyof User];
      return current !== original;
    });
    
    const addressFieldsToCompare = ['street', 'number', 'neighborhood', 'city', 'state', 'postalCode', 'country'];
    const addressChanged = addressFieldsToCompare.some(field => {
      const current = addressData[field as keyof Address];
      const original = originalAddressData[field as keyof Address];
      return current !== original;
    });
    
    const emergencyFieldsToCompare = ['name', 'phone', 'medicalCondition', 'bloodType'];
    const emergencyChanged = emergencyFieldsToCompare.some(field => {
      const current = emergencyData[field as keyof EmergencyContact];
      const original = originalEmergencyData[field as keyof EmergencyContact];
      return current !== original;
    });
    
    const membershipFieldsToCompare = ['referredBy', 'mainMotivation', 'receivePlans', 'trainingLevel'];
    const membershipChanged = membershipFieldsToCompare.some(field => {
      const current = membershipData[field as keyof MembershipInfo];
      const original = originalMembershipData[field as keyof MembershipInfo];
      return current !== original;
    });
    
    return userDataChanged || addressChanged || emergencyChanged || membershipChanged;
  }, [formData, originalFormData, addressData, originalAddressData, emergencyData, originalEmergencyData, membershipData, originalMembershipData]);

  // Manejadores de eventos memoizados
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Limpiar error si existe
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleSelectChange = useCallback((e: { target: { name?: string; value: string } }) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setAddressData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`address_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`address_${name}`];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleEmergencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setEmergencyData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`emergency_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`emergency_${name}`];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleEmergencySelectChange = useCallback((e: { target: { name?: string; value: string } }) => {
    const { name, value } = e.target;
    if (name) {
      setEmergencyData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`emergency_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`emergency_${name}`];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleMembershipChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name) {
      setMembershipData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`membership_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`membership_${name}`];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleMembershipSelectChange = useCallback((e: { target: { name?: string; value: string } }) => {
    const { name, value } = e.target;
    if (name) {
      setMembershipData(prev => ({
        ...prev,
        [name]: value
      }));
      
      if (errors[`membership_${name}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`membership_${name}`];
          return newErrors;
        });
      }
    }
  }, [errors]);

  const handleSwitchChange = useCallback((name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  }, []);

  const handleMembershipSwitchChange = useCallback((name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMembershipData(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  }, []);

  const handleBirthDateChange = useCallback((date: dayjs.Dayjs | null) => {
    setBirthDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        birthDate: date.format('YYYY-MM-DD')
      }));
      
      // Calcular si es menor de edad
      const today = dayjs();
      const age = today.diff(date, 'year');
      setFormData(prev => ({
        ...prev,
        isMinor: age < 18
      }));
      
      // Limpiar error
      if (errors.birthDate) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.birthDate;
          return newErrors;
        });
      }
    }
  }, [errors.birthDate]);

  // ✅ FUNCIÓN PARA INICIALIZAR CON USUARIO EXISTENTE - CORREGIDA
  const initializeWithUser = useCallback((user: User) => {
    console.log('🔄 [FORM] Inicializando formulario con usuario:', user);
    
    const userData = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      rol: user.rol || 'cliente',
      whatsapp: user.whatsapp || '',
      birthDate: user.birthDate || '',
      gender: user.gender ? user.gender.toLowerCase() : '',
      maritalStatus: user.maritalStatus ? convertMaritalStatusToCode(user.maritalStatus) : '',
      isMinor: user.isMinor || false,
      emailSent: user.emailSent || false,
      emailSentAt: user.emailSentAt || undefined,
      whatsappSent: user.whatsappSent || false,
      whatsappSentAt: user.whatsappSentAt || undefined,
      profilePictureUrl: user.profilePictureUrl || undefined,
      signatureUrl: user.signatureUrl || undefined,
      contractPdfUrl: user.contractPdfUrl || undefined,
      fingerprint: user.fingerprint || false
    };
    
    setFormData(userData);
    setOriginalFormData({...userData});
    
    if (user.birthDate) {
      setBirthDate(dayjs(user.birthDate));
    }
    
    console.log('✅ [FORM] Datos básicos del usuario inicializados');
  }, []);

  // ✅ NUEVA FUNCIÓN PARA INICIALIZAR DATOS RELACIONADOS
  const initializeRelatedData = useCallback((relatedData: RelatedData) => {
    console.log('🔄 [FORM] Inicializando datos relacionados:', relatedData);
    
    // Inicializar dirección si existe
    if (relatedData.address) {
      const addressToSet = {
        street: relatedData.address.street || '',
        number: relatedData.address.number || '',
        neighborhood: relatedData.address.neighborhood || '',
        city: relatedData.address.city || '',
        state: relatedData.address.state || '',
        postalCode: relatedData.address.postalCode || '',
        country: relatedData.address.country || 'México'
      };
      
      setAddressData(addressToSet);
      setOriginalAddressData({...addressToSet});
      console.log('✅ [FORM] Dirección inicializada');
    }
    
    // Inicializar contacto de emergencia si existe
    if (relatedData.emergency) {
      const emergencyToSet = {
        name: relatedData.emergency.name || '',
        phone: relatedData.emergency.phone || '',
        medicalCondition: relatedData.emergency.medicalCondition || '',
        bloodType: relatedData.emergency.bloodType || ''
      };
      
      setEmergencyData(emergencyToSet);
      setOriginalEmergencyData({...emergencyToSet});
      console.log('✅ [FORM] Contacto de emergencia inicializado');
    }
    
    // Inicializar membresía si existe
    if (relatedData.membership) {
      const membershipToSet = {
        referredBy: relatedData.membership.referredBy || '',
        mainMotivation: relatedData.membership.mainMotivation || '',
        receivePlans: relatedData.membership.receivePlans || false,
        trainingLevel: convertTrainingLevelToCode(relatedData.membership.trainingLevel || 'principiante')
      };
      
      setMembershipData(membershipToSet);
      setOriginalMembershipData({...membershipToSet});
      console.log('✅ [FORM] Información de membresía inicializada');
    }
    
    console.log('🎉 [FORM] Todos los datos relacionados han sido inicializados');
  }, []);

  // Función para resetear formulario
  const resetForm = useCallback(() => {
    const emptyFormData = {
      firstName: '',
      lastName: '',
      email: '',
      rol: 'cliente',
      whatsapp: '',
      birthDate: '',
      gender: '',
      maritalStatus: '',
      isMinor: false,
      emailSent: false,
      whatsappSent: false,
      fingerprint: false
    };
    
    const emptyAddress = {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México'
    };
    
    const emptyEmergency = {
      name: '',
      phone: '',
      medicalCondition: '',
      bloodType: ''
    };
    
    const emptyMembership = {
      referredBy: '',
      mainMotivation: '',
      receivePlans: false,
      trainingLevel: 'principiante'
    };
    
    setFormData(emptyFormData);
    setOriginalFormData(emptyFormData);
    setAddressData(emptyAddress);
    setOriginalAddressData(emptyAddress);
    setEmergencyData(emptyEmergency);
    setOriginalEmergencyData(emptyEmergency);
    setMembershipData(emptyMembership);
    setOriginalMembershipData(emptyMembership);
    setBirthDate(null);
    setErrors({});
  }, []);

  // Función para preparar datos finales
  const getProcessedFormData = useCallback(() => {
    const processedFormData = {
      ...formData,
      gender: formData.gender ? 
        formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : '',
      maritalStatus: convertMaritalStatusToDisplay(formData.maritalStatus)
    };
    
    const processedMembershipData = {
      ...membershipData,
      trainingLevel: convertTrainingLevelToDisplay(membershipData.trainingLevel)
    };
    
    return {
      ...processedFormData,
      address: formData.rol === 'cliente' ? addressData : null,
      emergency: formData.rol === 'cliente' ? emergencyData : null,
      membership: formData.rol === 'cliente' ? processedMembershipData : null,
    };
  }, [formData, addressData, emergencyData, membershipData]);

  // Estabilizar la referencia de onFormChange
  const onFormChangeRef = useRef(onFormChange);
  onFormChangeRef.current = onFormChange;

  // Notificar cambios al componente padre
  useEffect(() => {
    onFormChangeRef.current?.(hasFormChanges);
  }, [hasFormChanges]);

  return {
    // Estados
    formData,
    addressData,
    emergencyData,
    membershipData,
    errors,
    birthDate,
    hasFormChanges,
    
    // Manejadores
    handleInputChange,
    handleSelectChange,
    handleAddressChange,
    handleEmergencyChange,
    handleEmergencySelectChange,
    handleMembershipChange,
    handleMembershipSelectChange,
    handleSwitchChange,
    handleMembershipSwitchChange,
    handleBirthDateChange,
    
    // Funciones de utilidad
    validateStep,
    initializeWithUser,
    initializeRelatedData, // ✅ NUEVA FUNCIÓN EXPORTADA
    resetForm,
    getProcessedFormData,
    
    // Funciones de conversión
    convertMaritalStatusToCode,
    convertMaritalStatusToDisplay,
    convertTrainingLevelToCode,
    convertTrainingLevelToDisplay
  };
};