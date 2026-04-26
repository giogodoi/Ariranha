# Ariranha

Sistema de monitoramento de focos de incendio desenvolvido para o Desafio III da Segunda Edicao do ZettaLAB. A plataforma integra dados em tempo real do INPE (Instituto Nacional de Pesquisas Espaciais), registros geograficos de usuarios autenticados e modelos de ciencia de dados para predicao de ocorrencia e severidade de queimadas no territorio brasileiro.

---

## Sumario

- [Visao Geral da Arquitetura](#visao-geral-da-arquitetura)
- [Modulo Backend](#modulo-backend)
  - [Tecnologias Utilizadas](#tecnologias-utilizadas)
  - [Endpoints da API REST](#endpoints-da-api-rest)
  - [Seguranca e Autenticacao JWT](#seguranca-e-autenticacao-jwt)
  - [Criptografia de Senhas com BCrypt](#criptografia-de-senhas-com-bcrypt)
  - [Paginacao Eficiente](#paginacao-eficiente)
  - [Integracao com o INPE via WFS](#integracao-com-o-inpe-via-wfs)
  - [Tratamento Global de Excecoes](#tratamento-global-de-excecoes)
- [Modelo Relacional do Banco de Dados (JPA)](#modelo-relacional-do-banco-de-dados-jpa)
  - [Entidade Usuario](#entidade-usuario)
  - [Entidade RegistroIncendio](#entidade-registroincendio)
  - [Relacionamento Entre Entidades](#relacionamento-entre-entidades)
  - [Suporte a Dados Geograficos com PostGIS](#suporte-a-dados-geograficos-com-postgis)
- [Modulo de Ciencia de Dados](#modulo-de-ciencia-de-dados)
  - [Pipeline de Dados](#pipeline-de-dados)
  - [Modelos de Machine Learning](#modelos-de-machine-learning)
  - [API de Predicao](#api-de-predicao)
- [Modulo Frontend](#modulo-frontend)
- [Infraestrutura e Docker](#infraestrutura-e-docker)
- [Como Executar o Projeto](#como-executar-o-projeto)

---

## Design / UI

O design do sistema e prototipagem de Alta Fidelidade estão disponíveis no link abaixo:
[LINK DO FIGMA](https://www.figma.com/design/BAyTlq8C1WKm5x85fouRdc/Ariranha?node-id=0-1&t=dHfjYhxXWt764d1o-0)

---
## PrintScreens do Sistema

<img width="1723" height="833" alt="image" src="https://github.com/user-attachments/assets/fa058fca-3222-4dbc-9d97-adf51d192044" />
<img width="1638" height="933" alt="image" src="https://github.com/user-attachments/assets/968d0d27-9b51-448b-ac7b-a40a16758b50" />
<img width="1842" height="933" alt="image" src="https://github.com/user-attachments/assets/a9b2fed2-a013-4ec6-b5fd-a4efb4f5352b" />
<img width="1473" height="930" alt="image" src="https://github.com/user-attachments/assets/0619c8f3-75a5-4f27-9b7b-021b42b6056f" />
<img width="1345" height="928" alt="image" src="https://github.com/user-attachments/assets/01e7877e-d09b-4845-b525-ea91df3936ca" />





---
## Visao Geral da Arquitetura

O projeto Ariranha e composto por tres modulos independentes e orquestrados via Docker Compose:

| Modulo            | Tecnologia Principal     | Porta  | Descricao                                              |
|-------------------|--------------------------|--------|--------------------------------------------------------|
| `ariranha-backend` | Spring Boot 3 / Java 21 | 8080   | API REST principal, autenticacao, persistencia         |
| `ariranha-ds`      | Python / FastAPI         | 5000   | Servico de ciencia de dados e predicao com ML          |
| `ariranha-frontend`| React / TypeScript / Vite| 3000   | Interface web servida via Nginx                        |
| `db`               | PostgreSQL 15 + PostGIS  | 5432   | Banco de dados relacional com suporte espacial         |

---

## Modulo Backend

### Tecnologias Utilizadas

- **Java 21** com **Spring Boot 3.2.5**
- **Spring Data JPA** com **Hibernate Spatial** para suporte a geometrias
- **Spring Security** com filtro JWT personalizado
- **jjwt 0.11.5** para geracao e validacao de tokens
- **PostgreSQL** com extensao **PostGIS 3.3** via `hibernate-spatial`
- **JTS (Java Topology Suite) 1.19.0** para manipulacao de objetos geometricos
- **Lombok** para reducao de boilerplate nas entidades
- **Bean Validation** via `spring-boot-starter-validation`
- **RestTemplate** para consumo da API WFS do INPE

### Endpoints da API REST

#### Usuarios (`/usuarios`)

| Metodo | Rota                  | Autenticacao | Descricao                                   |
|--------|-----------------------|--------------|---------------------------------------------|
| POST   | `/usuarios/cadastrar` | Publica      | Cadastra novo usuario com validacao de CPF  |
| POST   | `/usuarios/login`     | Publica      | Autentica e retorna token JWT               |
| GET    | `/usuarios`           | Publica      | Lista todos os usuarios cadastrados         |

#### Registros de Incendio (`/registros`)

| Metodo | Rota                   | Autenticacao   | Descricao                                                   |
|--------|------------------------|----------------|-------------------------------------------------------------|
| GET    | `/registros`           | Publica        | Lista registros locais paginados + dados em tempo real INPE |
| GET    | `/registros/{id}`      | Publica        | Busca registro especifico por ID                            |
| GET    | `/registros/historico` | Publica        | Historico INPE filtrado por estado, ano e mes               |
| POST   | `/registros`           | Autenticado    | Cria novo registro com coordenadas geograficas              |
| PUT    | `/registros/{id}`      | Autenticado    | Atualiza registro existente                                 |

### Seguranca e Autenticacao JWT

A seguranca e implementada por meio de uma cadeia de filtros do Spring Security totalmente sem estado (stateless), eliminando o uso de sessoes HTTP no servidor. O componente `JwtRequestFilter`, que estende `OncePerRequestFilter`, intercepta cada requisicao e valida o token JWT presente no cabecalho `Authorization: Bearer <token>`.

O token e assinado e verificado com o algoritmo **HMAC-SHA** utilizando uma chave secreta configuravel via propriedade `ariranha.jwt.secret`. Ao decodificar o token com sucesso, o CPF do usuario e extraido do campo `subject` e inserido no `SecurityContextHolder`, tornando a identidade disponivel para toda a cadeia de processamento da requisicao.

A configuracao de rotas segue o principio de minimo privilegio:

- Rotas publicas: cadastro, login e leitura de registros (`GET /registros/**`)
- Rotas protegidas: criacao, atualizacao e remocao de registros (`POST`, `PUT`, `DELETE /registros/**`)
- Qualquer outra rota nao mapeada requer autenticacao por padrao (`.anyRequest().authenticated()`)

O token JWT carrega as seguintes claims:

```json
{
  "sub": "CPF_DO_USUARIO",
  "nome": "Nome Completo",
  "id": 1,
  "iat": <timestamp_emissao>,
  "exp": <timestamp_expiracao>
}
```

A expiracao e configurada em milissegundos via `ariranha.jwt.expiration` (padrao: 86400000 ms = 24 horas).

### Criptografia de Senhas com BCrypt

Nenhuma senha e armazenada em texto puro no banco de dados. O `UsuarioService` utiliza o `BCryptPasswordEncoder` do Spring Security para aplicar o algoritmo BCrypt antes de persistir o usuario. O BCrypt e uma funcao de hashing adaptativa baseada no algoritmo Blowfish: ele incorpora automaticamente um salt aleatorio em cada hash gerado, tornando ataques de dicionario e rainbow tables ineficazes.

Na autenticacao, o metodo `passwordEncoder.matches(senhaPura, hashArmazenado)` recomputa o hash com o salt embutido e compara com o valor salvo, sem nunca armazenar ou transmitir a senha original. O bean `BCryptPasswordEncoder` e declarado em `SecurityConfig`, garantindo injecao unica e consistente em todos os servicos.

### Paginacao Eficiente

O endpoint `GET /registros` implementa paginacao nativa via Spring Data com a interface `Pageable`. A anotacao `@PageableDefault(size = 20, sort = "id")` define um tamanho de pagina padrao de 20 registros ordenados por `id`, evitando a carga completa da tabela em uma unica consulta.

A estrategia adotada no `RegistroIncendioService` e hibrida:

1. **Primeira pagina (page=0):** retorna registros locais do banco de dados + ate 50 focos em tempo real do INPE (limitados para evitar truncamento de JSON).
2. **Paginas subsequentes:** retorna exclusivamente registros locais, pois os dados do INPE nao sao persistidos localmente.

O retorno e encapsulado em um objeto `PageImpl`, que alem dos dados contem metadados de paginacao como `totalElements`, `totalPages`, `number` e `size`, permitindo que o frontend navegue entre paginas sem reprocessar dados ja exibidos. A transacao de leitura e anotada com `@Transactional(readOnly = true)` para otimizacao de performance no contexto do Hibernate.

### Integracao com o INPE via WFS

O `InpeService` consome a API publica WFS (Web Feature Service) do portal **TerraBrasilis** do INPE para dois cenarios:

- **Dados em tempo real:** busca focos de calor das ultimas 48 horas utilizando filtro `CQL_FILTER=data_hora_gmt >= '<timestamp>'`.
- **Historico mensal:** filtra por estado, ano e mes usando `estado='UF' AND data_hora_gmt BETWEEN '<inicio>' AND '<fim>'`.

Os dados retornados em GeoJSON sao mapeados para `RegistroIncendioDTO`, extraindo coordenadas geograficas, data/hora e fonte (`INPE (Satelite)`), integrando-os de forma transparente na mesma estrutura de dados dos registros locais.

### Tratamento Global de Excecoes

O `GlobalExceptionHandler` centraliza o tratamento de erros via `@RestControllerAdvice`, padronizando as respostas de erro no formato `ErroRespostaDTO`. As excecoes customizadas `EntidadeNaoEncontradaException` e `NegocioException` sao mapeadas para os codigos HTTP apropriados (404 e 400, respectivamente), evitando que stack traces sejam expostos ao cliente.

---

## Modelo Relacional do Banco de Dados (JPA)

O mapeamento objeto-relacional e feito exclusivamente via anotacoes JPA/Hibernate, com `spring.jpa.hibernate.ddl-auto=update` gerenciando a criacao e atualizacao automatica do schema.

### Entidade Usuario

Tabela gerada: `usuarios`

| Coluna          | Tipo          | Restricoes                        | Descricao                        |
|-----------------|---------------|-----------------------------------|----------------------------------|
| `id`            | BIGINT        | PK, AUTO_INCREMENT                | Identificador unico              |
| `nome_completo` | VARCHAR(255)  | NOT NULL                          | Nome completo do usuario         |
| `cpf`           | VARCHAR(11)   | UNIQUE, NOT NULL                  | CPF (usado como credencial)      |
| `telefone`      | VARCHAR(15)   | NOT NULL                          | Telefone de contato              |
| `email`         | VARCHAR(255)  | UNIQUE, NOT NULL                  | Endereco de e-mail               |
| `senha`         | VARCHAR(255)  | NOT NULL                          | Hash BCrypt da senha             |
| `data_criacao`  | TIMESTAMP     | NOT NULL, nao atualizavel         | Data de criacao do registro      |

A anotacao `@Column(name = "data_criacao", updatable = false)` garante que a data de criacao seja imutavel apos o INSERT inicial.

### Entidade RegistroIncendio

Tabela gerada: `registros_incendios`

| Coluna           | Tipo        | Restricoes             | Descricao                               |
|------------------|-------------|------------------------|-----------------------------------------|
| `id`             | BIGINT      | PK, AUTO_INCREMENT     | Identificador unico                     |
| `autor_registro` | BIGINT      | FK -> `usuarios(id)`   | Chave estrangeira para o autor          |
| `descricao`      | VARCHAR(255)| Nullable               | Descricao textual do foco               |
| `data_registro`  | TIMESTAMP   | Default: NOW()         | Data e hora do registro                 |
| `geom`           | GEOMETRY    | PostGIS Point (SRID 4326) | Coordenada geografica do foco        |

### Relacionamento Entre Entidades

O modelo apresenta um relacionamento **Um-para-Muitos** entre `Usuario` e `RegistroIncendio`:

```
usuarios (1) ----< registros_incendios (N)
    id <-------------- autor_registro (FK)
```

- Em `Usuario`: `@OneToMany(mappedBy = "autor", cascade = CascadeType.ALL)` - ao remover um usuario, todos os seus registros sao removidos em cascata.
- Em `RegistroIncendio`: `@ManyToOne` com `@JoinColumn(name = "autor_registro")` - define a chave estrangeira na tabela filha.

### Suporte a Dados Geograficos com PostGIS

O campo `geom` na entidade `RegistroIncendio` e do tipo `org.locationtech.jts.geom.Point`, interpretado pelo `Hibernate Spatial` e armazenado como geometria nativa do PostGIS. No servico, cada ponto e criado com o SRID **4326** (WGS 84 - sistema de coordenadas geograficas padrao, o mesmo utilizado pelo GPS):

```java
GeometryFactory gf = new GeometryFactory();
Point ponto = gf.createPoint(new Coordinate(longitude, latitude));
ponto.setSRID(4326);
```

O banco de dados utilizado e `postgis/postgis:15-3.3-alpine`, com a extensao PostGIS habilitada, permitindo consultas espaciais nativas como calculo de distancias, buffers e intersecoes diretamente via SQL.

---

## Modulo de Ciencia de Dados

### Pipeline de Dados

O pipeline de dados, localizado em `ariranha-ds/src/`, e estruturado nos seguintes modulos:

| Arquivo         | Responsabilidade                                                            |
|-----------------|-----------------------------------------------------------------------------|
| `config.py`     | Configuracoes globais do pipeline (caminhos, parametros)                    |
| `data_loader.py`| Carregamento e leitura dos dados brutos de queimadas                        |
| `features.py`   | Engenharia de features: criacao e transformacao das variaveis preditoras    |
| `train.py`      | Treinamento, validacao e serializacao dos modelos                           |

Os dados de celulas geograficas pre-computadas sao armazenados no arquivo `models/cell_stats.parquet`, formato colunar eficiente para grandes volumes de dados. O notebook `docs/demonstracao_pipeline.ipynb` documenta e demonstra o fluxo completo do pipeline de forma interativa.

### Modelos de Machine Learning

Dois modelos treinados e serializados com `joblib` compoem o nucleo preditivo:

| Arquivo                    | Tipo de Modelo     | Objetivo                                              |
|----------------------------|--------------------|-------------------------------------------------------|
| `modelo_ocorrencia.joblib` | Classificacao      | Prediz a **probabilidade de ocorrencia** de incendio  |
| `modelo_severidade.joblib` | Regressao/Classif. | Prediz a **severidade** estimada do foco              |

O encoder `encoder_bioma.joblib` e responsavel por transformar a variavel categorica de bioma (ex.: Amazonia, Cerrado, Caatinga) em representacao numerica antes da inferencia. O arquivo `models/metadata.json` armazena metadados dos modelos, como versao, data de treinamento e variaveis utilizadas, garantindo rastreabilidade.

### API de Predicao

O arquivo `ariranha-ds/api/app.py` expoe os modelos como uma API via Flask/FastAPI na porta **5000**. O servico e containerizado com Docker e sobe junto com os demais modulos via `docker-compose`, sendo acessivel internamente para o backend e externamente para validacao.

---

## Modulo Frontend

O frontend, em `ariranha-frontend/src/`, e desenvolvido com **React 18 + TypeScript + Vite** e organizado nas seguintes camadas:

- **`pages/`**: paginas da aplicacao (tela de mapa, historico, login, cadastro)
- **`components/`**: componentes reutilizaveis de interface
- **`context/`**: gerenciamento de estado global via React Context API (autenticacao, usuario logado)
- **`services/`**: modulo de integracao com a API REST do backend
- **`styles/`**: estilizacao global

O arquivo `nginx.conf` configura o Nginx para servir o build estatico do React na porta **80** do container (mapeada para 3000 no host), com suporte a roteamento SPA (Single Page Application) via `try_files $uri /index.html`.

---

## Infraestrutura e Docker

O arquivo `docker-compose.yml` na raiz do projeto orquestra todos os quatro servicos. A ordem de inicializacao e controlada via `depends_on`:

```
db --> ariranha-backend --> ariranha-frontend
           |
    ariranha-ds (independente)
```

- O banco de dados `ariranha-db` utiliza volume nomeado `postgres_data` para persistencia dos dados apos reinicializacao do container.
- O backend aguarda o servico `db` estar disponivel antes de subir, evitando erros de conexao na inicializacao.
- Cada modulo possui seu proprio `Dockerfile`, permitindo builds independentes e isolados.

---

## Como Executar o Projeto

**Pre-requisitos:** Docker e Docker Compose instalados.

1. Clone o repositorio:

```bash
git clone https://github.com/giogodoi/Ariranha.git
cd Ariranha
```

2. Suba todos os servicos com Docker Compose:

```bash
docker-compose up --build
```

3. Acesse os servicos:

| Servico    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000       |
| Backend    | http://localhost:8080       |
| DS / ML    | http://localhost:5000       |
| Banco      | localhost:5432              |

4. Para parar os servicos:

```bash
docker-compose down
```

---

# Colaboradores:
[Isadora Rocha Brito](https://github.com/IsadoraRB-dge)

[Giovane Felipe Godoi Oliveira](https://github.com/giogodoi)
