# Korp - Sistema de Emissão de Notas Fiscais e Controle de Estoque

Projeto desenvolvido como parte do processo seletivo técnico da **Korp (Viasoft)**.

---

## 📌 Visão Geral da Arquitetura

O sistema é estruturado em uma arquitetura de **Microsserviços em .NET 9** e um frontend SPA em **Angular com Angular Material**, utilizando persistência real no **PostgreSQL** com isolamento por schemas.

```
┌────────────────────────────────────────────────────────┐
│               Frontend Angular (Porta 4200)            │
│               Identidade Visual Korp / Viasoft         │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               │ HTTP REST                │ HTTP REST
               ▼                          ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│       Estoque Service        │   │     Faturamento Service      │
│          (Porta 5001)        │   │          (Porta 5002)        │
│    ASP.NET Core Web API 9    │   │    ASP.NET Core Web API 9    │
└──────────────┬───────────────┘   └──────────────┬───────────────┘
               │                                  │
               │ HTTP (Baixa de Estoque)          │
               │◄─────────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│                   PostgreSQL 16                        │
│   Schema: estoque        │   Schema: faturamento       │
│   - produtos             │   - notas_fiscais           │
│   - movimentacoes_estoque│   - itens_nota_fiscal       │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades e Requisitos Atendidos

### Requisitos Obrigatórios
1. **Estoque Service**:
   * CRUD completo de produtos (código único, descrição, saldo).
   * Consulta de saldo em tempo real por ID (`GET /api/produtos/{id}/saldo`).
   * Baixa atômica de múltiplos produtos (`POST /api/produtos/baixar-estoque`).
2. **Faturamento Service**:
   * Criação de notas fiscais no status **Aberta** com múltiplos produtos.
   * Geração e persistência de numeração sequencial automática contínua.
   * Emissão/Fechamento da nota com acionamento do Estoque Service para dedução do saldo.
   * **Resiliência e Tolerância a Falhas**: Se o Estoque Service estiver offline ou inacessível no momento da impressão, a nota permanece **Aberta** e o sistema retorna erro amigável (`HTTP 503 Service Unavailable`).
3. **Frontend Angular**:
   * Interface completa em Angular Material com **Identidade Visual Korp** (fonte *Work Sans*, paleta azul ardósia `#2b485a` e magenta `#ff0c46`).
   * Listagem de notas com filtros de status (Todas, Abertas, Fechadas), modal de detalhes e botão destacado de emissão.
   * Catálogo de produtos com consulta instantânea de saldo e formulário de cadastro.

### Requisitos Opcionais Implementados ⭐
1. **Tratamento de Concorrência (Bloqueio Pessimista no PostgreSQL)**:
   * Proteção contra condições de corrida (*race conditions*) utilizando `SELECT ... FOR UPDATE` no PostgreSQL dentro da transação atômica do `EstoqueService`.
   * Ordenação determinística de produtos para prevenção de *deadlocks*.
   * Garante consistência mesmo com saldo 1 sendo disputado simultaneamente por notas diferentes.
2. **Implementação de Idempotência Distribuída**:
   * Tabela `estoque.movimentacoes_estoque` para rastreamento de baixas por `NotaFiscalId`.
   * Disparos repetidos ou duplos cliques no botão de impressão retornam confirmação de sucesso sem debitar o saldo mais de uma vez.

---

## 🚀 Como Executar o Projeto

### 🐳 Opção 1: Via Docker Compose (Recomendado — 1 Comando)

Com o Docker instalado, execute na raiz do projeto:

```bash
docker compose up --build
```

O Docker inicializará e conectará automaticamente os 4 serviços:
* **Frontend Angular**: `http://localhost:4200`
* **Faturamento Service API + Swagger**: `http://localhost:5002/swagger`
* **Estoque Service API + Swagger**: `http://localhost:5001/swagger`
* **PostgreSQL**: `localhost:5432`

---

### 💻 Opção 2: Execução Local Manual (Sem Docker)

#### Pré-requisitos
* [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* [Node.js (v20+)](https://nodejs.org/)
* [PostgreSQL](https://www.postgresql.org/) (porta 5432 padrão com senha configurada no `appsettings.json`)

#### 1. Iniciar os Microsserviços
Em terminais separados, execute:

```bash
# Terminal 1: Estoque Service (Porta 5001)
dotnet run --project backend/EstoqueService

# Terminal 2: Faturamento Service (Porta 5002)
dotnet run --project backend/FaturamentoService
```

#### 2. Iniciar o Frontend Angular
```bash
# Terminal 3: Frontend Angular (Porta 4200)
cd frontend
npm install
npm start
```

Acesse a aplicação no navegador em: **`http://localhost:4200`**.

---

## 🛠️ Stack Tecnológica

* **Backend**:
  * C# / .NET 9 (ASP.NET Core Web API)
  * Entity Framework Core 9
  * PostgreSQL (Npgsql)
  * Swagger / OpenAPI
* **Frontend**:
  * Angular 18+ (Standalone Components)
  * Angular Material & CDK
  * TypeScript & RxJS
  * Design Tokens e Tipografia Corporativa Korp (Work Sans)
* **DevOps & Conteinerização**:
  * Docker & Docker Compose (Multi-stage builds)
  * Nginx Alpine (Reverse proxy & Static Server)
