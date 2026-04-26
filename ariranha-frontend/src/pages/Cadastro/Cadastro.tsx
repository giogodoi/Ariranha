import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../../services/api";
import { Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import "./Cadastro.scss";

export default function Cadastro() {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();

  const handleCadastro = async (e: FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const cpfLimpo = cpf.replace(/\D/g, "");
      const telefoneLimpo = telefone.replace(/\D/g, "");

      await api.criarUsuario({ 
        nomeCompleto, 
        cpf: cpfLimpo, 
        telefone: telefoneLimpo, 
        email, 
        senha 
      });
      
      setSucesso(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro ao realizar cadastro.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-banner">
        <div className="banner-content">
          <img src="/ariranha.png" alt="Logo Ariranha" className="mascote-img" />
          <div className="brand-text">
            <h2>ARIRANHA</h2>
            <p>SISTEMA DE MONITORAMENTO E PREVENÇÃO</p>
          </div>
        </div>
      </div>

      <div className="cadastro-form-section">
        <div className="form-wrapper">
          <Link to="/login" className="btn-back">
            <ArrowLeft size={18} /> Voltar para o Login
          </Link>

          <div className="form-header">
            <h1>Criar Conta</h1>
            <p>Junte-se à brigada e ajude a monitorar nossas florestas.</p>
          </div>

          {erro && <div className="alert-error"><AlertCircle size={18} /> <span>{erro}</span></div>}
          {sucesso && <div className="alert-success"><span>Cadastro realizado com sucesso!</span></div>}

          <form onSubmit={handleCadastro} className="cadastro-form">
            <div className="input-group">
              <label>Nome Completo</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>CPF</label>
                <input
                  type="text"
                  placeholder="123.456.789-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>E-mail</label>
              <input
                type="email"
                placeholder="joao@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div className="password-input-wrapper">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Crie uma senha segura"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
                <button type="button" className="btn-toggle-password" onClick={() => setMostrarSenha(!mostrarSenha)}>
                  {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary-cadastro" disabled={carregando || sucesso}>
              {carregando ? "Processando..." : "Finalizar Cadastro"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}