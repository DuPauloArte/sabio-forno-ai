// Local: sabio-forno-app/src/components/LoadingSpinner.tsx

import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css'; // Vamos criar este arquivo CSS

interface LoadingSpinnerProps {
  text?: string; // Texto opcional para exibir abaixo do spinner
}

export function LoadingSpinner({ text = "Carregando..." }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-overlay">
      <Loader2 className="loading-icon" size={40} />
      <p>{text}</p>
    </div>
  );
}