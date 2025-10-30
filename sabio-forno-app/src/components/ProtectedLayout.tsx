// Local: sabio-forno-app/src/components/ProtectedLayout.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAppContext } from '../contexts/AppContext';
import '../App.css'; // Importa o CSS com as classes de layout

// Função auxiliar para extrair o ID da página (ex: 'insumos') da URL
function getPageIdFromPathname(pathname: string): string {
  const path = pathname.substring(1).split('/')[0];
  // Se a rota for vazia (raiz), trata como 'dashboard' para a lógica de permissão
  return path === '' ? 'dashboard' : path;
}

export const ProtectedLayout = () => {
  const { user } = useAppContext();
  const location = useLocation(); // Pega a URL atual

  // --- Verificação 1: O usuário está logado? ---
  if (!user) {
    // Se não há usuário (sem token), redireciona para o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- Verificação 2: PAYWALL (O usuário é PAI, mas não tem assinatura ativa?) ---
  const isPai = user.role === 'PAI';
  // Assumimos que 'ACTIVE' é o status de uma assinatura paga e válida
  const isSubscribed = user.subscriptionStatus === 'ACTIVE'; 
  
  // Identifica se o usuário está tentando acessar as páginas de pagamento ou conta
  const isManagingSubscription = 
    location.pathname.startsWith('/planos') || 
    location.pathname.startsWith('/conta');

  if (isPai && !isSubscribed && !isManagingSubscription) {
    // Se for PAI, NÃO for assinante, e NÃO estiver na página de Planos ou Conta...
    // Redireciona FORÇADAMENTE para a página de Planos.
    return <Navigate to="/planos" replace />;
  }
  
  // --- Verificação 3: Permissões de Página (Autorização) ---
  // Se o usuário passou pelo Paywall (ou é um Filho, ou é um Pai assinante),
  // verificamos se ele pode ver a página específica que está tentando acessar.

  const requestedPageId = getPageIdFromPathname(location.pathname);
  let isAllowed = false;

  if (user.role === 'PAI') {
    // Se for PAI (e já passou pelo paywall), ele pode ver tudo.
    isAllowed = true;
  } else if (user.role === 'FILHO') {
    // Se for FILHO, verifica a lista de páginas permitidas.
    isAllowed = Array.isArray(user.allowedPages) && user.allowedPages.includes(requestedPageId);
  }

  // 4. Se não tiver permissão para a página, redireciona para a página segura
  if (!isAllowed) {
    // A página inicial segura do Filho é /caixa, a do Pai é /dashboard
    const safeRedirectPath = user.role === 'FILHO' ? '/caixa' : '/dashboard';
    return <Navigate to={safeRedirectPath} replace />;
  }

  // 5. Se está logado, tem assinatura (ou é Filho) E tem permissão para a rota...
  // Renderiza o layout principal com a página solicitada.
  return (
    <>
      <Sidebar />
      <div className="content-area">
        <Header />
        <main className="main-content-redesign">
          <Outlet /> {/* Renderiza a página filha (Dashboard, Insumos, etc.) */}
        </main>
      </div>
    </>
  );
};