import { useState } from 'react';
import { Button } from './ui/button';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  label: string;
  accept?: string;
}

export default function FileUpload({ onFileSelected, label, accept = "image/*" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      
      // Crear preview para imágenes
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-${label}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`file-${label}`)?.click()}
        >
          Seleccionar archivo
        </Button>
        
        {preview && (
          <div className="mt-2">
            <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
}