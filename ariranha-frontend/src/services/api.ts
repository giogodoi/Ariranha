const BASE_URL = "http://localhost:8080";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Erro ${res.status}`);
  }

  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as T) : (null as unknown as T);
  } catch (err) {
    console.error("Erro de parse no JSON (Provável resposta truncada):", err);
    throw new Error("Resposta do servidor malformada. Tente reduzir o volume de dados.");
  }
}

// Interfaces de Resposta
export type LoginResponse = { token: string };

// Representa o objeto Page do Spring Boot
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export type RegistroIncendioDTO = {
  id: number | null; // Pode vir null do INPE
  autor: string | null;
  descricao: string | null;
  dataRegistro: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type NovoRegistro = {
  autor: string;
  descricao: string;
  dataRegistro: string;
  latitude: number;
  longitude: number;
};

export type NovoUsuario = {
  nomeCompleto: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
};

export const api = {
  login: (cpf: string, senha: string) =>
    request<LoginResponse>("/usuarios/login", {
      method: "POST",
      body: JSON.stringify({ cpf, senha }),
    }),

  // Agora retorna uma Página em vez de Array simples
  getRegistros: (page = 0, size = 20) =>
    request<PaginatedResponse<RegistroIncendioDTO>>(`/registros?page=${page}&size=${size}`),

  criarRegistro: (registro: NovoRegistro) =>
    request<RegistroIncendioDTO>("/registros", {
      method: "POST",
      body: JSON.stringify(registro),
    }),

  atualizarRegistro: (id: number, registro: NovoRegistro) =>
    request<RegistroIncendioDTO>(`/registros/${id}`, {
      method: "PUT",
      body: JSON.stringify(registro),
    }),

  criarUsuario: (usuario: NovoUsuario) =>
    request<any>("/usuarios/cadastrar", {
      method: "POST",
      body: JSON.stringify(usuario),
    }),
};

// ==========================================
// CONFIGURAÇÃO DO SERVIÇO DE DATA SCIENCE (PYTHON/FASTAPI)
// ==========================================

// Definimos a URL base do sidecar de predição
const DS_BASE_URL = "http://localhost:5000";

// Tipos baseados nos modelos Pydantic do seu app.py
export type PrevisaoRequest = {
  latitude: number;
  longitude: number;
  data_hora?: string; // Formato ISO 8601 opcional
};

export type PrevisaoResponse = {
  probabilidade: number;
  classe: string;
  horizonte: string; // Ex: "24h"
  cell_id: string;
  lat_grid: number;
  lon_grid: number;
  n_historico_celula: number;
  bioma_modal?: string;
  severidade_frp?: number | null;
  classe_severidade?: string | null;
};

// Cliente para a API de Data Science
export const apiDS = {
  /**
   * Envia coordenadas para o modelo de IA e retorna o risco de ocorrência e severidade
   */
  preverOcorrencia: async (dados: PrevisaoRequest): Promise<PrevisaoResponse> => {
    const res = await fetch(`${DS_BASE_URL}/predict/ocorrencia`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dados),
    });

    if (!res.ok) {
      const errorData = await res.json();
      // O FastAPI retorna erros no campo 'detail'
      const mensagem = errorData.detail?.erro || errorData.detail || "Erro no motor de predição";
      throw new Error(mensagem);
    }

    return res.json();
  },

  /**
   * Verifica a saúde do serviço de ML
   */
  getHealth: async () => {
    const res = await fetch(`${DS_BASE_URL}/health`);
    return res.json();
  }
};