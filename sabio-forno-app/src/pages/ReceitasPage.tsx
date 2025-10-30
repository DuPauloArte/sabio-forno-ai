// Local: sabio-forno-app/src/pages/ReceitasPage.tsx

import { useState, useEffect, useRef } from 'react'; // 1. Importa 'useRef'
import api from '../api/axios';
import { ReceitaList } from '../components/ReceitaList';
import { ReceitaDetail } from '../components/ReceitaDetail';
import { ReceitaCreateForm } from '../components/ReceitaCreateForm';
import { useAppContext } from '../contexts/AppContext';
import './ReceitasPage.css';
import './PageStyles.css';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner'; // Importa o LoadingSpinner

// --- Interfaces ---
interface InsumoBase { id: number; nome: string; }
interface InsumoCalculado { id: number; quantidade_usada: number; medida_usada: string; custo: number; insumo: InsumoBase; }
export interface ReceitaDetalhada { id: number; nome: string; rendimento_porcoes: number; lucro_desejado: number; valor_praticado: number; insumos: InsumoCalculado[]; custoTotalReceita: number; precoSugeridoTotal: number; precoSugeridoPorcao: number; }
interface Receita { id: number; nome: string; }

// --- Componente da Página ---
export function ReceitasPage() {
  const { selectedUnidade } = useAppContext();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [receitaSelecionada, setReceitaSelecionada] = useState<ReceitaDetalhada | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [receitaEmEdicao, setReceitaEmEdicao] = useState<ReceitaDetalhada | null>(null);
  const [filtroDeBusca, setFiltroDeBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // 2. Cria um 'ref' para a coluna do formulário
  const formColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedUnidade) {
      setReceitas([]);
      setReceitaSelecionada(null);
      setLoading(false);
      return;
    }
    
    const unidadeIdAtual = selectedUnidade.id;
    
    async function fetchReceitas() {
      setLoading(true);
      try {
        const response = await api.get('/receitas', {
          params: { unidadeId: unidadeIdAtual },
        });
        setReceitas(response.data);
      } catch (error) {
        console.error("Erro ao buscar receitas:", error);
        toast.error("Falha ao carregar lista de receitas.");
      } finally {
        setLoading(false);
      }
    }
    fetchReceitas();
    if (needsRefresh) setNeedsRefresh(false);
  }, [selectedUnidade, needsRefresh]);

  const handleSelectReceita = async (id: number) => {
    if (!selectedUnidade) return;
    if (receitaSelecionada?.id === id) return;
    
    setReceitaSelecionada(null);
    setReceitaEmEdicao(null);
    const toastId = toast.loading("Carregando detalhes...");
    
    try {
      const response = await api.get(`/receitas/${id}`, {
        params: { unidadeId: selectedUnidade.id },
      });
      setReceitaSelecionada(response.data);
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Erro ao buscar detalhes da receita:", error);
      toast.error("Falha ao carregar detalhes da receita.", { id: toastId });
      setReceitaSelecionada(null);
    }
  };

  const handleDeleteReceita = async (id: number) => {
    if (!selectedUnidade) return;
    if (window.confirm('Tem certeza que deseja deletar esta receita?')) {
        const promise = api.delete(`/receitas/${id}`, { params: { unidadeId: selectedUnidade.id } });
        toast.promise(promise, {
            loading: 'Deletando receita...',
            success: () => {
                setReceitas(lista => lista.filter(r => r.id !== id));
                setReceitaSelecionada(null);
                setReceitaEmEdicao(null);
                return 'Receita deletada!';
            },
            error: (err) => {
                console.error('Erro ao deletar receita:', err);
                return 'Falha ao deletar receita.';
            }
        });
    }
  };

  /* const handleUpdateValorPraticado = async (id: number, novoValor: number): Promise<boolean> => {
    if (!selectedUnidade) return false;
    try {
      const response = await api.patch(`/receitas/${id}`, { valor_praticado: novoValor }, {
        params: { unidadeId: selectedUnidade.id },
      });
      setReceitaSelecionada(response.data);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      return false;
    }
  }; */

  const handleReceitaAdded = () => {
    setNeedsRefresh(true);
    setReceitaEmEdicao(null);
  };

  const handleEditReceita = () => {
    if (receitaSelecionada) {
      setReceitaEmEdicao(receitaSelecionada);
      
      // 3. Adiciona a lógica de scroll
      if (formColumnRef.current) {
        formColumnRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start', // Rola para o topo da coluna do formulário
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setReceitaEmEdicao(null);
  };

  const handleReceitaUpdated = (receitaAtualizada: ReceitaDetalhada) => {
    setReceitas(lista => lista.map(r => r.id === receitaAtualizada.id ? { ...r, nome: receitaAtualizada.nome } : r));
    setReceitaSelecionada(receitaAtualizada);
    setReceitaEmEdicao(null);
  };

  const receitasFiltradas = receitas.filter(r => r.nome.toLowerCase().includes(filtroDeBusca.toLowerCase()));

  if (!selectedUnidade && !loading) {
    return <h2>Por favor, selecione uma unidade para gerenciar as receitas.</h2>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Receitas - {selectedUnidade?.name}</h1>
      <p className="page-subtitle">Aqui você pode ver e cadastrar receitas para {selectedUnidade?.name}</p>
      
      <div className="receitas-page-container-redesign">
        <div className="column-redesign list-column-redesign">
          {loading ? <LoadingSpinner text="Carregando lista..." /> : (
            <ReceitaList
              receitas={receitasFiltradas}
              onSelectReceita={handleSelectReceita}
              selectedReceitaId={receitaSelecionada?.id || null}
              filtro={filtroDeBusca}
              onFiltroChange={setFiltroDeBusca}
            />
          )}
        </div>

        <div className="column-redesign detail-column-redesign">
          <ReceitaDetail
            receita={receitaSelecionada}
            onDeleteReceita={handleDeleteReceita}
            /* onUpdateValorPraticado={handleUpdateValorPraticado} */
            onEditReceita={handleEditReceita}
          />
        </div>

        {/* 4. Anexa o 'ref' à 'div' da coluna do formulário */}
        <div className="column-redesign form-column-redesign" ref={formColumnRef}>
          <ReceitaCreateForm
            unidadeId={selectedUnidade?.id}
            onReceitaAdded={handleReceitaAdded}
            receitaEmEdicao={receitaEmEdicao}
            onReceitaUpdated={handleReceitaUpdated}
            onCancelEdit={handleCancelEdit}
          />
        </div>
      </div>
    </div>
  );
}