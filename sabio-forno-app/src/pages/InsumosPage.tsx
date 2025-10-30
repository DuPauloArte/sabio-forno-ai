// Local: sabio-forno-app/src/pages/InsumosPage.tsx

import { useState, useEffect, useRef } from 'react'; // 1. Importa 'useRef'
import api from '../api/axios';
import { InsumoForm } from '../components/InsumoForm';
import { InsumoTable } from '../components/InsumoTable';
import { useAppContext } from '../contexts/AppContext';
import './PageStyles.css';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner'; // Importa o LoadingSpinner

export interface Insumo {
  id: number;
  nome: string;
  unidade_compra: string;
  valor_unidade_compra: number;
}

export function InsumosPage() {
  const { selectedUnidade } = useAppContext();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [insumoEmEdicao, setInsumoEmEdicao] = useState<Insumo | null>(null);
  const [filtroDeBusca, setFiltroDeBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // 2. Cria um 'ref' para o container do formulário
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedUnidade) {
      setInsumos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    async function fetchInsumos() {
      if (!selectedUnidade) return;
      try {
        const response = await api.get('/insumos', {
          params: { unidadeId: selectedUnidade.id },
        });
        setInsumos(response.data);
      } catch (error) {
        console.error('Erro ao buscar insumos:', error);
        toast.error("Falha ao carregar insumos.");
      } finally {
        setLoading(false);
      }
    }
    fetchInsumos();
  }, [selectedUnidade]);

  const handleAddInsumo = (novoInsumo: Insumo) => {
    setInsumos((listaAnterior) => [...listaAnterior, novoInsumo]);
  };

  const handleDeleteInsumo = async (id: number) => {
    if (!selectedUnidade) return;
    const promise = api.delete(`/insumos/${id}`, {
      params: { unidadeId: selectedUnidade.id },
    });
    toast.promise(promise, {
      loading: 'Deletando insumo...',
      success: () => {
        setInsumos((listaAnterior) =>
          listaAnterior.filter((insumo) => insumo.id !== id),
        );
        return 'Insumo deletado!';
      },
      error: (err) => {
        console.error('Erro ao deletar insumo:', err);
        return 'Falha ao deletar insumo.';
      }
    });
  };

  const handleEditInsumo = (insumo: Insumo) => {
    setInsumoEmEdicao(insumo);
    
    // 3. Adiciona a lógica de scroll
    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: 'smooth', // Rolagem suave
        block: 'start',    // Alinha o topo do formulário com o topo da tela
      });
    }
  };

  const handleCancelEdit = () => {
    setInsumoEmEdicao(null);
  };

  const handleUpdateInsumo = (insumoAtualizado: Insumo) => {
    setInsumos((listaAnterior) =>
      listaAnterior.map((insumo) =>
        insumo.id === insumoAtualizado.id ? insumoAtualizado : insumo,
      ),
    );
    setInsumoEmEdicao(null);
  };

  const insumosFiltrados = insumos.filter(insumo => 
    insumo.nome.toLowerCase().includes(filtroDeBusca.toLowerCase())
  );

  if (!selectedUnidade && !loading) {
    return <h2>Por favor, selecione uma unidade para gerenciar os ingredientes.</h2>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Ingredientes</h1>
      <p className="page-subtitle">Aqui você pode ver e cadastrar insumos para suas unidades</p>

      {/* 4. Anexa o 'ref' ao 'div' que envolve o formulário */}
      <div ref={formRef}>
        <InsumoForm
          unidadeId={selectedUnidade?.id}
          onInsumoAdded={handleAddInsumo}
          insumoEmEdicao={insumoEmEdicao}
          onInsumoUpdated={handleUpdateInsumo}
          onCancelEdit={handleCancelEdit}
        />
      </div>
      
      {loading ? (
        <LoadingSpinner text="Carregando insumos..." />
      ) : (
        <InsumoTable
          insumos={insumosFiltrados}
          onDeleteInsumo={handleDeleteInsumo}
          onEditInsumo={handleEditInsumo}
          filtro={filtroDeBusca}
          onFiltroChange={setFiltroDeBusca}
        />
      )}
    </div>
  );
}