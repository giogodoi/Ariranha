import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock } from "lucide-react";
import { apiDS } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Home.scss";

// Defini coordenadas gerais nas regiões monitoradas para consulta no modelo de previsão.
const REGIOES_MONITORADAS = [
  { id: 1, nome: "Centro-Oeste • MT", lat: -12.64, lon: -55.42 },
  { id: 2, nome: "Nordeste • BA", lat: -12.00, lon: -42.00 },
  { id: 3, nome: "Mato Grosso do Sul", lat: -20.46, lon: -54.62 }
];

// Tipagem para os alertas formatados para a UI
type AlertaUI = {
  id: number;
  titulo: string;
  local: string;
  nivel: string;
};

export default function Home() {
  const navigate = useNavigate();
  const [alertasRecentes, setAlertasRecentes] = useState<AlertaUI[]>([]);
  const [loadingAlertas, setLoadingAlertas] = useState(true);
  const { user } = useAuth();
  const nomeExibicao = user?.nome?.split(" ")[0] || user?.nome || "Agente";

  useEffect(() => {
    carregarAlertasReais();
  }, []);

  const carregarAlertasReais = async () => {
    setLoadingAlertas(true);
    try {
      // Dispara as 3 predições ao mesmo tempo para o backend Python
      const promessasPredicao = REGIOES_MONITORADAS.map(async (regiao) => {
        try {
          const resultado = await apiDS.preverOcorrencia({ 
            latitude: regiao.lat, 
            longitude: regiao.lon 
          });

          // Converte a classe da IA (Ex: "Crítico", "Alto") para a classe CSS (Ex: "critico", "alto")
          let nivelCss = "baixo";
          const classeLower = resultado.classe.toLowerCase();
          if (classeLower.includes("crítico")) nivelCss = "critico";
          else if (classeLower.includes("alto")) nivelCss = "alto";
          else if (classeLower.includes("médio") || classeLower.includes("medio")) nivelCss = "medio";

          return {
            id: regiao.id,
            titulo: `Risco ${resultado.classe} - ${(resultado.probabilidade * 100).toFixed(0)}%`,
            local: `${regiao.nome} • Atualizado agora`,
            nivel: nivelCss
          };
        } catch (error) {
          // Se uma região falhar (ex: fora da cobertura do modelo 404), retornamos um fallback seguro
          return {
            id: regiao.id,
            titulo: "Dados indisponíveis",
            local: `${regiao.nome} • Fora de Cobertura`,
            nivel: "baixo"
          };
        }
      });

      // Aguarda todas as predições terminarem
      const resultadosFinais = await Promise.all(promessasPredicao);
      
      // Opcional: Ordena para mostrar os riscos mais altos primeiro
      const ordenados = resultadosFinais.sort((a, b) => {
        const peso: Record<string, number> = { critico: 4, alto: 3, medio: 2, baixo: 1 };
        return (peso[b.nivel] || 0) - (peso[a.nivel] || 0);
      });

      setAlertasRecentes(ordenados);
    } catch (error) {
      console.error("Erro geral ao carregar alertas:", error);
    } finally {
      setLoadingAlertas(false);
    }
  };

  return (
    <div className="home-container">
      <header className="welcome-header">
        <h1>Bem Vindo, {nomeExibicao}!</h1>
        <p>Aqui está um resumo dos dados que você encontrará por aqui!</p>
      </header>

      <section className="ave-banner">
        <div className="ave-mascot">
          <img 
            src="/ariranha.png" 
            alt="Mascote do AVE Ariranha" 
          />
        </div>
        <div className="ave-content">
          <h2>Conheça o AVE (Algoritmo de Varredura de Emergências)</h2>
          <p>
            O AVE é uma tecnologia inovadora que, com base em ocorrências anteriores 
            registradas no sistema, é capaz de analisar os dados e te alertar em caso de risco.
            Registrando novas ocorrências, além de facilitar o trabalho do serviço de 
            emergência, você ainda coopera para a melhor eficácia do sistema.
          </p>
          <button 
            className="btn-ave" 
            onClick={() => navigate("/previsao")}
          >
            <Clock size={16} />
            Acompanhe as previsões em tempo real
          </button>
        </div>
      </section>

      <section className="services-section">
        <div className="services-header">
          <h2>Serviços</h2>
          <p>Selecione o serviço desejado:</p>
        </div>
        
        <div className="services-grid">
          <button 
            className="service-card border-green"
            onClick={() => navigate("/registros")} 
          >
            <h3>Registrar Nova Ocorrência</h3>
            <p>Acesso rápido à função de registro de novos dados</p>
          </button>

          <button 
            className="service-card border-orange"
            onClick={() => navigate("/registros")}
          >
            <h3>Acesso aos Registros</h3>
            <p>Acompanhe os incêndios já registrados</p>
          </button>
        </div>
      </section>

      <section className="alerts-section">
        <div className="alerts-header">
          <AlertTriangle size={20} className="icon-alert" color="#ea580c" />
          <h2>Monitoramento Nacional (AVE)</h2>
        </div>
        
        <div className="alerts-list">
          {loadingAlertas ? (
            <div className="loading-alerts" style={{ padding: '1rem', color: '#6b7280' }}>
              Consultando modelo de Inteligência Artificial...
            </div>
          ) : (
            alertasRecentes.map((alerta) => (
              <div key={alerta.id} className="alert-item">
                <div className="alert-info">
                  <h4>{alerta.titulo}</h4>
                  <p>{alerta.local}</p>
                </div>
                <div className="alert-indicator-wrapper">
                  <div className={`indicator-dot ${alerta.nivel}`}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

    </div>
  );
}