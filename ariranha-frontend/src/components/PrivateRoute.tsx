import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  // Enquanto estiver lendo o localStorage, mostra uma tela de carregamento
  if (loading) {
    return (
      <div 
        className="loading-screen" 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          backgroundColor: '#f8fafc',
          color: '#64748b'
        }}
      >
        <p>Verificando sessão...</p>
      </div>
    );
  }

  // Se terminou de carregar e está autenticado, renderiza as rotas filhas (Outlet)
  // Caso contrário, redireciona para o Login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}