// Local: sabio-forno-app/src/components/InsumoTable.tsx
import './InsumoTable.css';
import type { Insumo } from '../pages/InsumosPage';
import { Pencil, Trash2, Search, Inbox } from 'lucide-react'; // Importa um ícone relevante
import { EmptyState } from './EmptyState'; // Importa o novo componente

interface InsumoTableProps {
  insumos: Insumo[];
  onDeleteInsumo: (id: number) => void;
  onEditInsumo: (insumo: Insumo) => void;
  filtro: string;
  onFiltroChange: (valor: string) => void;
}

export function InsumoTable({
  insumos,
  onDeleteInsumo,
  onEditInsumo,
  filtro,
  onFiltroChange,
}: InsumoTableProps) {
  return (
    <div className="table-card-redesign">
      
      <div className="table-header-redesign">
        <h3 className="table-title-redesign">Insumos Cadastrados</h3>
        <div className="search-bar-redesign">
          <Search size={18} className="search-icon-redesign" />
          <input 
            type="text"
            placeholder="Procurar insumo..."
            className="search-input-redesign"
            value={filtro}
            onChange={(e) => onFiltroChange(e.target.value)}
          />
        </div>
      </div>

      <table className="insumo-table-redesign">
        <thead>
          <tr className='cabeca-mobile'>
            <th>Nome do insumo</th>
            <th className='unidade-buy'>Unidade de Compra</th>
            <th>Preço da Unidade de Compra</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {/* --- CORREÇÃO APLICADA AQUI --- */}
          {insumos.length === 0 ? (
            // Se a lista estiver vazia, renderiza o componente EmptyState
            <tr>
              <td colSpan={4} className="table-empty-state-cell">
                <EmptyState
                  icon={Inbox} // Um ícone mais apropriado para "vazio"
                  title="Nenhum Insumo Encontrado"
                  message={filtro ? "Tente ajustar sua busca." : "Comece a cadastrar seus insumos no formulário acima."}
                />
              </td>
            </tr>
          ) : (
            // Se a lista tiver itens, renderiza as linhas
            insumos.map((insumo) => (
              <tr key={insumo.id}>
                <td>{insumo.nome}</td>
                <td className='unidade-buy'>{insumo.unidade_compra}</td>
                <td>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(insumo.valor_unidade_compra)}
                </td>
                <td className="actions-redesign">
                  <Pencil 
                    className="icon-redesign icon-edit-redesign" 
                    onClick={() => onEditInsumo(insumo)}
                    size={18}
                  />
                  <Trash2
                    className="icon-redesign icon-delete-redesign"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja deletar este insumo?')) {
                        onDeleteInsumo(insumo.id);
                      }
                    }}
                    size={18}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}