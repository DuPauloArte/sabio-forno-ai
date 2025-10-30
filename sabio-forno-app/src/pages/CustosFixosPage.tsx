// Local: sabio-forno-app/src/pages/CustosFixosPage.tsx

import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAppContext } from '../contexts/AppContext';
import './CustosFixosPage.css' // Importa o novo CSS
import './PageStyles.css'; // Importa os estilos de título
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FileDown, Inbox } from 'lucide-react'; // Importa ícone
import { LoadingSpinner } from '../components/LoadingSpinner'; // 1. Importe o Spinner
import { EmptyState } from '../components/EmptyState'; // Importa o novo componente

// Interface para os dados que vêm da API
interface CustoRegistrado {
  id: number;
  nome: string;
  mes: number;
  ano: number;
  valor: number;
  status: 'PENDENTE' | 'PAGO';
  dataPagamento: string;
}

export function CustosFixosPage() {
  const { selectedUnidade } = useAppContext();
  const [data, setData] = useState(new Date()); // Controla o mês e ano
  const [custos, setCustos] = useState<CustoRegistrado[]>([]);
  const [loading, setLoading] = useState(true);

  const ano = data.getFullYear();
  const mes = data.getMonth() + 1; // getMonth() é 0-11, então adicionamos 1

  useEffect(() => {
    // Não busca dados se nenhuma unidade estiver selecionada
    if (!selectedUnidade) {
      setCustos([]);
      setLoading(false);
      return;
    }
    
    async function fetchCustos() {
      if (!selectedUnidade) return false;
      setLoading(true);
      try {
        // Chama o endpoint correto que busca os custos registrados
        const response = await api.get(`/pagamentos/custos-registrados/${ano}/${mes}`, {
          params: { unidadeId: selectedUnidade.id }
        });
        setCustos(response.data);
      } catch (error) {
        console.error("Erro ao buscar custos registrados:", error);
        toast.error("Falha ao carregar o relatório de custos.");
      } finally {
        setLoading(false);
      }
    }
    fetchCustos();
  }, [ano, mes, selectedUnidade]); // Re-busca se o mês, ano ou unidade mudar

  // Função para navegar entre os meses
  const changeMonth = (amount: number) => {
    setData(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1); // Garante que estamos no dia 1 para evitar saltos de mês
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  // Calcula o total de custos do mês
  const totalCustos = custos.reduce((acc, custo) => acc + Number(custo.valor), 0);

  const handleExportCustosPdf = async () => {
    if (!selectedUnidade) return;
    const toastId = toast.loading('Gerando PDF do relatório...');
    try {
      const response = await api.get(`/pagamentos/custos-registrados/${ano}/${mes}/export-pdf`, {
        params: { unidadeId: selectedUnidade.id },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-custos-${ano}-${mes}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar PDF de custos:', error);
      toast.error('Falha ao gerar o relatório.', { id: toastId });
    }
  };

  // Renderização condicional
  if (!selectedUnidade && !loading) {
    return <h2>Por favor, selecione uma unidade para ver o relatório de custos.</h2>;
  }

  return (
    <div className="page-container">
      {/* Título e Subtítulo do Novo Design */}
      <h1 className="page-title">Custos Mensais - {selectedUnidade?.name}</h1>
      <p className="page-subtitle">
        Aqui você pode visualizar todos seus custos operacionais mensais registrados no dia de pagamento na aba fluxo de caixa
      </p>

      {/* --- Controles do Topo (Mês e Total) --- */}
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
          <label>Total de Custos Nesse Mês</label>
          <span className="total-value-redesign">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCustos)}
          </span>

          {/* --- NOVO BOTÃO DE EXPORTAR --- */}
      <div className="export-button-container">
        <button onClick={handleExportCustosPdf} className="control-button primary">
          <FileDown size={16} /> Exportar Relatório Detalhado Desse Mês em PDF
        </button>
      </div>
        </div>
      </div>

      

      {/* --- Card da Tabela de Detalhamento --- */}
      <div className="custos-table-card">
        <h3 className="section-title-redesign">Detalhamento</h3>
        {loading ? (
          <LoadingSpinner text="Carregando dados do painel..." />
        ) : (
          <table className="custos-table-redesign">
            <thead>
              <tr>
                <th>Descrição Custo</th>
                <th>Data de Pagamento</th>
                <th className='status-off-mobile'>Status</th>
                <th>Valor Pago</th>
              </tr>
            </thead>
            <tbody>
              {/* --- CORREÇÃO APLICADA AQUI --- */}
          {custos.length === 0 ? (
            // Se a lista estiver vazia, renderiza o componente EmptyState
            <tr>
              <td colSpan={4} className="table-empty-state-cell">
                <EmptyState
                  icon={Inbox} // Um ícone mais apropriado para "vazio"
                  title="Nenhum Custo Mensal Encontrado"
                  message='Cadastre custos mensais em Fluxo de Caixa e eles aparecerão aqui'
                />
              </td>
            </tr>
              ) : (
                custos.map(custo => (
                  <tr key={custo.id}>
                    <td>{custo.nome}</td>
                    <td>{new Date(custo.dataPagamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td className='status-off-mobile'>
                      <span className={`status ${custo.status.toLowerCase()}`}>
                        {custo.status === 'PAGO' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(custo.valor)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      
      {/* REMOVIDO: Botão Salvar e Modal */}
    </div>
  );
}