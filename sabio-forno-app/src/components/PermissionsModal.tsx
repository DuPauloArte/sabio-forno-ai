// Local: sabio-forno-app/src/components/PermissionsModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../api/axios';
import './PermissionsModal.css';
import { useAppContext } from '../contexts/AppContext';
import toast from 'react-hot-toast';

interface Unidade {
  id: number;
  name: string;
}

// Interface para o usuário filho que vem da lista (básico)
interface ChildUserBasic {
  id: number;
  name: string;
  username: string;
}

// Interface para os detalhes do usuário filho, incluindo permissões
interface ChildUserWithPermissions extends ChildUserBasic {
  unidadesPermitidas: Unidade[];
  allowedPages: string[];
}

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  childUser: ChildUserBasic | null;
  organizationUnits: Unidade[]; // Todas as unidades da organização
}

// Define as páginas que podem ter permissão (exceto Caixa, que é padrão)
const PERMISSIONABLE_PAGES = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'insumos', name: 'Ingredientes' },
  { id: 'receitas', name: 'Receitas' },
  { id: 'custos', name: 'Custos Mensais' },
  { id: 'custos-operacionais', name: 'Custos Operacionais' }, // <-- Adicionado
];

export function PermissionsModal({
  isOpen,
  onClose,
  childUser,
  organizationUnits,
}: PermissionsModalProps) {
  const { user } = useAppContext(); // Pega o usuário Pai logado
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<number>>(new Set());
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set(['caixa'])); // 'caixa' sempre permitido
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    // Busca as permissões atuais quando o modal abre para um filho específico
    if (isOpen && childUser && user?.role === 'PAI') {
      setLoadingPermissions(true);
      const fetchCurrentPermissions = async () => {
        try {
          // Chama a API para buscar os detalhes do filho, incluindo permissões
          const response = await api.get(`/auth/children/${childUser.id}`);
          const detailedChild: ChildUserWithPermissions = response.data;

          // Preenche o estado com os IDs das unidades permitidas atuais
          const currentUnitIds = new Set(detailedChild.unidadesPermitidas.map(u => u.id));
          setSelectedUnitIds(currentUnitIds);

          // Preenche o estado com as páginas permitidas atuais (garantindo 'caixa')
          const currentPageIds = new Set(detailedChild.allowedPages || ['caixa']);
          currentPageIds.add('caixa'); // Garante que 'caixa' esteja sempre presente
          setSelectedPageIds(currentPageIds);

        } catch (error) {
          console.error("Erro ao buscar permissões atuais:", error);
          setSelectedUnitIds(new Set());
          setSelectedPageIds(new Set(['caixa'])); // Reseta para o default em caso de erro
        } finally {
            setLoadingPermissions(false);
        }
      };
      fetchCurrentPermissions();
    } else {
         // Limpa os estados quando o modal fecha ou não é o Pai
         setSelectedUnitIds(new Set());
         setSelectedPageIds(new Set(['caixa']));
    }
  }, [isOpen, childUser, user]); // Depende do 'user' para garantir que é o Pai

  // Handler para checkboxes de unidade
  const handleUnitCheckboxChange = (unitId: number) => {
    setSelectedUnitIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  // Handler para checkboxes de página
  const handlePageCheckboxChange = (pageId: string) => {
    if (pageId === 'caixa') return; // Não permite desmarcar 'caixa'

    setSelectedPageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  // Handler para salvar as permissões
  const handleSavePermissions = async () => {
    if (!childUser || !user || user.role !== 'PAI') return;
    try {
      await api.patch(`/auth/children/${childUser.id}/permissions`, {
        unidadeIds: Array.from(selectedUnitIds),
        allowedPages: Array.from(selectedPageIds), // Envia as páginas selecionadas
      });
      toast.success('Permissões atualizadas com sucesso!');
      onClose();
      // Pode ser necessário recarregar a página MinhaConta ou atualizar o token global
      // window.location.reload(); // Solução simples por enquanto
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast.error('Falha ao salvar permissões.');
    }
  };

  if (!childUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Permissões - ${childUser.name}`}>
      <div className="permissions-modal-content">
        {loadingPermissions ? <p>Carregando permissões...</p> : (
          <>
            <h4>Selecione as unidades que {childUser.name} pode acessar:</h4>
            <div className="unit-checkbox-list">
              {organizationUnits.map(unit => (
                <div key={unit.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`perm-unit-${unit.id}-${childUser.id}`} // ID único
                    checked={selectedUnitIds.has(unit.id)}
                    onChange={() => handleUnitCheckboxChange(unit.id)}
                  />
                  <label htmlFor={`perm-unit-${unit.id}-${childUser.id}`}>{unit.name}</label>
                </div>
              ))}
            </div>

            <hr className="divider"/>

            <h4>Selecione as páginas que {childUser.name} pode acessar:</h4>
            <div className="page-checkbox-list">
              <div className="checkbox-item disabled">
                  <input type="checkbox" id={`page-caixa-${childUser.id}`} checked disabled />
                  <label htmlFor={`page-caixa-${childUser.id}`}>Fluxo de Caixa (Sempre Permitido)</label>
              </div>
              {PERMISSIONABLE_PAGES.map(page => (
                <div key={page.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`page-${page.id}-${childUser.id}`} // ID único
                    checked={selectedPageIds.has(page.id)}
                    onChange={() => handlePageCheckboxChange(page.id)}
                  />
                  <label htmlFor={`page-${page.id}-${childUser.id}`}>{page.name}</label>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="modal-actions">
          <button onClick={onClose} className="cancel-button">Cancelar</button>
          <button onClick={handleSavePermissions} className="save-button" disabled={loadingPermissions}>Salvar Permissões</button>
        </div>
      </div>
    </Modal>
  );
}