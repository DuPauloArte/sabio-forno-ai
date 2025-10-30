// Local: sabio-forno-app/src/components/StatCard.tsx
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  // CORREÇÃO: Nova prop para a cor (positivo, negativo, ou neutro/padrão)
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export function StatCard({ 
  title, 
  value, 
  isCurrency = false, 
  sentiment = 'neutral' // Valor padrão
}: StatCardProps) {
  
  const formattedValue = isCurrency && typeof value === 'number'
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : value;

  // Define a classe de cor com base na prop
  const sentimentClass = sentiment === 'positive' ? 'positive' : (sentiment === 'negative' ? 'negative' : '');

  return (
    <div className="stat-card-redesign">
      <h4 className="stat-card-title">{title}</h4>
      {/* CORREÇÃO: Adiciona a classe de sentimento ao valor */}
      <span className={`stat-card-value ${sentimentClass}`}>
        {formattedValue}
      </span>
    </div>
  );
}