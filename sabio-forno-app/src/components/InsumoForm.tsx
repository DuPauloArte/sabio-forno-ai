// Local: sabio-forno-app/src/components/InsumoForm.tsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Insumo } from '../pages/InsumosPage';
import './InsumoForm.css'
import toast from 'react-hot-toast';
// Voltamos ao input normal, conforme sua solicitação
// import CurrencyInput from 'react-currency-input-field';

interface InsumoFormProps {
  unidadeId: number | undefined;
  onInsumoAdded: (novoInsumo: Insumo) => void;
  insumoEmEdicao: Insumo | null;
  onInsumoUpdated: (insumoAtualizado: Insumo) => void;
  onCancelEdit: () => void;
}

export function InsumoForm({
  unidadeId,
  onInsumoAdded,
  insumoEmEdicao,
  onInsumoUpdated,
  onCancelEdit,
}: InsumoFormProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('');
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (insumoEmEdicao) {
      setNome(insumoEmEdicao.nome);
      setUnidade(insumoEmEdicao.unidade_compra);
      setValor(String(insumoEmEdicao.valor_unidade_compra));
    } else {
      setNome('');
      setUnidade('');
      setValor('');
    }
  }, [insumoEmEdicao]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!unidadeId) {
      toast.error("Por favor, selecione uma unidade para poder salvar.");
      return;
    }
    const valorNumerico = parseFloat(valor);
    if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
        toast.error("Por favor, insira um valor numérico válido para o insumo.");
        return;
    }

    const dadosDoInsumo = {
      nome,
      unidade_compra: unidade,
      valor_unidade_compra: valorNumerico,
    };

    const promise = insumoEmEdicao
      ? api.patch(`/insumos/${insumoEmEdicao.id}`, dadosDoInsumo, { params: { unidadeId } })
      : api.post('/insumos', dadosDoInsumo, { params: { unidadeId } });

    toast.promise(promise, {
      loading: insumoEmEdicao ? 'Atualizando insumo...' : 'Cadastrando insumo...',
      success: (response) => {
        if (insumoEmEdicao) {
          onInsumoUpdated(response.data);
        } else {
          onInsumoAdded(response.data);
          setNome('');
          setUnidade('');
          setValor('');
        }
        return insumoEmEdicao ? 'Insumo atualizado!' : 'Insumo cadastrado!';
      },
      error: (err) => {
        console.error('Erro ao salvar insumo:', err);
        return 'Falha ao salvar o insumo.';
      },
    });
  };

  return (
    // Usa a nova classe de 'card' do design
    <div className="form-card-redesign">
      <h3 className="form-title-redesign">Cadastrar um novo Insumo</h3>
      <form onSubmit={handleSubmit}>
        {/* Nova estrutura de grid para os campos */}
        <div className="form-grid-redesign">
          <div className="form-group-redesign">
            <label htmlFor="nome-insumo">Nome do Insumo</label>
            <input 
              id="nome-insumo"
              type="text" 
              placeholder="Ex: Farinha de Trigo" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group-redesign">
            <label htmlFor="unidade-compra">Unidade de Compra</label>
            <select 
              id="unidade-compra"
              value={unidade} 
              onChange={(e) => setUnidade(e.target.value)} 
              required 
            >
              <option value="" disabled>Selecione uma unidade de medida</option>
              <option value="kilograma">Kilograma (kg)</option>
              <option value="grama">Grama (g)</option>
              <option value="litro">Litro (l)</option>
              <option value="mililitro">Mililitro (ml)</option>
              <option value="unidade">Unidade (un)</option>
            </select>
          </div>
          {/* Campo de Valor que faltava no design, mas é necessário */}
          <div className="form-group-redesign">
            <label htmlFor="valor-compra">Valor da unidade de compra (R$)</label>
            <input
              id="valor-compra"
              type="number"
              placeholder="Ex: 5.50"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              min="0.01"
            />
          </div>
        </div>
        <div className="form-actions-redesign">
          <button type="submit" className="form-button-redesign">
            {insumoEmEdicao ? 'Atualizar Insumo' : 'Cadastrar'}
          </button>
          {insumoEmEdicao && (
            <button type="button" className="form-button-cancel-redesign" onClick={onCancelEdit}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}