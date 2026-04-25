import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { api, type LoginResponse } from "../services/api";
import { jwtDecode } from "jwt-decode";

// Pra não deixar brechas no endpoint do backend, estou usando a jwt-decode 
// A fim de obter o nome do usuário e outras informações do token JWT, sem precisar de uma chamada extra ao backend. :)
interface DecodedToken {
  sub: string; 
  nome?: string; 
  exp?: number;
}


interface AuthContextType {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  login: (cpf: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const processarToken = (token: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setUser(decoded);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Erro ao decodificar o token JWT", error);
      logout(); 
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      processarToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (cpf: string, senha: string) => {
    try {
      const data: LoginResponse = await api.login(cpf, senha);
      localStorage.setItem("token", data.token);
      processarToken(data.token);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}