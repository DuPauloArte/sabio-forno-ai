// Local: src/components/EditChildUserModal.tsx
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../api/axios';
import './EditChildUserModal.css'; // Usaremos um CSS dedicado
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react'; // Importa ícones

interface ChildUser {
  id: number;
  name: string;
  username: string;
}

interface EditChildUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  childUser: ChildUser | null;
  onUserUpdated: () => void; // Função para avisar a página que a lista precisa recarregar
}

export function EditChildUserModal({
  isOpen,
  onClose,
  childUser,
  onUserUpdated,
}: EditChildUserModalProps) {
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preenche o nome quando o modal abre com um usuário
  useEffect(() => {
    if (isOpen && childUser) {
      setName(childUser.name);
      // Reseta os campos de senha
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isOpen, childUser]);

  const handleSaveChanges = async () => {
    setError('');
    if (!childUser) return;

    // Valida se as senhas (se preenchidas) coincidem
    if (newPassword && newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    const payload: { name: string; password?: string } = {
      name: name,
    };

    // Adiciona a senha ao payload apenas se ela foi preenchida
    if (newPassword) {
      payload.password = newPassword;
    }

    try {
      await api.patch(`/auth/children/${childUser.id}`, payload);
      toast.success('Usuário atualizado com sucesso!');
      onUserUpdated(); // Avisa a página MinhaConta para recarregar a lista
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error('Falha ao atualizar o usuário.');
      setError('Falha ao atualizar o usuário.');
    }
  };

  if (!childUser) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Usuário - ${childUser.username}`}>
      <div className="edit-child-user-content">
        <div className="form-group">
          <label htmlFor="edit-child-name">Nome do Usuário</label>
          <input
            id="edit-child-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <hr className="divider"/>
        <h4>Redefinir Senha (Opcional)</h4>
        <div className="form-group">
          <label htmlFor="edit-child-newpass">Nova Senha (mín. 6 caracteres)</label>
          {/* --- CORREÇÃO AQUI --- */}
          <div className="password-input-wrapper-modal">
            <input
              id="edit-child-newpass"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Deixe em branco para não alterar"
              autoComplete="new-password"
            />
            {showNewPassword ? (
              <EyeOff className="password-toggle-icon-modal" size={20} onClick={() => setShowNewPassword(false)} />
            ) : (
              <Eye className="password-toggle-icon-modal" size={20} onClick={() => setShowNewPassword(true)} />
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="edit-child-confirmpass">Confirme a Nova Senha</label>
          {/* --- CORREÇÃO AQUI --- */}
          <div className="password-input-wrapper-modal">
            <input
              id="edit-child-confirmpass"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!newPassword}
              autoComplete="new-password"
            />
            {showConfirmPassword ? (
              <EyeOff className="password-toggle-icon-modal" size={20} onClick={() => setShowConfirmPassword(false)} />
            ) : (
              <Eye className="password-toggle-icon-modal" size={20} onClick={() => setShowConfirmPassword(true)} />
            )}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-button">Cancelar</button>
          <button onClick={handleSaveChanges} className="save-button">Salvar Alterações</button>
        </div>
      </div>
    </Modal>
  );
}