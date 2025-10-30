// Local: sabio-forno-app/src/contexts/AppContext.tsx

import { createContext, useState, useContext, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface Unidade { id: number; name: string; }

// --- INTERFACES ATUALIZADAS ---
interface JwtPayload {
  name: string; email: string | null; companyName: string | null; role: 'PAI' | 'FILHO';
  orgId: number; unidades: Unidade[]; unidadesPermitidas: Unidade[];
  allowedPages: string[];
  // Novos campos
  subscriptionStatus: string | null;
  unidadeLimit: number;
  planType: string | null;
}

interface User {
  name: string; email: string | null; companyName: string | null; role: 'PAI' | 'FILHO';
  orgId: number; unidades: Unidade[]; unidadesPermitidas: Unidade[];
  allowedPages: string[];
  // Novos campos
  subscriptionStatus: string | null;
  unidadeLimit: number;
  planType: string | null;
}

interface AppContextType {
  user: User | null;
  selectedUnidade: Unidade | null;
  login: (token: string) => User | null;
  logout: () => void;
  selectUnidade: (unidadeId: number) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded && decoded.unidades && decoded.role && decoded.unidadesPermitidas && decoded.allowedPages) {
        return {
          name: decoded.name, email: decoded.email, companyName: decoded.companyName,
          role: decoded.role, orgId: decoded.orgId, unidades: decoded.unidades,
          unidadesPermitidas: decoded.unidadesPermitidas,
          allowedPages: decoded.allowedPages,
          // Novos campos
          subscriptionStatus: decoded.subscriptionStatus,
          unidadeLimit: decoded.unidadeLimit,
          planType: decoded.planType,
        };
      }
      throw new Error("Token malformado");
    } catch {
      localStorage.removeItem('authToken');
      return null;
    }
  });

  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const unidadesVisiveis = user.unidadesPermitidas;
      if (unidadesVisiveis && unidadesVisiveis.length > 0) {
        const isSelectedUnidadeValid = unidadesVisiveis.some(u => u.id === selectedUnidade?.id);
        if (!isSelectedUnidadeValid) {
          setSelectedUnidade(unidadesVisiveis[0]);
        }
      } else {
         setSelectedUnidade(null);
      }
    } else {
      setSelectedUnidade(null);
    }
  }, [user]);

  const login = (token: string): User | null => {
    localStorage.setItem('authToken', token);
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded && decoded.unidades && decoded.role && decoded.unidadesPermitidas && decoded.allowedPages) {
        const userData: User = {
          name: decoded.name, email: decoded.email, companyName: decoded.companyName,
          role: decoded.role, orgId: decoded.orgId, unidades: decoded.unidades,
          unidadesPermitidas: decoded.unidadesPermitidas,
          allowedPages: decoded.allowedPages,
          // Novos campos
          subscriptionStatus: decoded.subscriptionStatus,
          unidadeLimit: decoded.unidadeLimit,
          planType: decoded.planType,
        };
        setUser(userData);
        return userData;
      } else {
        throw new Error("Token recebido no login é inválido");
      }
    } catch {
      logout();
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setSelectedUnidade(null);
    setIsSidebarOpen(false);
  };

  const selectUnidade = (unidadeId: number) => {
    const unidade = user?.unidadesPermitidas.find((u) => u.id === unidadeId);
    if (unidade) {
      setSelectedUnidade(unidade);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const value = useMemo(
    () => ({ user, selectedUnidade, login, logout, selectUnidade, isSidebarOpen, toggleSidebar }),
    [user, selectedUnidade, isSidebarOpen],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext deve ser usado dentro de um AppProvider');
  }
  return context;
}