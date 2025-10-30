// Local: sabio-forno-app/src/pages/PaymentSuccessPage.tsx

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function PaymentSuccessPage() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Pega o ID da sessão do Stripe da URL
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      toast.error("ID da sessão de pagamento não encontrado.");
      navigate('/planos');
      return;
    }

    // Esta é a função que tenta "trocar o token"
    const verifyAndRefreshToken = async () => {
      try {
        // Chama uma nova API que criaremos (Passo 2) para verificar o status
        // e nos dar um NOVO token se o pagamento foi confirmado
        const response = await api.post('/billing/refresh-token', { sessionId });
        
        const newToken = response.data.access_token;
        if (newToken) {
          // 1. Sucesso! Atualiza o AppContext com o novo token (que diz "ACTIVE")
          login(newToken);
          toast.success("Pagamento confirmado! Bem-vindo ao Sábio Forno.");
          // 2. Envia o usuário para o Dashboard (o paywall agora vai liberar)
          navigate('/dashboard');
        } else {
          throw new Error("Token de atualização não recebido.");
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        toast.error("Falha ao verificar seu pagamento. Redirecionando...");
        navigate('/planos');
      }
    };

    // Inicia a verificação assim que a página carrega
    verifyAndRefreshToken();

  }, [login, navigate, searchParams]);

  // Exibe uma mensagem de carregamento enquanto verificamos
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
      <LoadingSpinner text="Confirmando seu pagamento, aguarde..." />
    </div>
  );
}