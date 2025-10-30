// Local: sabio-forno-app/src/pages/MinhaContaPage.tsx
import { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import api from '../api/axios';
import { Pencil, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react';
/* import { Modal } from '../components/Modal'; */ // Modal é usado pelos outros modais
import { PermissionsModal } from '../components/PermissionsModal';
import { EditChildUserModal } from '../components/EditChildUserModal';
import './MinhaContaPage.css'; // Importa o novo CSS
import './PageStyles.css'; // Importa os estilos de título
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner'; // 1. Importe o Spinner
import { EmptyState } from '../components/EmptyState'; // Importa o novo componente
import { UserRoundPlus } from 'lucide-react';

interface Unidade {
  id: number;
  name: string;
}

interface ChildUser {
  id: number;
  name: string;
  username: string;
  createdAt: string;
}

export function MinhaContaPage() {
  const { user } = useAppContext();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [childUsers, setChildUsers] = useState<ChildUser[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [, setLoadingChildren] = useState(true);

  // Estados para formulários
  const [novoNomeUnidade, setNovoNomeUnidade] = useState('');
  const [childName, setChildName] = useState('');
  const [childUsername, setChildUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [showChildPassword, setShowChildPassword] = useState(false); // Estado para o formulário de criar filho

  // Estados para Modais
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedChildUser, setSelectedChildUser] = useState<ChildUser | null>(null);

  // --- Funções de busca de dados ---
  const fetchUnidades = async () => {
    if (user?.role !== 'PAI') {
      setLoadingUnidades(false);
      return;
    }
    setLoadingUnidades(true);
    try {
      const response = await api.get('/unidades');
      setUnidades(response.data);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const fetchChildUsers = async () => {
    if (user?.role !== 'PAI') {
      setLoadingChildren(false);
      return;
    }
    setLoadingChildren(true);
    try {
      const response = await api.get('/auth/children');
      setChildUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários filho:", error);
    } finally {
      setLoadingChildren(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'PAI') {
      fetchUnidades();
      fetchChildUsers();
    } else {
      setLoadingUnidades(false);
      setLoadingChildren(false);
    }
  }, [user]);

  // --- Handlers de Unidades ---
  const handleCreateUnidade = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o envio do formulário
    if (!novoNomeUnidade.trim()) return;
    try {
      await api.post('/unidades', { name: novoNomeUnidade });
      setNovoNomeUnidade('');
      await fetchUnidades();
      toast.success("Unidade criada! Recarregando para atualizar o menu...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error("Erro ao criar unidade.");
      console.error("Erro ao criar unidade:", error);
    }
  };

  const handleRenameUnidade = async (id: number, currentName: string) => {
    const newName = prompt("Digite o novo nome para a unidade:", currentName);
    if (newName && newName.trim() && newName !== currentName) {
      const promise = api.patch(`/unidades/${id}`, { name: newName });
      toast.promise(promise, {
        loading: <LoadingSpinner text="Renomeando..." />,
        success: () => {
          fetchUnidades();
          setTimeout(() => window.location.reload(), 1000);
          return 'Unidade renomeada! Recarregando...';
        },
        error: 'Erro ao renomear unidade.',
      });
    }
  };

  const handleDeleteUnidade = async (id: number) => {
    if (window.confirm("Tem certeza que deseja deletar esta unidade? Todos os dados associados (insumos, receitas, caixa) podem ser perdidos. Esta ação não pode ser desfeita.")) {
      const promise = api.delete(`/unidades/${id}`);
      toast.promise(promise, {
        loading: <LoadingSpinner text="Deletando Unidade..." />,
        success: () => {
          fetchUnidades();
          setTimeout(() => window.location.reload(), 1000);
          return 'Unidade deletada! Recarregando...';
        },
        error: (err) => {
          console.error("Erro ao deletar unidade:", err);
          return 'Erro ao deletar. Verifique se a unidade não possui dados associados.';
        }
      });
    }
  };

  // --- Handlers de Usuários Filho ---
  const handleCreateChildUser = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede o envio do formulário
    if (!childName.trim() || !childUsername.trim() || !childPassword.trim()) {
      toast.error("Preencha todos os campos para o novo usuário.");
      return;
    }
    const promise = api.post('/auth/children', {
      name: childName,
      username: childUsername,
      password: childPassword,
    });

    toast.promise(promise, {
      loading: <LoadingSpinner text="Criando Usuário..." />,
      success: () => {
        setChildName('');
        setChildUsername('');
        setChildPassword('');
        fetchChildUsers(); // Rebusca a lista
        return 'Usuário filho criado com sucesso!';
      },
      error: (err: any) => {
        if (err.response && err.response.status === 409) {
          return 'Este nome de usuário já está em uso.';
        }
        return 'Erro ao criar usuário filho.';
      }
    });
  };

  const handleDeleteChildUser = async (id: number) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário filho?")) {
      const promise = api.delete(`/auth/children/${id}`);
      toast.promise(promise, {
        loading: <LoadingSpinner text="Deletando Usuário..." />,
        success: () => {
          fetchChildUsers(); // Rebusca a lista
          return 'Usuário filho deletado com sucesso!';
        },
        error: 'Erro ao deletar usuário filho.',
      });
    }
  };

  // --- Handlers de Modais ---
  const handleOpenPermissionsModal = (child: ChildUser) => {
    setSelectedChildUser(child);
    setIsPermissionsModalOpen(true);
  };
  const handleClosePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedChildUser(null);
  };
  const handleOpenEditUserModal = (child: ChildUser) => {
    setSelectedChildUser(child);
    setIsEditUserModalOpen(true);
  };
  const handleCloseEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setSelectedChildUser(null);
  };
  const handleUserUpdated = () => {
    fetchChildUsers(); // Rebusca a lista de usuários após a edição
  };

  // --- JSX (Totalmente Reescrito para o Novo Design) ---
  return (
    <div className="page-container">
      <h1 className="page-title">Minha Conta</h1>
      <p className="page-subtitle">
        Veja aqui os dados da sua conta, os dados do seu plano como benefícios e vencimento, e também gerencie usuários responsáveis
      </p>

      {/* Grid principal da página da conta */}
      <div className="conta-grid-container">

        {/* Card 1: Meus Dados */}
        <div className="conta-card">
          <h3 className="conta-card-title">Meus Dados</h3>
          <div className="user-data-list">
            <div className="user-data-item">
              <span>Nome:</span>
              <strong>{user?.name}</strong>
            </div>
            <div className="user-data-item">
              <span>Email:</span>
              <strong>{user?.email}</strong>
            </div>
            <div className="user-data-item">
              <span>Empresa:</span>
              <strong>{user?.companyName}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Meus Plano (Fictício) */}
        <div className="conta-card">
          <h3 className="conta-card-title">Meus Plano</h3>
          <div className="plano-content">
            <span className="plano-nome">Essencial</span>
            <p className="plano-descricao">
              Acesso básico às ferramentas de gestão.
              (Esta é uma seção fictícia para o redesign).
            </p>
            <button className="plano-button" disabled>Alterar Plano</button>
          </div>
        </div>

        {/* Card 3: Gerenciar Unidades (Apenas para PAI) */}
        {user?.role === 'PAI' && (
          <div className="conta-card span-col-2">
            <h3 className="conta-card-title">Gerenciar Unidades</h3>
            {/* Formulário de Adicionar Unidade */}
            <form className="unidade-add-form-wrapper" onSubmit={handleCreateUnidade}>
              <div className="form-group-redesign"> 
                <label htmlFor="nome-unidade">Nome da Nova Unidade</label>
                <div className="unidade-add-form"> 
                  <input
                    id="nome-unidade"
                    type="text"
                    placeholder="Nome da nova unidade"
                    value={novoNomeUnidade}
                    onChange={(e) => setNovoNomeUnidade(e.target.value)}
                    autoComplete="off" // Desativa autocomplete
                  />
                  <button type="submit" className="form-button-redesign">Adicionar</button>
                </div>
              </div>
            </form>
            
            {/* Lista de Unidades */}
            <ul className="gerenciamento-list">
              {loadingUnidades ? <p>Carregando unidades...</p> : unidades.map(unidade => (
                <li key={unidade.id}>
                  <span>{unidade.name}</span>
                  <div className="actions">
                    <Pencil className="icon-redesign icon-edit-redesign" size={18} onClick={() => handleRenameUnidade(unidade.id, unidade.name)} />
                    <Trash2 className="icon-redesign icon-delete-redesign" size={18} onClick={() => handleDeleteUnidade(unidade.id)} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Card 4: Gerenciar Usuários Filho (Apenas para PAI) */}
        {user?.role === 'PAI' && (
          <div className="conta-card span-col-2">
            <h3 className="conta-card-title">Gerenciar Usuários Filho</h3>
            {/* Formulário de Adicionar Filho */}
            <form className="child-user-add-form" onSubmit={handleCreateChildUser}>
              <div className="form-group-redesign">
                <label htmlFor="child-name">Nome do Usuário</label>
                <input 
                  id="child-name" 
                  type="text" 
                  placeholder="Ex: André - Gerente" 
                  value={childName} 
                  onChange={e => setChildName(e.target.value)} 
                  autoComplete="off"
                />
              </div>
              <div className="form-group-redesign">
                <label htmlFor="child-username">Usuário (sem espaços)</label>
                <input 
                  id="child-username" 
                  type="text" 
                  placeholder="Ex: andre01" 
                  value={childUsername} 
                  onChange={e => setChildUsername(e.target.value)} 
                  autoComplete="off"
                />
              </div>
              <div className="form-group-redesign">
                <label htmlFor="child-password">Senha do Usuário</label>
                <div className="password-input-wrapper-redesign">
                  <input
                    id="child-password"
                    type={showChildPassword ? 'text' : 'password'}
                    placeholder="Mín. 6 caracteres"
                    value={childPassword}
                    onChange={e => setChildPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  {showChildPassword ? (
                    <EyeOff className="password-toggle-icon-redesign" size={20} onClick={() => setShowChildPassword(false)} />
                  ) : (
                    <Eye className="password-toggle-icon-redesign" size={20} onClick={() => setShowChildPassword(true)} />
                  )}
                </div>
              </div>
              <button type="submit" className="form-button-redesign">Adicionar</button>
            </form>
            
            {/* Tabela de Usuários Filho */}
            <table className="child-user-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {/* --- CORREÇÃO APLICADA AQUI --- */}
          {childUsers.length === 0 ? (
            // Se a lista estiver vazia, renderiza o componente EmptyState
            <tr>
              <td colSpan={4} className="table-empty-state-cell">
                <EmptyState
                  icon={UserRoundPlus} // Um ícone mais apropriado para "vazio"
                  title="Nenhum Usuário Filho Encontrado"
                  message='Cadastre um novo usuário filho no furmulário acima'
                />
              </td>
            </tr>
                ) : (
                  childUsers.map(child => (
                    <tr key={child.id}>
                      <td>{child.name}</td>
                      <td>{child.username}</td>
                      <td className="actions-cell">
                        <Pencil className="icon-redesign icon-edit-redesign" size={18} onClick={() => handleOpenEditUserModal(child)} />
                        <KeyRound className="icon-redesign icon-permissions" size={18} onClick={() => handleOpenPermissionsModal(child)} />
                        <Trash2 className="icon-redesign icon-delete-redesign" size={18} onClick={() => handleDeleteChildUser(child.id)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div> {/* Fim do .conta-grid-container */}

      {/* --- Renderização dos Modais (ficam fora do grid) --- */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={handleClosePermissionsModal}
        childUser={selectedChildUser}
        organizationUnits={unidades}
      />
      <EditChildUserModal
        isOpen={isEditUserModalOpen}
        onClose={handleCloseEditUserModal}
        childUser={selectedChildUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );

}