import { useState, FormEvent, useEffect } from "react";
import { apiDS, type PrevisaoRequest, type PrevisaoResponse } from "../../services/api";
import { MapPin, Target, AlertTriangle, ShieldCheck, Flame, Search } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";

import "./Previsao.scss";

// Lista expandida para dar uma visão mais rica do mapa
const PONTOS_MONITORAMENTO = [
  { nome: "Altamira, PA (Amazônia)", lat: -3.2, lon: -52.2 },
  { nome: "São Félix do Xingu, PA (Amazônia)", lat: -6.64, lon: -51.99 },
  { nome: "Manaus, AM (Amazônia)", lat: -3.1, lon: -60.0 },
  { nome: "Rio Branco, AC (Amazônia)", lat: -9.97, lon: -67.82 },
  { nome: "Boa Vista, RR (Amazônia)", lat: 2.82, lon: -60.67 },
  { nome: "Porto Velho, RO (Amazônia)", lat: -8.7, lon: -63.9 },
  { nome: "Cuiabá, MT (Cerrado/Pantanal)", lat: -15.6, lon: -56.1 },
  { nome: "Sinop, MT (Cerrado)", lat: -11.86, lon: -55.50 },
  { nome: "Cáceres, MT (Pantanal)", lat: -16.07, lon: -57.67 },
  { nome: "Corumbá, MS (Pantanal)", lat: -19.0, lon: -57.6 },
  { nome: "Campo Grande, MS (Cerrado)", lat: -20.44, lon: -54.64 },
  { nome: "Goiânia, GO (Cerrado)", lat: -16.6, lon: -49.2 },
  { nome: "Palmas, TO (Cerrado)", lat: -10.1, lon: -48.3 },
  { nome: "Barreiras, BA (Matopiba)", lat: -12.1, lon: -45.0 },
  { nome: "Teresina, PI (Caatinga)", lat: -5.09, lon: -42.80 },
  { nome: "São Luís, MA (Mata dos Cocais)", lat: -2.53, lon: -44.30 },
  { nome: "Petrolina, PE (Caatinga)", lat: -9.3, lon: -40.5 },
  { nome: "Juazeiro do Norte, CE (Caatinga)", lat: -7.20, lon: -39.31 },
  { nome: "Mossoró, RN (Caatinga)", lat: -5.18, lon: -37.34 },
  { nome: "Belo Horizonte, MG (Cerrado/M.A.)", lat: -19.92, lon: -43.93 },
  { nome: "Ribeirão Preto, SP (Mata Atlântica)", lat: -21.1, lon: -47.8 },
  { nome: "Foz do Iguaçu, PR (Mata Atlântica)", lat: -25.51, lon: -54.58 },
];

type PontoMapa = {
  nome: string;
  lat: number;
  lon: number;
  risco: PrevisaoResponse | null;
  status: "carregando" | "sucesso" | "erro";
};

// Componente para forçar o redimensionamento e evitar os quadradinhos quebrados
function MapFix() {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
}

