'use client';

interface Step1BasicInfoProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function Step1BasicInfo({ data, onUpdate }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Información Básica del Plan
      </h3>
      <p className="text-gray-600">
        Configuración temporal - En desarrollo...
      </p>
    </div>
  );
}