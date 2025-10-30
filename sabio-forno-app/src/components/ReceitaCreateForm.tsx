// Local: sabio-forno-app/src/components/ReceitaCreateForm.tsx

import { useState, useEffect } from 'react';
import api from '../api/axios';
import './ReceitaCreateForm.css';
import type { Insumo } from '../pages/InsumosPage';
import type { ReceitaDetalhada } from '../pages/ReceitasPage';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface IngredienteItem {
  insumoId: number;
  nome: string;
  quantidade_usada: number;
  medida_usada: string;
}

interface ReceitaCreateFormProps {
  unidadeId: number | undefined;
  onReceitaAdded: () => void;
  receitaEmEdicao: ReceitaDetalhada | null;
  onReceitaUpdated: (receita: ReceitaDetalhada) => void;
  onCancelEdit: () => void;
}

export function ReceitaCreateForm({
  unidadeId,
  onReceitaAdded,
  receitaEmEdicao,
  onReceitaUpdated,
  onCancelEdit,
}: ReceitaCreateFormProps) {
  const [nome, setNome] = useState('');
  const [lucroDesejado, setLucroDesejado] = useState('');
  const [porcoes, setPorcoes] = useState('');
  const [temPorcoes, setTemPorcoes] = useState(false);
  const [ingredientes, setIngredientes] = useState<IngredienteItem[]>([]);
  const [allInsumos, setAllInsumos] = useState<Insumo[]>([]);
  const [selectedInsumoId, setSelectedInsumoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [medida, setMedida] = useState('g');
  
  // --- CORREÇÃO 1: Adiciona o estado 'isSubmitting' ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efeito para buscar os insumos da unidade selecionada
  useEffect(() => {
    if (!unidadeId) {
      setAllInsumos([]);
      return;
    }
    async function fetchAllInsumos() {
      try {
        const response = await api.get('/insumos', { params: { unidadeId } });
        setAllInsumos(response.data);
      } catch (error) {
        console.error('Erro ao buscar lista de insumos:', error);
      }
    }
    fetchAllInsumos();
  }, [unidadeId]);

  // Efeito para preencher o formulário quando o modo de edição é ativado
  useEffect(() => {
    if (receitaEmEdicao) {
      setNome(receitaEmEdicao.nome);
      setLucroDesejado(String(receitaEmEdicao.lucro_desejado));
      if (receitaEmEdicao.rendimento_porcoes && receitaEmEdicao.rendimento_porcoes > 0) {
        setTemPorcoes(true);
        setPorcoes(String(receitaEmEdicao.rendimento_porcoes));
      } else {
        setTemPorcoes(false);
        setPorcoes('');
      }
      setIngredientes(
        receitaEmEdicao.insumos.map((ins) => ({
          insumoId: ins.insumo.id,
          nome: ins.insumo.nome,
          quantidade_usada: ins.quantidade_usada,
          medida_usada: ins.medida_usada,
        })),
      );
    } else {
      // Se não estiver editando, reseta (útil ao cancelar)
      resetForm();
    }
  }, [receitaEmEdicao]);

  // --- CORREÇÃO 2: Cria a função de reset ---
  const resetForm = () => {
    setNome('');
    setLucroDesejado('');
    setPorcoes('');
    setTemPorcoes(false);
    setIngredientes([]);
    setSelectedInsumoId('');
    setQuantidade('');
    setMedida('g');
  };

  const handleAddIngrediente = () => {
    if (!selectedInsumoId || !quantidade) {
      toast.error('Selecione um insumo e defina a quantidade.');
      return;
    }
    const insumoSelecionado = allInsumos.find((i) => i.id === parseInt(selectedInsumoId));
    if (!insumoSelecionado) return;
    const novoIngrediente: IngredienteItem = {
      insumoId: insumoSelecionado.id,
      nome: insumoSelecionado.nome,
      quantidade_usada: parseFloat(quantidade),
      medida_usada: medida,
    };
    setIngredientes([...ingredientes, novoIngrediente]);
    setSelectedInsumoId('');
    setQuantidade('');
    setMedida('g');
  };

  const handleRemoveIngrediente = (indexToRemove: number) => {
    setIngredientes(ingredientes.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!unidadeId) {
      toast.error("Selecione uma unidade para salvar.");
      return;
    }
    if (ingredientes.length === 0) {
        toast.error("Adicione pelo menos um ingrediente.");
        return;
    }
    
    // --- CORREÇÃO 3: Desabilita o botão ---
    setIsSubmitting(true);

    const payload: any = {
      nome,
      lucro_desejado: parseFloat(lucroDesejado),
      insumos: ingredientes.map(({ insumoId, quantidade_usada, medida_usada }) => ({
        insumoId,
        quantidade_usada: parseFloat(String(quantidade_usada)),
        medida_usada,
      })),
    };
    if (temPorcoes && porcoes) {
      payload.rendimento_porcoes = parseInt(porcoes);
    }
    const promise = receitaEmEdicao
      ? api.patch(`/receitas/${receitaEmEdicao.id}`, payload, { params: { unidadeId } })
      : api.post('/receitas', payload, { params: { unidadeId } });

    toast.promise(promise, {
      loading: receitaEmEdicao ? 'Atualizando...' : 'Cadastrando...',
      success: (response) => {
        if (receitaEmEdicao) {
          onReceitaUpdated(response.data);
        } else {
          onReceitaAdded();
          // --- CORREÇÃO 4: Reseta o formulário após sucesso ---
          resetForm();
        }
        setIsSubmitting(false); // Reabilita o botão
        return receitaEmEdicao ? 'Receita atualizada!' : 'Receita cadastrada!';
      },
      error: (err) => {
        setIsSubmitting(false); // Reabilita o botão em caso de erro
        console.error('Erro ao salvar receita:', err);
        return 'Falha ao salvar receita.';
      },
    });
  };

  return (
    // Nomes de classe exclusivos para este componente
    <form className="receita-form-card" onSubmit={handleSubmit}>
      <h3 className="receita-form-title">{receitaEmEdicao ? 'Editar Receita' : 'Cadastrar Receita'}</h3>
      
      <div className="receita-form-group">
        <label htmlFor="nome-receita">Nome da Receita</label>
        <input id="nome-receita" type="text" placeholder="Ex: Torta de Frango" value={nome} onChange={(e) => setNome(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="receita-form-grid" style={{marginTop: '1rem'}}>
        <div className="receita-form-group">
          <label htmlFor="lucro-receita">Lucro Desejado (%)</label>
          <input id="lucro-receita" type="number" placeholder="Ex: 30" value={lucroDesejado} onChange={(e) => setLucroDesejado(e.target.value)} required disabled={isSubmitting} />
        </div>
        <div className="receita-form-group" style={{justifyContent: 'center'}}>
          <div className="receita-checkbox-item">
            <input type="checkbox" id="temPorcoes" checked={temPorcoes} onChange={(e) => setTemPorcoes(e.target.checked)} disabled={isSubmitting} />
            <label htmlFor="temPorcoes">É Vendido em Porções?</label>
          </div>
        </div>
      </div>
      {temPorcoes && (
        <div className="receita-form-group" style={{marginTop: '1rem'}}>
          <label htmlFor="porcoes-receita">Quantas porções?</label>
          <input id="porcoes-receita" type="number" placeholder="Ex: 8" value={porcoes} onChange={(e) => setPorcoes(e.target.value)} required={temPorcoes} disabled={isSubmitting} />
        </div>
      )}

      <div className="receita-sub-section">
        <h4 className="receita-sub-title">Adicionar Insumo</h4>
        <div className="receita-form-group">
          <label htmlFor="insumo-select">Insumo</label>
          <select id="insumo-select" value={selectedInsumoId} onChange={(e) => setSelectedInsumoId(e.target.value)} disabled={isSubmitting}>
            <option value="" disabled>Escolha um ingrediente pré-cadastrado</option>
            {allInsumos.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>{insumo.nome}</option>
            ))}
          </select>
        </div>
        <div className="receita-form-grid" style={{marginTop: '1rem'}}>
          <div className="receita-form-group">
            <label htmlFor="medida-select">Medida</label>
            <select id="medida-select" value={medida} onChange={(e) => setMedida(e.target.value)} disabled={isSubmitting}>
              <option value="g">g (grama)</option>
              <option value="kg">kg (kilograma)</option>
              <option value="ml">ml (mililitro)</option>
              <option value="l">l (litro)</option>
              <option value="unidade">unidade</option>
            </select>
          </div>
          <div className="receita-form-group">
            <label htmlFor="quantidade-insumo">Quantidade</label>
            <input id="quantidade-insumo" type="number" placeholder="Ex: 150" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} disabled={isSubmitting} />
          </div>
        </div>
        <button type="button" onClick={handleAddIngrediente} className="receita-form-button-secondary" disabled={isSubmitting}>
          <Plus size={18} /> Adicionar Insumo
        </button>
      </div>

      <div className="receita-sub-section">
        <h4 className="receita-sub-title">Ingredientes Adicionados</h4>
        <ul className="receita-preview-list">
          {ingredientes.length === 0 ? (
             <li className="receita-preview-empty">Nenhum ingrediente adicionado.</li>
          ) : (
            ingredientes.map((ing, index) => (
              <li key={index}>
                <span>{ing.nome} - {ing.quantidade_usada} {ing.medida_usada}</span>
                <Trash2 className="receita-icon-delete" size={18} onClick={() => handleRemoveIngrediente(index)} />
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="receita-form-actions">
        <button type="submit" className="receita-form-button-primary" disabled={isSubmitting}>
          {/* CORREÇÃO 5: Texto dinâmico do botão */}
          {isSubmitting ? 'Salvando...' : (receitaEmEdicao ? 'Salvar Alterações' : 'Cadastrar Receita')}
        </button>
        {receitaEmEdicao && (
          <button type="button" className="receita-form-button-cancel" onClick={onCancelEdit} disabled={isSubmitting}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}