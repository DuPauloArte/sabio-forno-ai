// Local: sabio-forno-app/src/pages/FluxoCaixaPage.tsx

import { useState, useEffect } from 'react';
import api from '../api/axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppContext } from '../contexts/AppContext';
import './FluxoCaixaPage.css';
import './PageStyles.css'; // Importa os estilos de título
import { Trash2, ClipboardList, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner'; // 1. Importe o Spinner
import { EmptyState } from '../components/EmptyState';

// --- Interfaces ---
interface Pagamento {
  id: number;
  descricao: string;
  valor: number;
}
// Interface DespesaDiaria
interface DespesaDiaria {
  id: number;
  descricao: string;
  valor: number;
}
// Interface Fechamento (não precisa mais de custos pendentes)
interface Fechamento {
  id: number;
  data: string;
  vendasDinheiro: number | null;
  vendasCartao: number | null;
  trocoDiaSeguinte: number | null;
  pagamentos: Pagamento[];
  despesasDiarias: DespesaDiaria[];
}

export function FluxoCaixaPage() {
  const { user, selectedUnidade } = useAppContext();
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [dadosFechamento, setDadosFechamento] = useState<Fechamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para Pagamentos (Custos Registrados) - SIMPLIFICADO
  const [pagamentoDescricao, setPagamentoDescricao] = useState('');
  const [pagamentoValor, setPagamentoValor] = useState('');
  // REMOVIDO: custosPendentes, pagamentoCustoId, setPagamentoCustoId

  // Estados para Despesas Diárias
  const [despesaDescricao, setDespesaDescricao] = useState('');
  const [despesaValor, setDespesaValor] = useState('');

  // Função para buscar dados do dia
  const fetchData = async () => {
    if (!selectedUnidade) {
      setDadosFechamento(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unidadeIdAtual = selectedUnidade.id;
    const dataFormatada = dataSelecionada.toISOString().split('T')[0];
    
    try {
      // CORREÇÃO: Busca apenas o fechamento de caixa do dia.
      const resFechamento = await api.get(`/caixa/${dataFormatada}`, { params: { unidadeId: unidadeIdAtual } });
      
      setDadosFechamento({
        ...resFechamento.data,
        despesasDiarias: resFechamento.data.despesasDiarias || [],
        pagamentos: resFechamento.data.pagamentos || [],
      });
      
    } catch (error) {
      console.error('Erro ao buscar dados do fechamento:', error);
      setDadosFechamento(null);
      toast.error("Erro ao carregar dados do dia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataSelecionada, selectedUnidade]);

  // CORREÇÃO: 'e' não é mais "never read"
  const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = target;
    if (dadosFechamento) {
      setDadosFechamento({
        ...dadosFechamento,
        [name]: value === '' ? null : parseFloat(value),
      });
    }
  };

  // Handler para salvar vendas e troco
  const handleSave = async () => {
    if (!dadosFechamento || !selectedUnidade || isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading('Salvando fechamento...');

    try {
      const payload = {
        vendasDinheiro: dadosFechamento.vendasDinheiro !== null ? Number(dadosFechamento.vendasDinheiro) : undefined,
        vendasCartao: dadosFechamento.vendasCartao !== null ? Number(dadosFechamento.vendasCartao) : undefined,
        trocoDiaSeguinte: dadosFechamento.trocoDiaSeguinte !== null ? Number(dadosFechamento.trocoDiaSeguinte) : undefined,
      };

      const response = await api.patch(
        `/caixa/${dadosFechamento.id}`,
        payload,
        { params: { unidadeId: selectedUnidade.id } },
      );
      setDadosFechamento({
          ...response.data,
          despesasDiarias: response.data.despesasDiarias || [],
          pagamentos: response.data.pagamentos || []
      });
      toast.success('Fechamento salvo com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao salvar fechamento:', error);
      toast.error('Falha ao salvar o fechamento. Verifique os valores.', { id: toastId });
    } finally {
       setIsSaving(false);
    }
  };

  // Handler para adicionar um Custo Registrado
  const handleAddPagamento = async () => {
    if (!pagamentoDescricao.trim() || !pagamentoValor || !dadosFechamento || !selectedUnidade) {
        toast.error('Preencha a descrição e o valor do custo.');
        return;
    };

    const payload = {
      descricao: pagamentoDescricao,
      valor: parseFloat(pagamentoValor),
      data: dadosFechamento.data,
      fechamentoCaixaId: dadosFechamento.id,
      // Não há mais custoMensalId
    };

    const promise = api.post('/pagamentos', payload, { params: { unidadeId: selectedUnidade.id } });
    
    toast.promise(promise, {
        loading: 'Adicionando registro...',
        success: (response) => {
            const novoPagamento = response.data;
            setDadosFechamento(prevState => prevState ? { ...prevState, pagamentos: [...prevState.pagamentos, novoPagamento] } : null);
            setPagamentoDescricao('');
            setPagamentoValor('');
            return 'Custo registrado com sucesso!';
        },
        error: (err) => {
            console.error("Erro ao adicionar registro:", err);
            return 'Falha ao adicionar registro.';
        }
    });
  };

  // Handler para deletar um Custo Registrado
  const handleDeletePagamento = async (id: number) => {
    if (!selectedUnidade) return;
    if (window.confirm('Tem certeza que deseja remover este registro? Isso também o removerá do Relatório Mensal.')) {
        const promise = api.delete(`/pagamentos/${id}`, { params: { unidadeId: selectedUnidade.id } });
        
        toast.promise(promise, {
            loading: 'Removendo registro...',
            success: () => {
                setDadosFechamento(prevState => prevState ? { ...prevState, pagamentos: prevState.pagamentos.filter(p => p.id !== id) } : null);
                return 'Registro removido com sucesso!';
            },
            error: (err) => {
                console.error("Erro ao remover registro:", err);
                return 'Falha ao remover registro.';
            }
        });
    }
  };

  // Handler para adicionar uma Despesa Diária
  const handleAddDespesa = async () => {
    if (!despesaDescricao.trim() || !despesaValor || !dadosFechamento || !selectedUnidade) {
        toast.error('Preencha a descrição e o valor da despesa.');
        return;
    };
    const payload = { descricao: despesaDescricao, valor: parseFloat(despesaValor), fechamentoCaixaId: dadosFechamento.id };
    
    const promise = api.post('/despesas', payload, { params: { unidadeId: selectedUnidade.id } });

    toast.promise(promise, {
        loading: 'Adicionando despesa...',
        success: (response) => {
            const novaDespesa = response.data;
            setDadosFechamento(prevState => prevState ? { ...prevState, despesasDiarias: [...prevState.despesasDiarias, novaDespesa] } : null);
            setDespesaDescricao(''); setDespesaValor('');
            return 'Despesa adicionada com sucesso!';
        },
        error: (err) => {
            console.error("Erro ao adicionar despesa:", err);
            return 'Falha ao adicionar despesa.';
        }
    });
  };

  // Handler para deletar uma Despesa Diária
  const handleDeleteDespesa = async (id: number) => {
    if (!selectedUnidade) return;
    if (window.confirm('Tem certeza que deseja remover esta despesa?')) {
        const promise = api.delete(`/despesas/${id}`, { params: { unidadeId: selectedUnidade.id } });

        toast.promise(promise, {
            loading: 'Removendo despesa...',
            success: () => {
                setDadosFechamento(prevState => prevState ? { ...prevState, despesasDiarias: prevState.despesasDiarias.filter(d => d.id !== id) } : null);
                return 'Despesa removida com sucesso!';
            },
            error: (err) => {
                console.error("Erro ao remover despesa:", err);
                return 'Falha ao remover despesa.';
            }
        });
    }
  };

  // Handler para exportar PDF
  const handleExportPdf = async (dateToExport: Date) => {
    if (!selectedUnidade) return;
    const dataFormatada = dateToExport.toISOString().split('T')[0];
    const toastId = toast.loading('Gerando PDF...');
    try {
      const response = await api.get(`/caixa/export-pdf/${dataFormatada}`, {
        params: { unidadeId: selectedUnidade.id }, responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fechamento-${dataFormatada}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Falha ao gerar o relatório em PDF.', { id: toastId });
    }
  };

  // Função auxiliar para pegar data de ontem
  const getYesterday = (): Date => {
    const yesterday = new Date(dataSelecionada);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  };

  // Cálculos para o Resumo
  const pagamentosDoDia = dadosFechamento?.pagamentos || [];
  const despesasDoDia = dadosFechamento?.despesasDiarias || [];
  const totalPagamentos = pagamentosDoDia.reduce((acc, p) => acc + Number(p.valor), 0);
  const totalDespesasDiarias = despesasDoDia.reduce((acc, d) => acc + Number(d.valor), 0);
  const vendasTotais = Number(dadosFechamento?.vendasDinheiro || 0) + Number(dadosFechamento?.vendasCartao || 0);
  const saidasTotais = totalDespesasDiarias; // Apenas despesas operacionais
  const saldoLiquido = vendasTotais - saidasTotais;

  // Verificação de permissão para a seção de custos
  const canRegisterCosts = user?.role === 'PAI' || (user?.allowedPages.includes('custos'));

  // Renderização condicional inicial
  if (loading && !dadosFechamento) return <LoadingSpinner text="Carregando dados do painel..." />;
  if (!selectedUnidade) return <h2>Por favor, selecione uma unidade para ver o fluxo de caixa.</h2>;
  if (!dadosFechamento && selectedUnidade && !loading) return <p>Erro ao carregar dados do dia.</p>;
  if (!dadosFechamento) return <p>Erro inesperado ao carregar dados.</p>;

  // --- JSX (Seção return completa) ---
  return (
    <div className="page-container">
      <h1 className="page-title">Fluxo de Caixa - {selectedUnidade.name}</h1>
      <p className="page-subtitle">Aqui você pode salvar e exportar seu fluxo de caixa do dia</p>

      <div className="caixa-top-controls-fc">
        <div className="control-card">
          <label className='reportLabel'>Relatórios</label>
          <div className="button-group">
            <button onClick={() => handleExportPdf(dataSelecionada)} className="control-button primary">Exportar Relatório do Dia</button>
            <button onClick={() => handleExportPdf(getYesterday())} className="control-button secondary">Exportar Relatório de Ontem</button>
          </div>
        </div>
        <div className="control-card">
          <label>Selecione o dia que deseja visualizar</label>
          <DatePicker
            selected={dataSelecionada}
            onChange={(date: Date | null) => { if (date) { setDataSelecionada(date); } }}
            dateFormat="dd/MM/yyyy"
            className="control-datepicker"
            locale="pt-BR"
          />
        </div>
      </div>

      <div className="caixa-body-redesign-fc">
        <div className="caixa-form-column">
          <div className="caixa-card">
            <div className="caixa-form-grid">
              <div className="form-section">
                <h3 className="section-title">Entradas do Dia</h3>
                <div className="form-group-redesign">
                  <label>Vendas do dia em Dinheiro (R$)</label>
                  <input type="number" step="0.01" name="vendasDinheiro" value={dadosFechamento.vendasDinheiro ?? ''} onChange={handleChange} />
                </div>
                <div className="form-group-redesign">
                  <label>Vendas do dia na Maquininha (R$)</label>
                  <input type="number" step="0.01" name="vendasCartao" value={dadosFechamento.vendasCartao ?? ''} onChange={handleChange} />
                </div>
                <div className="form-section-fec">
                <h3 className="section-title">Fechamento</h3>
                <div className="form-group-redesign">
                  <label>Troco para o dia seguinte (R$)</label>
                  <input type="number" step="0.01" name="trocoDiaSeguinte" value={dadosFechamento.trocoDiaSeguinte ?? ''} onChange={handleChange} />
                </div>
              </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Despesas Operacionais do Dia</h3>
                <div className="form-group-redesign">
                  <label>Descrição da Despesa</label>
                  <input type="text" value={despesaDescricao} onChange={e => setDespesaDescricao(e.target.value)} placeholder="Ex: Vale Funcionario" />
                </div>
                <div className="form-group-redesign">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={despesaValor} onChange={e => setDespesaValor(e.target.value)} required />
                </div>
                <button className="control-button secondary full-width" onClick={handleAddDespesa}>Adicionar Despesa</button>
                <ul className="despesas-list-redesign">
                  {despesasDoDia.length === 0 ? (
                    <ul className="list-empty-state-wrapper">
                      <EmptyState
                        icon={ClipboardList}
                        title="Nenhuma Despesa Diária"
                        message="Nenhuma despesa operacional (como vales ou compras pequenas) foi registrada hoje."
                      />
                    </ul>
                  ) : (
                    despesasDoDia.map(d => (
                      <li key={d.id}>
                        <span>{d.descricao} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valor)}</span>
                        <button onClick={() => handleDeleteDespesa(d.id)} className="delete-tiny-button">
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              
            </div>
          </div>
          
          {canRegisterCosts && (
            <div className="caixa-card">
              <h3 className="section-title">Custos Fixos do Mês Pagos No Dia</h3>
              <p className="description-text">Registre aqui os custos fixos ou variáveis pagos hoje (ex: boletos, fornecedores). Estes registros aparecerão no "Relatório de Custos Mensais" e **não** afetam o Saldo do Dia.</p>
              <div className="pagamento-form-redesign">
                <div className="form-group-redesign">
                  <label>Descrição do Custo Pagamento</label>
                  <input type="text" value={pagamentoDescricao} onChange={e => setPagamentoDescricao(e.target.value)} required placeholder="Ex: Aluguel, Boleto de luz" />
                </div>
                <div className="form-group-redesign">
                  <label>Valor (R$)</label>
                  <input type="number" step="0.01" value={pagamentoValor} onChange={e => setPagamentoValor(e.target.value)} required />
                </div>
              </div>
              <button className="control-button secondary full-width" onClick={handleAddPagamento}>Adicionar Registro de Custo</button>
              
              <ul className="pagamentos-list">
                {pagamentosDoDia.length === 0 ? (
                  <li className="list-empty-state-wrapper">
                    <EmptyState
                      icon={Receipt}
                      title="Nenhum Custo Registrado"
                      message="Nenhum custo (como boletos ou pagamentos a fornecedores) foi registrado hoje."
                    />
                  </li>
                ) : (
                  pagamentosDoDia.map(p => (
                    <li key={p.id}>
                      <span>{p.descricao} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</span>
                      <button onClick={() => handleDeletePagamento(p.id)} className="delete-tiny-button">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        
        <div className="caixa-resumo-column">
          <div className="caixa-card resumo-card">
            <h3 className="section-title">Resumo do Dia</h3>
            <div className="resumo-item">
              <span>(+) Vendas Totais</span>
              <span className="valor positivo">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vendasTotais)}</span>
            </div>
            <div className="resumo-item">
              <span>(-) Despesas Diárias</span>
              <span className="valor negativo">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesasDiarias)}</span>
            </div>
            <div className="resumo-item">
              <span>(-) Saídas Totais (Operacionais)</span>
              <span className="valor negativo">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saidasTotais)}</span>
            </div>
            <hr />
            <div className="resumo-item total">
              <span>= Saldo Líquido do Dia</span>
              <span className="valor">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldoLiquido)}</span>
            </div>
            <div className="resumo-item informativo">
              <span>(i) Custos Registrados Hoje:</span>
              <span className="valor">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagamentos)}</span>
            </div>
            <button className="save-button-green" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Fechamento do Dia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}