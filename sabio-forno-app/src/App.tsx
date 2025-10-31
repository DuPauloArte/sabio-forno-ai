// Local: sabio-forno-app/src/App.tsx

import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import './App.css'; // Importa o CSS de layout
import { useAppContext } from './contexts/AppContext';
import { useEffect } from 'react';

// Importa os Componentes de Layout
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

// Importa as Páginas
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { InsumosPage } from './pages/InsumosPage';
import { ReceitasPage } from './pages/ReceitasPage';
import { FluxoCaixaPage } from './pages/FluxoCaixaPage';
import { CustosFixosPage } from './pages/CustosFixosPage';
import { MinhaContaPage } from './pages/MinhaContaPage';
import { CustosOperacionaisPage } from './pages/CustosOperacionaisPage';
import { PlanosPage } from './pages/PlanosPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';

/**
 * Componente "Guardião" que renderiza o layout principal da aplicação
 * se o usuário estiver logado. Caso contrário, redireciona para o login.
 */
function ProtectedRoutes() {
  const { user } = useAppContext();
  const location = useLocation();

  // Bloqueador de scroll em inputs numéricos
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (document.activeElement === event.target) {
        event.preventDefault();
      }
    };
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
      // @ts-ignore
      input.addEventListener('wheel', handleWheel, { passive: false });
    });
    return () => {
      inputs.forEach(input => {
        // @ts-ignore
        input.removeEventListener('wheel', handleWheel);
      });
    };
  }, [location]); // Re-aplica em cada mudança de página

  // 1. O usuário está logado?
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Verificação de Paywall
  const isPai = user.role === 'PAI';
  const isSubscribed = user.subscriptionStatus === 'ACTIVE';
  
  // --- CORREÇÃO CRÍTICA AQUI ---
  // Define as páginas que um PAI *não assinante* PODE acessar
  const allowedSubscriptionPages = [
    '/planos',
    '/conta',
    '/payment/success', // <-- Adiciona a página de sucesso
    '/payment/cancel',  // <-- Adiciona a página de cancelamento
  ];

  const isManagingSubscription = allowedSubscriptionPages.some(path => 
    location.pathname.startsWith(path)
  );
  // --- FIM DA CORREÇÃO ---

  if (isPai && !isSubscribed && !isManagingSubscription) {
    return <Navigate to="/planos" replace />;
  }

  // 3. Verificação de Permissões de Página
  const getPageIdFromPathname = (pathname: string): string => {
    const path = pathname.substring(1).split('/')[0];
    return path === '' ? 'dashboard' : path;
  };
  const requestedPageId = getPageIdFromPathname(location.pathname);
  let isAllowed = false;
  if (user.role === 'PAI') {
    isAllowed = true;
  } else if (user.role === 'FILHO') {
    isAllowed = Array.isArray(user.allowedPages) && user.allowedPages.includes(requestedPageId);
  }

  // 4. Se o usuário está logado, renderiza o layout principal
  return (
    <div className="app-container-redesign">
      <Sidebar />
      <div className="content-area">
        <Header />
        <main className="main-content-redesign">
          {isAllowed ? (
            // 5. Se tiver permissão, renderiza o <Outlet> (que o App.tsx vai preencher)
            <Outlet />
          ) : (
            // 6. Se não tiver permissão, redireciona para uma página segura
            <Navigate to={user.role === 'FILHO' ? "/caixa" : "/dashboard"} replace />
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Componente "Redirecionador" que decide a página inicial
 */
function IndexRedirect() {
  const { user } = useAppContext();
  if (user?.role === 'FILHO') {
    return <Navigate to="/caixa" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}


/**
 * Componente Principal
 */
function App() {
  const { user } = useAppContext();

  return (
    <Routes>
      {/* --- Rotas Públicas --- */}
      {/* Se o usuário estiver logado, redireciona para a home, senão mostra a página */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <RegisterPage />} />

      {/* --- Rotas Protegidas --- */}
      {/* Qualquer outra rota (/*) é tratada pelo "Guardião" ProtectedRoutes */}
      <Route path="/*" element={<ProtectedRoutes />}>
        {/* O <Outlet> no ProtectedRoutes vai renderizar estas rotas filhas: */}
        <Route index element={<IndexRedirect />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="insumos" element={<InsumosPage />} />
        <Route path="receitas" element={<ReceitasPage />} />
        <Route path="caixa" element={<FluxoCaixaPage />} />
        <Route path="custos" element={<CustosFixosPage />} />
        <Route path="custos-operacionais" element={<CustosOperacionaisPage />} />
        <Route path="conta" element={<MinhaContaPage />} />
        <Route path="planos" element={<PlanosPage />} />
        <Route path="payment/success" element={<PaymentSuccessPage />} />
        <Route path="payment/cancel" element={<PaymentCancelPage />} />
        <Route path="*" element={<h1>Página Protegida Não Encontrada</h1>} />
      </Route>
    </Routes>
  );
}

export default App;