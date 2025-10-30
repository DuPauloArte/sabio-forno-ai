// Local: sabio-forno-app/src/components/EmptyState.tsx

import React from 'react';
import { PackageSearch } from 'lucide-react'; // Importa um ícone padrão
import type { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  // 'as' é um padrão comum para permitir a passagem de um componente de ícone
  icon?: LucideIcon;
  title: string;
  message: string;
}

export function EmptyState({
  icon: Icon = PackageSearch, // Usa PackageSearch como ícone padrão se nenhum for fornecido
  title,
  message,
}: EmptyStateProps) {
  return (
    <div className="empty-state-container">
      <Icon className="empty-state-icon" size={48} strokeWidth={1.5} />
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-message">{message}</p>
    </div>
  );
}