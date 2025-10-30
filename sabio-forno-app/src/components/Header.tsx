// Local: sabio-forno-app/src/components/Header.tsx

import { useAppContext } from '../contexts/AppContext';
import './Header.css';
import { ChevronDown, Menu } from 'lucide-react'; // 1. Importa o ícone Menu

export function Header() {
  // 2. Pega as novas funções/estado do contexto
  const { user, selectedUnidade, selectUnidade, toggleSidebar } = useAppContext();

  const unidadesVisiveis = user?.unidadesPermitidas || [];

  return (
    <header className="app-header-corrected">
      {/* 3. Adiciona o botão "hambúrguer" para mobile */}
      <button className="mobile-menu-button" onClick={toggleSidebar}>
        <Menu size={24} />
      </button>

      {/* Seção do Seletor de Unidades (permanece igual) */}
      <div className="header-unidade-section">
        {unidadesVisiveis.length > 1 ? (
          <div className="unidade-selector-corrected">
            <label>Estabelecimento:</label>
            <select
              value={selectedUnidade?.id || ''}
              onChange={(e) => selectUnidade(Number(e.target.value))}
            >
              {unidadesVisiveis.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="unidade-selector-icon-corrected" />
          </div>
        ) : (
          unidadesVisiveis.length === 1 && (
            <div className="unidade-display-corrected">
              <span>Estabelecimento: {unidadesVisiveis[0].name}</span>
            </div>
          )
        )}
         {unidadesVisiveis.length === 0 && (
            <div className="unidade-display-corrected">
              <span>Nenhuma unidade disponível</span>
            </div>
         )}
      </div>
    </header>
  );
}