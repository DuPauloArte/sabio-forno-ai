// Local: sabio-forno-app/src/pages/PaymentCancelPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Exibe uma notificação de erro/aviso
    toast.error("Pagamento cancelado. Você pode tentar novamente a qualquer momento.");
    
    // Redireciona o usuário de volta para a página de planos
    navigate('/planos');
  }, [navigate]);

  // Esta página não renderiza nada, pois ela apenas redireciona
  return null;
}