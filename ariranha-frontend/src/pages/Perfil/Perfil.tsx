import { User, Mail, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Perfil.scss";

export default function Perfil() {
  const { user, logout } = useAuth();

  const nomeExibicao = user?.nome || "Agente Ambiental";
  
  const emailExibicao = (user?.sub && user.sub.includes("@")) 
    ? user.sub 
    : user?.sub || "E-mail não informado no token";

  const telefoneExibicao = "Não informado"; 

  return (
    <div className="page-container perfil-page">
      <div className="page-header">
        <h1 className="page-title">Meu Perfil</h1>
        <p className="page-subtitle">Visualize suas informações de acesso</p>
      </div>

      <div className="perfil-grid">
        {/* COLUNA ESQUERDA: DADOS DO USUÁRIO */}
        <div className="content-card profile-card">
          <div className="profile-header">
            <div className="avatar-circle">
              <User size={40} />
            </div>
            <h2>{nomeExibicao}</h2>
            <span className="badge-role">Conta Ativa</span>
          </div>

          <div className="profile-details">
            <div className="detail-item">
              <Mail className="icon" size={18} />
              <div>
                <span className="label">Credencial / E-mail</span>
                <span className="value">{emailExibicao}</span>
              </div>
            </div>
            <div className="detail-item">
              <Phone className="icon" size={18} />
              <div>
                <span className="label">Telefone</span>
                <span className="value">{telefoneExibicao}</span>
              </div>
            </div>
          </div>

          <button className="btn-danger-outline" onClick={logout}>
            Sair da Conta
          </button>
        </div>

        {/* COLUNA DIREITA: INFORMAÇÕES DO SISTEMA */}
        <div className="content-card info-card">
          <h3>Status no Sistema</h3>
          <p className="text-muted">Informações sobre sua contribuição na plataforma</p>

          <div className="system-status mt-4">
            <div className="status-icon">
              <ShieldCheck size={28} color="#16a34a" />
            </div>
            <div className="status-text">
              <h4>Conectado ao AVE</h4>
              <p>
                Sua conta está apta para registrar novos focos de incêndio e alimentar a Inteligência Artificial.
              </p>
            </div>
          </div>

          <div className="impact-message mt-4">
            <p>
              Obrigado por contribuir com o <strong>Ariranha</strong>! 
              Cada registro que você faz via sistema ajuda nossos modelos preditivos a estimarem o risco de queimadas com mais precisão, protegendo os nossos biomas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}