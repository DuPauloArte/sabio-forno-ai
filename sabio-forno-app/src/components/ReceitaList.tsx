// Local: sabio-forno-app/src/components/ReceitaList.tsx
import './ReceitaList.css';
import { Search, BookOpen } from 'lucide-react'; // Ícone de busca e ícone para receitas
import { EmptyState } from './EmptyState'; // Importa o componente EmptyState

interface Receita {
  id: number;
  nome: string;
}

interface ReceitaListProps {
  receitas: Receita[];
  onSelectReceita: (id: number) => void;
  selectedReceitaId: number | null;
  filtro: string; // Prop de filtro
  onFiltroChange: (valor: string) => void; // Prop de filtro
}

export function ReceitaList({ 
  receitas, 
  onSelectReceita, 
  selectedReceitaId,
  filtro,
  onFiltroChange
}: ReceitaListProps) {
  return (
    // Usa a classe de card
    <div className="list-card-redesign">
      <h3 className="list-title-redesign">Receitas Cadastradas</h3>
      
      {/* Barra de pesquisa */}
      <div className="search-bar-redesign-receita">
        <Search size={18} className="search-icon-redesign" />
        <input 
          type="text"
          placeholder="Procure uma Receita"
          className="search-input-redesign"
          value={filtro}
          onChange={(e) => onFiltroChange(e.target.value)}
        />
      </div>

      <ul className="receita-list-redesign">
        {/* Verifica se a lista está vazia */}
        {receitas.length === 0 ? (
          // Se estiver vazia, renderiza o EmptyState dentro de um <li>
          <li className="list-empty-state-wrapper">
            <EmptyState
              icon={BookOpen}
              title="Nenhuma Receita Encontrada"
              message={filtro ? "Tente ajustar sua busca." : "Cadastre sua primeira receita no formulário ao lado."}
            />
          </li>
        ) : (
          // Se não estiver vazia, renderiza os itens da lista
          receitas.map((receita) => (
            <li
              key={receita.id}
              className={receita.id === selectedReceitaId ? 'active' : ''}
              onClick={() => onSelectReceita(receita.id)}
            >
              {receita.nome}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}