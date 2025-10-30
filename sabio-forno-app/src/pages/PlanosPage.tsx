// Local: sabio-forno-app/src/pages/PlanosPage.tsx

import { useState } from 'react';
import api from '../api/axios';
import { useAppContext } from '../contexts/AppContext';
import './PageStyles.css'; // Importa estilos de título
import './PlanosPage.css'; // Importa o novo CSS
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

// Define a "forma" dos nossos planos para fácil gerenciamento
const planos = [
  {
    id: 'Pro',
    name: 'Pro',
    price: 'R$ 49,90',
    description: 'Ideal para negócios individuais.',
    unidadeLimit: 1,
    features: [
      { text: '1 Unidade', included: true },
      { text: 'Gerenciamento de Usuários (Filho)', included: false },
      { text: 'Suporte Prioritário', included: false },
    ],
  },
  {
    id: 'Elite',
    name: 'Elite',
    price: 'R$ 79,90',
    description: 'Para pequenas redes em crescimento.',
    unidadeLimit: 2,
    features: [
      { text: 'Até 2 Unidades', included: true },
      { text: 'Gerenciamento de Usuários (Filho)', included: true },
      { text: 'Suporte Prioritário', included: false },
    ],
  },
  {
    id: 'Master',
    name: 'Master',
    price: 'R$ 134,90',
    description: 'Controle total para múltiplas unidades.',
    unidadeLimit: 3,
    features: [
      { text: 'Até 3 Unidades', included: true },
      { text: 'Gerenciamento de Usuários (Filho)', included: true },
      { text: 'Suporte Prioritário', included: true },
    ],
  },
];

export function PlanosPage() {
  const { user } = useAppContext();
  const [loadingPlan, setLoadingPlan] = useState<'Pro' | 'Elite' | 'Master' | null>(null);

  const handleCheckout = async (planType: 'Pro' | 'Elite' | 'Master') => {
    if (!user || user.role !== 'PAI') {
      toast.error("Apenas o administrador da conta pode gerenciar assinaturas.");
      return;
    }

    setLoadingPlan(planType); // Ativa o loading do card específico
    const toastId = toast.loading(`Redirecionando para o pagamento do plano ${planType}...`);

    try {
      // 1. Chama a API do backend para criar a sessão do Stripe
      const response = await api.post('/billing/create-checkout-session', {
        planType: planType,
      });

      const { url } = response.data;

      // 2. Se a API retornar uma URL, redireciona o usuário para o Stripe
      if (url) {
        toast.dismiss(toastId);
        window.location.href = url; // Redirecionamento externo
      } else {
        throw new Error('URL de checkout não recebida.');
      }

    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast.error('Não foi possível iniciar o pagamento. Tente novamente.', { id: toastId });
      setLoadingPlan(null); // Desativa o loading em caso de erro
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Planos e Assinatura</h1>
      <p className="page-subtitle">
        Escolha o plano que melhor se adapta ao crescimento do seu negócio.
      </p>

      <div className="planos-grid-container">
        {planos.map((plano) => (
          <div key={plano.id} className="plano-card">
            <div className="plano-header">
              <h3 className="plano-name">{plano.name}</h3>
              <div className="plano-price">
                {plano.price}
                <span>/mês</span>
              </div>
              <p className="plano-description">{plano.description}</p>
            </div>
            <ul className="plano-features">
              {plano.features.map((feature, index) => (
                <li key={index} className={feature.included ? 'included' : 'excluded'}>
                  {feature.included ? <Check size={18} /> : <X size={18} />}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="plano-footer">
              <button 
                className="plano-button"
                onClick={() => handleCheckout(plano.id as 'Pro' | 'Elite' | 'Master')}
                disabled={loadingPlan === plano.id} // Desabilita só o botão clicado
              >
                {loadingPlan === plano.id ? 'Aguarde...' : 'Assinar Agora'}
              </button>
            </div>
          </div>
        ))}

        {/* Card para o Plano Imperial (Sob Consulta) */}
        <div className="plano-card imperial">
          <div className="plano-header">
            <h3 className="plano-name">Imperial</h3>
            <div className="plano-price">
              Sob Consulta
            </div>
            <p className="plano-description">Para redes com mais de 3 unidades e necessidades específicas.</p>
          </div>
          <ul className="plano-features">
            <li className="included"><Check size={18} /><span>Limite de unidades personalizado</span></li>
            <li className="included"><Check size={18} /><span>Gerenciamento de Usuários (Filho)</span></li>
            <li className="included"><Check size={18} /><span>Suporte VIP e integração</span></li>
          </ul>
          <div className="plano-footer">
            <button 
              className="plano-button" 
              onClick={() => toast.success('Em breve entraremos em contato!')} // Ação fictícia
            >
              Entrar em Contato
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}