// Local: sabio-forno-app/src/pages/PaymentSuccessPage.tsx

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react'; // Ícone de sucesso

export function PaymentSuccessPage() {
  const { logout } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Desloga o usuário imediatamente ao carregar a página.
    // Isso limpa o token antigo (INCOMPLETE) do localStorage.
    logout(); 
    
    // 2. Informa ao usuário com uma notificação
    toast.success("Pagamento confirmado com sucesso!");
    
    // 3. Limpa os parâmetros da URL (session_id)
    // Isso evita que a lógica de logout rode novamente se o usuário atualizar a página
    navigate('/payment/success', { replace: true });
    
  }, [logout, navigate]); // Roda apenas uma vez quando a página é montada

  // 4. Renderiza a página de sucesso com a instrução para o usuário
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f9f9f9',
      fontFamily: 'Inter, sans-serif',
      padding: '2rem'
    }}>
      <CheckCircle size={80} color="#28A745" />
      <h1 style={{ color: '#343A40', marginTop: '1.5rem', textAlign: 'center' }}>Pagamento Aprovado!</h1>
      <p style={{ color: '#495057', fontSize: '1.1rem', textAlign: 'center' }}>
        Sua assinatura do Sábio Forno foi ativada.
      </p>
      <p style={{ color: '#6C757D', fontSize: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
        Por favor, faça o login novamente para acessar o sistema.
      </p>
      <Link 
        to="/login" 
        style={{
          padding: '0.85rem 1.5rem',
          border: 'none',
          backgroundColor: '#6D4C41', // Cor do botão do formulário de Insumos
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 500,
          borderRadius: '6px',
          cursor: 'pointer',
          textDecoration: 'none'
        }}
      >
        Fazer Login
      </Link>
    </div>
  );
}