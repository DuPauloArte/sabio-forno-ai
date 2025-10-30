// Local: sabio-forno-app/src/pages/RegisterPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAppContext } from '../contexts/AppContext';
import './LoginPage.css'; // Reutiliza o novo estilo
import Logo from '../assets/new-logo.png';
import { Eye, EyeOff } from 'lucide-react'; // Importa ícones

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      // 1. Cria a conta
      await api.post('/auth/register', { email, password, name, companyName });
      
      // 2. Faz o login automaticamente
      const response = await api.post('/auth/login', { email, password });
      
      // 3. CORREÇÃO: Chama 'login' e captura o retorno
      const loggedInUser = login(response.data.access_token);

      // 4. CORREÇÃO: Redireciona para o dashboard (pois quem se registra é sempre 'PAI')
      if (loggedInUser) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Erro ao processar o registro. Tente fazer o login.');
        setLoading(false);
      }

    } catch (err: any) {
      if (err.response && err.response.status === 409) {
        setError('Este email já está em uso.');
      } else {
        setError('Ocorreu um erro ao tentar registrar. Tente novamente.');
      }
      console.error('Erro de registro:', err);
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
          <p>Crie sua conta para começar</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Seu Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Nome da sua Empresa</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="form-group">
              <label>Senha (mínimo 8 caracteres)</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  autoComplete="new-password"
                />
                {showPassword ? (
                  <EyeOff className="password-toggle-icon" size={20} onClick={() => setShowPassword(false)} />
                ) : (
                  <Eye className="password-toggle-icon" size={20} onClick={() => setShowPassword(true)} />
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Confirme sua Senha</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  disabled={loading}
                  autoComplete="new-password"
                />
                {showConfirmPassword ? (
                  <EyeOff className="password-toggle-icon" size={20} onClick={() => setShowConfirmPassword(false)} />
                ) : (
                  <Eye className="password-toggle-icon" size={20} onClick={() => setShowConfirmPassword(true)} />
                )}
              </div>
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar'}
            </button>
          </form>
          <p className="sub-text">
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}