export default function Previsao() {
  const [form, setForm] = useState<PrevisaoRequest>({ latitude: 0, longitude: 0 });
  const [resultado, setResultado] = useState<PrevisaoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  
  const [cidadeBusca, setCidadeBusca] = useState("");
  const [buscandoCidade, setBuscandoCidade] = useState(false);

  const [pontosMapa, setPontosMapa] = useState<PontoMapa[]>(
    PONTOS_MONITORAMENTO.map(p => ({ ...p, risco: null, status: "carregando" }))
  );

  useEffect(() => {
    carregarMapaAVE();
  }, []);

  const carregarMapaAVE = async () => {
    const promessas = PONTOS_MONITORAMENTO.map(async (ponto) => {
      try {
        const res = await apiDS.preverOcorrencia({ latitude: ponto.lat, longitude: ponto.lon });
        return { ...ponto, risco: res, status: "sucesso" as const };
      } catch (err) {
        return { ...ponto, risco: null, status: "erro" as const };
      }
    });

    const resultados = await Promise.all(promessas);
    setPontosMapa(resultados);
  };

  const capturarLocalizacao = () => {
    if (!navigator.geolocation) {
      setErro("Geolocalização não suportada.");
      return;
    }
    setBuscandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setBuscandoLocal(false);
        setErro("");
      },
      () => {
        setErro("Falha ao obter localização via GPS.");
        setBuscandoLocal(false);
      }
    );
  };

  const handleBuscarCidade = async () => {
    if (!cidadeBusca.trim()) return;
    setBuscandoCidade(true);
    setErro("");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cidadeBusca)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
      } else {
        setErro("Cidade não encontrada.");
      }
    } catch (err) {
      setErro("Erro ao consultar o serviço de mapas.");
    } finally {
      setBuscandoCidade(false);
    }
  };

  const handlePrever = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    setResultado(null);
    try {
      const dados = await apiDS.preverOcorrencia(form);
      setResultado(dados);
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro desconhecido ao consultar modelo.");
    } finally {
      setLoading(false);
    }
  };

  // Função atualizada para incluir a cor Amarela no risco Moderado/Médio
  const getCorRisco = (classe?: string) => {
    if (!classe) return "#9ca3af";
    const text = classe.toLowerCase();
    if (text.includes("alto") || text.includes("crítico")) return "#dc2626"; // Vermelho
    if (text.includes("médio") || text.includes("medio") || text.includes("moderado")) return "#eab308"; // Amarelo
    return "#16a34a"; // Verde (para risco Baixo)
  };

  return (
    <div className="page-container previsao-page">
      <div className="page-header">
        <h1 className="page-title">Predição de Risco (AVE)</h1>
        <p className="page-subtitle">Motor de Inteligência Artificial para estimativa de ocorrências em 24h</p>
      </div>

      <div className="content-card map-card">
        <div className="map-header">
          <h3>Visão Geral do País (Em Tempo Real)</h3>
          <button className="btn-refresh" onClick={carregarMapaAVE}>Atualizar Mapa</button>
        </div>
        <div className="map-container-wrapper">
          <MapContainer 
            center={[-14.235, -51.925]} 
            zoom={4} 
            scrollWheelZoom={false}
            className="leaflet-map"
            style={{ height: "350px", width: "100%", zIndex: 1 }}
          >
            <MapFix />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
            />
            {pontosMapa.map((ponto, idx) => {
              if (ponto.status !== "sucesso" || !ponto.risco) return null;
              const cor = getCorRisco(ponto.risco.classe);
              return (
                <CircleMarker 
                  key={idx}
                  center={[ponto.lat, ponto.lon]}
                  pathOptions={{ color: cor, fillColor: cor, fillOpacity: 0.35, weight: 2 }}
                  radius={24}
                >
                  <Tooltip>
                    <strong>{ponto.nome}</strong><br/>
                    Risco: {ponto.risco.classe} ({(ponto.risco.probabilidade * 100).toFixed(1)}%)<br/>
                    Bioma: {ponto.risco.bioma_modal || "N/A"}
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      <div className="previsao-grid">
        <div className="content-card form-section">
          <h3>Consulta Específica</h3>
          <p className="text-muted">Busque por cidade ou insira coordenadas manualmente.</p>

          <div className="busca-cidade-group">
            <div className="search-input-wrapper">
              <input
                type="text"
                value={cidadeBusca}
                onChange={(e) => setCidadeBusca(e.target.value)}
                placeholder="Ex: Lavras, MG"
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarCidade()}
              />
              <button 
                type="button" 
                className="btn-search" 
                onClick={handleBuscarCidade}
                disabled={buscandoCidade || !cidadeBusca.trim()}
              >
                {buscandoCidade ? <div className="spinner-small"></div> : <Search size={18} />}
              </button>
            </div>
            <span className="hint-text">Pressione Enter ou clique na lupa para preencher as coordenadas.</span>
          </div>

          <div className="divider">ou coordenadas manuais</div>

          <form onSubmit={handlePrever} className="previsao-form">
            <div className="input-row">
              <div className="input-group">
                <label>Latitude</label>
                <input type="number" step="any" value={form.latitude || ""} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })} required />
              </div>
              <div className="input-group">
                <label>Longitude</label>
                <input type="number" step="any" value={form.longitude || ""} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })} required />
              </div>
            </div>
            
            <div className="btn-actions">
              <button type="button" className="btn-location-small" onClick={capturarLocalizacao} disabled={buscandoLocal} title="Usar Meu GPS">
                <MapPin size={20} />
              </button>
              <button type="submit" className="btn-primary-previsao" disabled={loading}>
                <Target size={18} />
                {loading ? "Processando..." : "Calcular Risco"}
              </button>
            </div>
          </form>

          {erro && <div className="alert-error"><AlertTriangle size={18} /> {erro}</div>}
        </div>

        <div className="content-card result-section">
          <h3>Resultado do Modelo</h3>
          {!resultado && !loading && (
            <div className="empty-result">
              <ShieldCheck size={48} />
              <p>Aguardando submissão de coordenadas para processar a predição.</p>
            </div>
          )}

          {loading && (
            <div className="empty-result">
              <div className="spinner"></div>
              <p>Consultando base histórica e aplicando modelo...</p>
            </div>
          )}

          {resultado && (
            <div className="resultado-box">
              <div className="risco-header" style={{ borderLeftColor: getCorRisco(resultado.classe) }}>
                <div className="risco-title">
                  <span>Classe de Risco</span>
                  <h2 style={{ color: getCorRisco(resultado.classe) }}>{resultado.classe}</h2>
                </div>
                <div className="probabilidade-circle" style={{ borderColor: getCorRisco(resultado.classe) }}>
                  {(resultado.probabilidade * 100).toFixed(1)}%
                </div>
              </div>

              <div className="stats-grid mt-4">
                <div className="stat-item"><span className="label">Bioma Predominante</span><span className="value">{resultado.bioma_modal || "N/A"}</span></div>
                <div className="stat-item"><span className="label">Histórico da Célula</span><span className="value">{resultado.n_historico_celula} focos</span></div>
              </div>

              {resultado.severidade_frp !== null && resultado.classe_severidade && (
                <div className="severidade-box mt-4">
                  <div className="sev-icon"><Flame size={24} color="#ea580c" /></div>
                  <div className="sev-info">
                    <h4>Previsão de Severidade</h4>
                    <p>FRP Estimado: <strong>{resultado.severidade_frp} MW</strong></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}