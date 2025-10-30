// Local: sabio-forno-app/src/pages/CustosOperacionaisPage.tsx

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAppContext } from '../contexts/AppContext';
import './CustosFixosPage.css'; // Reutiliza o mesmo CSS da página de Custos Fixos
import './PageStyles.css';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileDown, Inbox } from 'lucide-react';
import { EmptyState } from '../components/EmptyState'; // Importa o novo componente

// Interface para os dados que vêm da API
interface DespesaMensal {
  id: number;
  descricao: string;
  valor: number;
  fechamentoCaixa: { // A API inclui o fechamento para pegarmos a data
    data: string;
  };
}

export function CustosOperacionaisPage() {
  const { selectedUnidade } = useAppContext();
  const [data, setData] = useState(new Date());
  const [despesas, setDespesas] = useState<DespesaMensal[]>([]);
  const [loading, setLoading] = useState(true);

  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;

  useEffect(() => {
    if (!selectedUnidade) {
      setDespesas([]);
      setLoading(false);
      return;
    }
    
    async function fetchDespesas() {
        if (!selectedUnidade) return;
      setLoading(true);
      try {
        // Chama o novo endpoint da API de despesas
        const response = await api.get(`/despesas/mensal/${ano}/${mes}`, {
          params: { unidadeId: selectedUnidade.id }
        });
        setDespesas(response.data);
      } catch (error) {
        console.error("Erro ao buscar despesas mensais:", error);
        toast.error("Falha ao carregar o relatório de despesas.");
      } finally {
        setLoading(false);
      }
    }
    fetchDespesas();
  }, [ano, mes, selectedUnidade]);

  const changeMonth = (amount: number) => {
    setData(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const handleExportPdf = async () => {
    if (!selectedUnidade) return;
    const toastId = toast.loading('Gerando PDF do relatório...');
    try {
      const response = await api.get(`/despesas/mensal/${ano}/${mes}/export-pdf`, {
        params: { unidadeId: selectedUnidade.id },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-despesas-${ano}-${mes}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar PDF de despesas:', error);
      toast.error('Falha ao gerar o relatório.', { id: toastId });
    }
  };

  const totalDespesas = despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0);

  if (!selectedUnidade && !loading) {
    return <h2>Por favor, selecione uma unidade para ver o relatório de custos.</h2>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Custos Operacionais - {selectedUnidade?.name}</h1>
      <p className="page-subtitle">
        Relatório de todas as despesas operacionais (saídas de caixa) registradas no mês.
      </p>

      <div className="custos-top-controls">
        <div className="control-card">
          <label>Selecione o mês que deseja visualizar</label>
          <div className="month-selector-redesign">
            <button onClick={() => changeMonth(-1)} className="month-arrow">
              <ChevronLeft size={20} />
            </button>
            <span className="month-name">
              {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(data)}
            </span>
            <button onClick={() => changeMonth(1)} className="month-arrow">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="control-card summary-card-redesign">
          <label>Total de Despesas Operacionais</label>
          <span className="total-value-redesign">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}
          </span>
      <div className="export-button-container">
        <button onClick={handleExportPdf} className="control-button primary">
          <FileDown size={16} /> Exportar Relatório Mensal de Custos Operacionais
        </button>
      </div>
        </div>
      </div>


      <div className="custos-table-card">
        <h3 className="section-title-redesign">Detalhamento das Despesas</h3>
        {loading ? (
          <p>Carregando despesas...</p>
        ) : (
          <table className="custos-table-redesign">
            <thead>
              <tr>
                <th>Descrição da Despesa</th>
                <th>Data do Registro</th>
                <th>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
                {/* --- CORREÇÃO APLICADA AQUI --- */}
          {despesas.length === 0 ? (
            // Se a lista estiver vazia, renderiza o componente EmptyState
            <tr>
              <td colSpan={4} className="table-empty-state-cell">
                <EmptyState
                  icon={Inbox} // Um ícone mais apropriado para "vazio"
                  title="Nenhum Custo Operacional Encontrado"
                  message='Cadastre custos operacionais em Fluxo de Caixa e eles aparecerão aqui'
                />
              </td>
            </tr>
              ) : (
                despesas.map(despesa => (
                  <tr key={despesa.id}>
                    <td>{despesa.descricao}</td>
                    <td>{new Date(despesa.fechamentoCaixa.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(despesa.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}