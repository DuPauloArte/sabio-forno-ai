// Local: src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';

// 1. Importe o Toaster
import { Toaster } from 'react-hot-toast';

registerLocale('pt-BR', ptBR);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        {/* 2. Adicione o componente Toaster aqui */}
        <Toaster
          position="top-right" // Posição das notificações
          toastOptions={{
            duration: 4000, // Duração padrão em milissegundos
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#4CAF50', // Verde para sucesso
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#4CAF50',
             },
            },
            error: {
              style: {
                background: '#F44336', // Vermelho para erro
              },
               iconTheme: {
                primary: '#fff',
                secondary: '#F44336',
             },
            },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);