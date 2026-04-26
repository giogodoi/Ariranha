import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import "./Login.scss"; 


export default function Login() {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const cpfLimpo = cpf.replace(/\D/g, "");
      await login(cpfLimpo, senha);
      navigate("/"); 
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao tentar fazer login.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      
      {/* Lado Esquerdo - Branding e Ilustração */}
      <div className="login-banner">
        <div className="banner-content">
          <img 
            src="./public/logo-ariranha.png" 
            alt="Mascote Ariranha Bombeiro" 
            className="mascote-img"
          />
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="login-form-section">
        <div className="form-wrapper">
          <div className="form-header">
            <h1>Bem-vindo</h1>
            <p>Acesse o sistema com suas credenciais.</p>
          </div>

          {erro && (
            <div className="alert-error">
              <AlertCircle size={18} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                type="text"
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="senha">Senha</label>
              <div className="password-input-wrapper">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-password"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Lembrar de mim
              </label>
              <a href="/recuperar-senha" className="link-forgot-password">
                Esqueceu a senha?
              </a>
            </div>

            <button type="submit" className="btn-primary-login" disabled={carregando}>
              {carregando ? "Autenticando..." : "Entrar"}
            </button>

            <div className="register-prompt">
              <span>Não tem uma conta? </span>
              <a href="/cadastrar" className="link-register">Criar conta</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
