// Local: sabio-forno-app/src/components/Sidebar.tsx

import { NavLink, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import './Sidebar.css';
import { UserRoundCog, LogOut, CreditCard } from 'lucide-react';
import  Logo  from '../assets/new-logo.png'

export function Sidebar() {
  // 1. Pega o estado 'isSidebarOpen' e a função 'toggleSidebar'
  const { user, logout, isSidebarOpen, toggleSidebar } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isPageAllowed = (pageId: string): boolean => {
    if (!user) return false;
    if (user.role === 'PAI') return true;
    return Array.isArray(user.allowedPages) && user.allowedPages.includes(pageId);
  };

  // 2. Define a classe CSS com base no estado
  const sidebarClassName = `sidebar-redesign-corrected ${isSidebarOpen ? 'open' : ''}`;

  return (
    <>
      {/* 3. O "Backdrop" para fechar o menu no mobile */}
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

      <nav className={sidebarClassName}>
        <div className="sidebar-logo-section">
          <img src={Logo} className='sidebar-logo'></img>
          {/* <span className="sidebar-logo-text">SÁBIO FORNO</span> */}
        </div>

        <div className="sidebar-greeting-section">
          <span>{getGreeting()},</span>
          <span className="company-name">{user?.companyName || 'Visitante'}</span>
        </div>

        <ul className="sidebar-menu-redesign">
          {/* 4. Ao clicar em um link no mobile, fecha a sidebar */}
          {isPageAllowed('dashboard') && <li><NavLink to="/dashboard" onClick={toggleSidebar}>Meu Painel</NavLink></li>}
          {isPageAllowed('caixa') && <li><NavLink to="/caixa" onClick={toggleSidebar}>Fluxo de Caixa</NavLink></li>}
          {isPageAllowed('custos') && <li><NavLink to="/custos" onClick={toggleSidebar}>Custos Mensais</NavLink></li>}
          {isPageAllowed('custos-operacionais') && <li><NavLink to="/custos-operacionais" onClick={toggleSidebar}>Custos Operacionais</NavLink></li>}
          {isPageAllowed('insumos') && <li><NavLink to="/insumos" onClick={toggleSidebar}>Ingredientes</NavLink></li>}
          {isPageAllowed('receitas') && <li><NavLink to="/receitas" onClick={toggleSidebar}>Receitas</NavLink></li>}
        </ul>

        <div className="sidebar-footer-redesign-corrected">
        {user?.role === 'PAI' && (
          <>
            {/* 2. Adiciona o novo link de Planos */}
            <NavLink to="/planos" className="account-link-redesign" onClick={toggleSidebar}>
              <CreditCard size={20} />
              <span>Planos e Assinatura</span>
            </NavLink>
            <NavLink to="/conta" className="account-link-redesign" onClick={toggleSidebar}>
              <UserRoundCog size={20} />
              <span>Minha Conta</span>
            </NavLink>
          </>
        )}
          <button onClick={handleLogout} className="logout-button-redesign">
            <LogOut className='bot-icons' size={20} />
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// (Função getGreeting copiada para dentro do arquivo para ficar autocontida)
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}