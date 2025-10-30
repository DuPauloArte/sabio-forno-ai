// Local: sabio-forno-app/src/pages/PaymentCancelPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("Pagamento cancelado. Você pode tentar novamente a qualquer momento.");
    navigate('/planos');
  }, [navigate]);

  // Renderiza null pois será redirecionado imediatamente
  return null;
}