import { useEffect, useState, type FormEvent } from "react";
import { Plus, MapPin, Edit2, AlertCircle, ChevronLeft, ChevronRight, X } from "lucide-react";
import { api, type RegistroIncendioDTO, type NovoRegistro } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Registros.scss";

const EMPTY_FORM: NovoRegistro = {
  descricao: "",
  dataRegistro: new Date().toISOString().slice(0, 16),
  latitude: 0,
  longitude: 0,
};

export default function Registros() {
  const { isAuthenticated } = useAuth();
  const [registros, setRegistros] = useState<RegistroIncendioDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Estados de Paginação
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<RegistroIncendioDTO | null>(null);
  const [form, setForm] = useState<NovoRegistro>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [formErro, setFormErro] = useState("");
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  useEffect(() => {
    fetchRegistros(paginaAtual);
  }, [paginaAtual]);

  const fetchRegistros = async (page: number) => {
    try {
      setLoading(true);
      const data = await api.getRegistros(page);
      setRegistros(data.content); 
      setTotalPaginas(data.totalPages);
      setErro("");
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setEditando(null);
    setForm(EMPTY_FORM);
    setFormErro("");
    setShowModal(true);
  };

  const abrirEditar = (reg: RegistroIncendioDTO) => {
    if (!reg.id) return; 
    
    setEditando(reg);
    setForm({
      descricao: reg.descricao || "",
      dataRegistro: reg.dataRegistro?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
      latitude: reg.latitude || 0,
      longitude: reg.longitude || 0,
    });
    setFormErro("");
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
  };

  const capturarLocalizacao = () => {
    if (!navigator.geolocation) {
      setFormErro("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setBuscandoLocal(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setBuscandoLocal(false);
      },
      () => {
        setFormErro("Não foi possível obter a localização. Preencha manualmente.");
        setBuscandoLocal(false);
      }
    );
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setFormErro("");
    try {
      if (editando && editando.id) {
        await api.atualizarRegistro(editando.id, form);
      } else {
        await api.criarRegistro(form);
      }
      await fetchRegistros(paginaAtual);
      fecharModal();
    } catch (err: unknown) {
      setFormErro(err instanceof Error ? err.message : "Erro ao salvar registro.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Registros de Ocorrências</h1>
        <p className="page-subtitle">Acompanhe e gerencie os focos de incêndio locais e via satélite</p>
      </div>

      <div className="content-card">
        <div className="card-header">
          <h3>Tabela de Ocorrências</h3>
          {isAuthenticated && (
            <button className="btn-primary" onClick={abrirNovo}>
              <Plus size={18} />
              Novo Registro
            </button>
          )}
        </div>

        {erro ? (
          <div className="error-state">
            <AlertCircle size={20} />
            {erro}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="ariranha-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Autor</th>
                  <th>Descrição</th>
                  <th>Data do Registro</th>
                  <th>Localização (Lat / Long)</th>
                  {isAuthenticated && <th className="text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="empty-state">Carregando registros...</td></tr>
                ) : registros.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">Nenhum registro encontrado.</td></tr>
                ) : (
                  registros.map((reg, index) => (
                    <tr key={reg.id || `inpe-${index}`}>
                      <td className="id-column">#{reg.id ?? "N/A"}</td>
                      {/* O autor continua sendo exibido aqui, vindo da resposta do backend */}
                      <td>{reg.autor || "Sistema INPE"}</td>
                      <td className="desc-column">{reg.descricao || "Foco detectado via satélite"}</td>
                      <td>
                        {reg.dataRegistro 
                          ? new Date(reg.dataRegistro).toLocaleString("pt-BR") 
                          : "Data Indisponível"}
                      </td>
                      <td>
                        <div className="location-badge">
                          <MapPin size={14} />
                          {reg.latitude !== null && reg.longitude !== null 
                            ? `${reg.latitude.toFixed(4)}, ${reg.longitude.toFixed(4)}`
                            : "N/A"}
                        </div>
                      </td>
                      {isAuthenticated && (
                        <td className="actions-column">
                          {reg.id && (
                            <button className="btn-icon" onClick={() => abrirEditar(reg)} title="Editar">
                              <Edit2 size={18} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* BARRA DE PAGINAÇÃO */}
        <div className="pagination-bar">
          <button 
            className="btn-pagination" 
            disabled={paginaAtual === 0 || loading} 
            onClick={() => setPaginaAtual(p => p - 1)}
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <span className="pagination-info">
            Página <strong>{paginaAtual + 1}</strong> de {totalPaginas || 1}
          </span>
          <button 
            className="btn-pagination" 
            disabled={paginaAtual >= totalPaginas - 1 || loading} 
            onClick={() => setPaginaAtual(p => p + 1)}
          >
            Próxima <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* MODAL DE NOVO/EDITAR REGISTRO */}
      {showModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? "Editar Registro" : "Novo Registro"}</h2>
              <button className="btn-close" onClick={fecharModal}><X size={20}/></button>
            </div>
            
            {formErro && (
              <div className="alert-error-modal">
                <AlertCircle size={16} />
                {formErro}
              </div>
            )}

            <form onSubmit={handleSalvar} className="modal-form">
              <div className="input-group">
                <label>Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Preencha aqui um detalhamento do ocorrido."
                  required
                  rows={3}
                />
              </div>

              <div className="input-group">
                <label>Data e Hora</label>
                <input
                  type="datetime-local"
                  value={form.dataRegistro}
                  onChange={(e) => setForm({ ...form, dataRegistro: e.target.value })}
                  required
                />
              </div>

              <div className="location-section">
                <label>Localização</label>
                <button 
                  type="button" 
                  className="btn-location" 
                  onClick={capturarLocalizacao}
                  disabled={buscandoLocal}
                >
                  <MapPin size={16} />
                  {buscandoLocal ? "Buscando..." : "Clique para obter localização atual"}
                </button>
                
                <div className="input-row">
                  <div className="input-group">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={form.latitude || ""}
                      onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={form.longitude || ""}
                      onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={salvando}>
                  {salvando ? "Salvando..." : editando ? "Atualizar Registro" : "Salvar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}