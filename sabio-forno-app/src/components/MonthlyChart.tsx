// Local: sabio-forno-app/src/components/MonthlyChart.tsx
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './MonthlyChart.css'; // Criaremos este CSS

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Define a "forma" dos dados que o gráfico espera
interface ChartData {
  label: string;
  vendas: number;
  custos: number;
  saldo: number;
}

interface MonthlyChartProps {
  data: ChartData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartLabels = data.map(item => item.label);
  const vendasData = data.map(item => item.vendas);
  const custosData = data.map(item => item.custos);
  const saldoData = data.map(item => item.saldo);

  const chartConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Vendas (R$)',
        data: vendasData,
        backgroundColor: '#28A745', // Verde
      },
      {
        label: 'Custos (R$)',
        data: custosData,
        backgroundColor: '#DC3545', // Vermelho
      },
      {
        label: 'Saldo (R$)',
        data: saldoData,
        backgroundColor: '#1e88e5', // Azul
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que o gráfico preencha o container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Resumo Financeiro dos Últimos 12 Meses',
        font: {
          size: 16,
          family: 'Urbanist, sans-serif',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
        y: {
            ticks: {
                // Formata o eixo Y como moeda
                callback: function(value: any) {
                    return 'R$ ' + value;
                }
            }
        }
    }
  };

  return (
    <div className="chart-card-redesign">
      <h3 className='mobile-warning'>Veja Este grafico de progressão mensal em um tablet ou computador</h3>
      <div className="chart-container">
        <Bar options={options} data={chartConfig} />
      </div>
    </div>
  );
}