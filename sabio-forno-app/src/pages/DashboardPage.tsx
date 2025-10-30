// Local: sabio-forno-app/src/pages/DashboardPage.tsx

import { useState, useEffect } from 'react';
import { StatCard } from '../components/StatCard';
import { useAppContext } from '../contexts/AppContext';
import api from '../api/axios';
import './DashboardPage.css';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MonthlyChart } from '../components/MonthlyChart';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Importa ícones

// Interface para os 5 cards
interface DashboardStats {
  saldoLiquidoMes: number;
  vendasNoMes: number;
  despesasOperacionaisMes: number;
  custosRegistradosMes: number;
  produtoMaisLucrativo: string;
  produtoMenosLucrativo: string;
}

// Interface para os dados do gráfico
interface ChartData {
  label: string;
  vendas: number;
  custos: number;
  saldo: number;
}

export function DashboardPage() {
  const { selectedUnidade } = useAppContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  // --- NOVO ESTADO E VARIÁVEIS PARA O SELETOR DE MÊS ---
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const ano = dataSelecionada.getFullYear();
  const mes = dataSelecionada.getMonth() + 1;

  // --- Efeito para buscar os STATS (Cards) ---
  // Roda quando a unidade OU o mês selecionado mudam
  useEffect(() => {
    if (!selectedUnidade) {
      setLoadingStats(false);
      setStats(null);
      return;
    }
    
    async function fetchStats() {
      if (!selectedUnidade) return;
      setLoadingStats(true);
      try {
        const response = await api.get('/dashboard/stats', {
          params: { 
            unidadeId: selectedUnidade.id,
            ano: ano, // Envia o ano
            mes: mes, // Envia o mês
          },
        });
        setStats(response.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas do dashboard:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [selectedUnidade, dataSelecionada]); // Depende da data selecionada

  // --- Efeito para buscar o GRÁFICO (Últimos 12 meses) ---
  // Roda APENAS quando a unidade muda
  useEffect(() => {
    if (!selectedUnidade) {
      setLoadingChart(false);
      setChartData([]);
      return;
    }

    async function fetchChartData() {
      if (!selectedUnidade) return;
      setLoadingChart(true);
      try {
        const response = await api.get('/dashboard/monthly-summary', {
          params: { unidadeId: selectedUnidade.id },
        });
        setChartData(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados do gráfico:', error);
      } finally {
        setLoadingChart(false);
      }
    }
    fetchChartData();
  }, [selectedUnidade]); // NÃO depende da data selecionada

  // --- NOVA FUNÇÃO para navegar entre os meses ---
  const changeMonth = (amount: number) => {
    setDataSelecionada(currentDate => {
      const newDate = new Date(currentDate);
      newDate.setDate(1); // Garante que estamos no dia 1
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  // --- Renderização Condicional ---
  if (!selectedUnidade) {
    return <h2>Por favor, selecione uma unidade para ver o dashboard.</h2>;
  }

  return (
    <div className="dashboard-container-redesign">
      <div className='dash-title-diff'>
        <div className='title-and-sub'><h1 className="page-title-ds">Painel - {selectedUnidade.name}</h1>
          <p className="page-subtitle-ds">Aqui você pode ver informações sobre {selectedUnidade.name}</p>
        </div>
        {/* --- NOVO SELETOR DE MÊS PARA OS CARDS --- */}
        <div className="dashboard-month-selector">
          <button onClick={() => changeMonth(-1)} className="month-arrow">
            <ChevronLeft size={20} />
          </button>
          <span className="month-name">
            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(dataSelecionada)}
          </span>
          <button onClick={() => changeMonth(1)} className="month-arrow">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loadingStats ? (
        <LoadingSpinner text="Carregando indicadores..." />
      ) : !stats ? (
        <p>Não foi possível carregar os indicadores.</p>
      ) : (
        <div className="stats-grid-redesign six-cards">
          <StatCard 
            title="Saldo Líquido (Mês)" 
            value={stats.saldoLiquidoMes} 
            isCurrency 
            sentiment={stats.saldoLiquidoMes < 0 ? 'negative' : 'positive'}
          />
          <StatCard title="Vendas Totais (Mês)" value={stats.vendasNoMes} isCurrency />
          <StatCard title="Despesas Operacionais (Mês)" value={stats.despesasOperacionaisMes} isCurrency />
          <StatCard title="Custos Registrados (Mês)" value={stats.custosRegistradosMes} isCurrency />
{/*           <StatCard title="Receita Com Maior Margem de Lucro" value={stats.produtoMaisLucrativo} />
          <StatCard title="Receita Com Menor Margem de Lucro" value={stats.produtoMenosLucrativo} /> */}
        </div>
      )}

      {loadingChart ? (
        <LoadingSpinner text="Carregando gráfico..." />
      ) : (
        <MonthlyChart data={chartData} />
      )}
    </div>
  );
}