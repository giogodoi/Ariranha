import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/Layout";

// Importação das Páginas
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import Home from "./pages/Home/Home";
import Registros from "./pages/Registros/Registros";
import Perfil from "./pages/Perfil/Perfil";
import Previsao from "./pages/Previsao/Previsao";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastrar" element={<Cadastro />} />
          
          {/* Rotas Protegidas */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/registros" element={<Registros />} />
              <Route path="/previsao" element={<Previsao />} />
              <Route path="/perfil" element={<Perfil />} />
              {/* Rota de Config foi removida daqui! */}
            </Route>
          </Route>
          
          {/* Redirecionamento padrão para rotas inexistentes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}