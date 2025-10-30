// Local: sabio-forno-app/src/pages/LoginPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAppContext } from '../contexts/AppContext';
import './LoginPage.css'; // Importa o NOVO CSS
import Logo from '../assets/new-logo.png';
import { Eye, EyeOff } from 'lucide-react'; // 1. Importa os ícones

export function LoginPage() {
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 2. Adiciona estado de visibilidade

  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email: loginIdentifier, password });
      
      // CORREÇÃO: Chama 'login' e captura o retorno
      const loggedInUser = login(response.data.access_token);

      if (loggedInUser) {
        // CORREÇÃO: Verifica a 'role' e redireciona corretamente
        if (loggedInUser.role === 'FILHO') {
          navigate('/caixa', { replace: true });
        } else {
          // Usuário 'PAI' vai para o dashboard
          navigate('/dashboard', { replace: true });
        }
      } else {
        // Isso pode acontecer se o token for inválido
        setError('Erro ao processar o login. Tente novamente.');
        setLoading(false);
      }

    } catch (err) {
      setError('Login ou senha inválidos. Tente novamente.');
      console.error('Erro de login:', err);
      setLoading(false);
    }
  };

  return (
    // CORREÇÃO: Novas classes de layout
    <div className="login-page-redesign">
      <div className="login-panel">
        <div className="login-container-redesign">
          {/* <h1>SÁBIO FORNO</h1> */}
          <img src={Logo} alt="Sábio Forno Logo" className="logreg-logo" />
          <p>Faça login para acessar seu painel</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email ou Nome de Usuário</label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Senha</label>
              {/* 3. Adiciona o wrapper e o ícone */}
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'} // 4. Muda o tipo dinamicamente
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {showPassword ? (
                  <EyeOff className="password-toggle-icon" size={20} onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="password-toggle-icon" size={20} onClick={() => setShowPassword(true)} />
                )}
              </div>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="sub-text">
            Não tem uma conta? <Link to="/register">Registre-se</Link>
          </p>
        </div>
      </div>
      {/* A parte direita da tela fica vazia (apenas com o fundo cinza) */}
    </div>
  );
}