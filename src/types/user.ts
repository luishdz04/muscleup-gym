// Interfaces básicas del usuario
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: 'admin' | 'empleado' | 'cliente';
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
  createdAt?: string;
  updatedAt?: string;
  address?: Address;
  emergency?: EmergencyContact;
  membership?: MembershipInfo;
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

export interface MembershipInfo {
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  averageAge: number;
  genderDistribution: { masculino: number; femenino: number; otro: number };
  membershipLevels: { principiante: number; intermedio: number; avanzado: number };
  completionRate: {
    profilePicture: number;
    signature: number;
    contract: number;
    allComplete: number;
  };
}