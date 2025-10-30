// Local: sabio-forno-app/src/components/ReceitaDetail.tsx

import type { ReceitaDetalhada } from '../pages/ReceitasPage';
import './ReceitaDetail.css';
import { Pencil, Trash2, FileDown } from 'lucide-react'; // Importa FileDown
import api from '../api/axios'; // Importa api
import { useAppContext } from '../contexts/AppContext'; // Importa contexto
import toast from 'react-hot-toast';
/* import toast from 'react-hot-toast'; */

interface ReceitaDetailProps {
  receita: ReceitaDetalhada | null;
  onDeleteReceita: (id: number) => void;
  // onUpdateValorPraticado removido
  onEditReceita: () => void;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ReceitaDetail({
  receita,
  onDeleteReceita,
  onEditReceita,
}: ReceitaDetailProps) {

  const { selectedUnidade } = useAppContext(); // Pega a unidade

  // --- NOVA FUNÇÃO DE EXPORTAÇÃO ---
  const handleExportReceitaPdf = async () => {
    if (!receita || !selectedUnidade) return;
    
    const toastId = toast.loading('Gerando Ficha Técnica...');
    try {
      const response = await api.get(`/receitas/${receita.id}/export-pdf`, {
        params: { unidadeId: selectedUnidade.id },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-tecnica-${receita.nome}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Ficha Técnica gerada com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar PDF da receita:', error);
      toast.error('Falha ao gerar a ficha técnica.', { id: toastId });
    }
  };

  // Se nenhuma receita estiver selecionada, mostra o placeholder
  if (!receita) {
    return (
      <div className="receita-detail-placeholder-redesign">
        <h3>Selecione uma receita da lista para ver os detalhes.</h3>
      </div>
    );
  }

  // Garante que os dados existem antes de usar
  const insumosValidos = Array.isArray(receita.insumos) ? receita.insumos : [];
  const variacaoMin = (receita.precoSugeridoTotal || 0) * 0.97;
  const variacaoMax = (receita.precoSugeridoTotal || 0) * 1.03;

  return (
    <div className="receita-detail-redesign">
      <h2 className="receita-title-redesign">Receita de {receita.nome}</h2>

      {/* Card de Custo Atual (similar ao StatCard) */}
      <div className="receita-stat-card-redesign">
        <h4>Atualmente essa receita Custa</h4>
        <span>{formatCurrency(receita.custoTotalReceita)}</span>
      </div>

      {/* Tabela de Ingredientes */}
      <h3 className="section-title-redesign">Ingredientes</h3>
      <table className="ingredientes-table-redesign">
        <thead>
          <tr>
            <th>Insumos</th>
            <th>Qtd</th>
            <th>Custo (R$)</th>
          </tr>
        </thead>
        <tbody>
          {insumosValidos.map((item) => (
            <tr key={item.id}>
              <td>{item.insumo?.nome || 'Insumo inválido'}</td>
              <td>{`${item.quantidade_usada} ${item.medida_usada}`}</td>
              <td>{formatCurrency(item.custo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Grid de Preços */}
      <div className="pricing-grid-redesign">
        <div className="pricing-box-redesign ideal-price-redesign">
          <span>Preço sugerido ideal ({Number(receita.lucro_desejado)}%)</span>
          <strong>{formatCurrency(receita.precoSugeridoTotal)}</strong>
        </div>
        
        {/* Renderiza o card de porção apenas se houver porções */}
        {receita.rendimento_porcoes && receita.rendimento_porcoes > 0 && (
          <div className="pricing-box-redesign">
            <span>Preço sugerido por porção</span>
            <strong>{formatCurrency(receita.precoSugeridoPorcao)}</strong>
          </div>
        )}
      </div>

      {/* Card de Variação */}
      <div className="variation-box-redesign">
        <span>Variação Sugerida</span>
        <strong>{formatCurrency(variacaoMin)} - {formatCurrency(variacaoMax)}</strong>
      </div>

      {/* Botões de Ação */}
      <div className="action-buttons-container-redesign">
        <button className="export-button-redesign" onClick={handleExportReceitaPdf}>
          <FileDown size={16} /> Exportar Ficha
        </button>

        <button className="edit-button-redesign" onClick={onEditReceita}>
          <Pencil size={16} /> Editar Receita
        </button>
        <button
          className="delete-button-redesign"
          onClick={() => onDeleteReceita(receita.id)}
        >
          <Trash2 size={16} /> Deletar Receita
        </button>
      </div>
    </div>
  );
}