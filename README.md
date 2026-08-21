# Korp - Sistema de Emissão de Notas Fiscais e Controle de Estoque

Projeto desenvolvido como parte do processo seletivo técnico da **Korp (Viasoft)**.

---

## 📌 Visão geral da arquitetura

O sistema é estruturado em uma arquitetura de **microsserviços em .NET 9** e um frontend SPA em **Angular com Angular Material**, utilizando persistência real no **PostgreSQL** com isolamento por schemas.

```
┌────────────────────────────────────────────────────────┐
│               Frontend Angular (Porta 4200)            │
│               Identidade visual Korp / Viasoft         │
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

## ✨ Funcionalidades e requisitos atendidos

### Requisitos obrigatórios
1. **Estoque Service**:
   * CRUD completo de produtos (código único, descrição, saldo).
   * Consulta de saldo em tempo real por ID (`GET /api/produtos/{id}/saldo`).
   * Baixa atômica de múltiplos produtos (`POST /api/produtos/baixar-estoque`).
2. **Faturamento Service**:
   * Criação de notas fiscais no status **Aberta** com múltiplos produtos.
   * Geração e persistência de numeração sequencial automática contínua.
   * Emissão/Fechamento da nota com acionamento do Estoque Service para dedução do saldo.
   * **Resiliência e tolerância a falhas**: Se o Estoque Service estiver offline ou inacessível no momento da impressão, a nota permanece **Aberta** e o sistema retorna erro amigável (`HTTP 503 Service Unavailable`).
3. **Frontend Angular**:
   * Interface completa em Angular Material com **identidade visual Korp** (fonte *Work Sans*, paleta azul ardósia `#2b485a` e magenta `#ff0c46`).
   * Listagem de notas com filtros de status (Todas, Abertas, Fechadas), modal de detalhes e botão destacado de emissão.
   * Catálogo de produtos com consulta instantânea de saldo e formulário de cadastro.

### Requisitos opcionais implementados ⭐
1. **Tratamento de concorrência (bloqueio pessimista no PostgreSQL)**:
   * Proteção contra condições de corrida (*race conditions*) utilizando `SELECT ... FOR UPDATE` no PostgreSQL dentro da transação atômica do `EstoqueService`.
   * Ordenação determinística de produtos para prevenção de *deadlocks*.
   * Garante consistência mesmo com saldo 1 sendo disputado simultaneamente por notas diferentes.
2. **Implementação de idempotência distribuída**:
   * Tabela `estoque.movimentacoes_estoque` para rastreamento de baixas por `NotaFiscalId`.
   * Disparos repetidos ou duplos cliques no botão de impressão retornam confirmação de sucesso sem debitar o saldo mais de uma vez.

---

## 📋 Detalhamento técnico da solução

Conforme os itens solicitados na especificação técnica do teste:

### 1. Quais ciclos de vida do Angular foram utilizados?
* **`ngOnInit`**: Utilizado em todos os componentes para inicialização de dados, carregamento das listas de notas fiscais, catálogo de produtos e cálculo de métricas reativas.
* **`ngOnDestroy`**: Utilizado em conjunto com o operador RxJS `takeUntil(this.destroy$)` para cancelar inscrições ativas e descarregar recursos quando os componentes são destruídos, prevenindo vazamentos de memória (*memory leaks*).

### 2. Uso da biblioteca RxJS
* **Comunicação assíncrona**: Utilização de `Observable<T>` em todos os métodos dos serviços HTTP (`ProdutoService`, `NotaFiscalService`).
* **Gerenciamento de ciclo de vida**: Utilização de `Subject<void>` com o operador `takeUntil(this.destroy$)` para garantir que requisições pendentes sejam desinscritas caso o usuário mude de tela.
* **Operadores e tratamento**: Utilização de `pipe()`, `catchError` para interceptação e normalização de erros de rede/servidor e `finalize` para controle de spinners de carregamento.

### 3. Bibliotecas utilizadas e finalidades
* **Frontend**:
  * `@angular/material` e `@angular/cdk`: Componentes visuais de design corporativo acessíveis e responsivos.
* **Backend C#**:
  * `Npgsql.EntityFrameworkCore.PostgreSQL`: Provider oficial do Entity Framework Core para comunicação com o PostgreSQL com suporte a schemas isolados e transações.
  * `Swashbuckle.AspNetCore`: Geração de documentação OpenAPI e interface interativa Swagger.

### 4. Bibliotecas de componentes visuais
* **Angular Material**: `MatTable`, `MatDialog`, `MatSnackBar`, `MatToolbar`, `MatButton`, `MatIcon`, `MatInput`, `MatFormField`, `MatSelect`, `MatProgressSpinner`, `MatBadge` e `MatTooltip`.

### 5. Gerenciamento de dependências no C#
* Gerenciamento nativo através do **NuGet** com declaração declarativa nos arquivos `.csproj` e injeção de dependência nativa do ASP.NET Core (`Microsoft.Extensions.DependencyInjection`) através de serviços com escopo `Scoped` e clientes HTTP tipados com `AddHttpClient`.

### 6. Frameworks utilizados em C#
* **ASP.NET Core Web API (.NET 9)**
* **Entity Framework Core 9 (EF Core)**

### 7. Tratamento de erros e exceções no backend
* **Exceções customizadas de domínio**: Criação da classe `EstoqueIndisponivelException` para representar falhas de comunicação entre microsserviços.
* **Códigos HTTP semânticos**:
  * `400 Bad Request`: Erros de validação de negócio (saldo insuficiente, código já cadastrado, payload vazio).
  * `404 Not Found`: Entidade inexistente.
  * `503 Service Unavailable`: Queda do serviço de estoque durante a impressão da nota fiscal, mantendo o status **Aberta** sem corrupção de estado.
  * `200 OK` / `201 Created`: Respostas de sucesso com DTOs tipados.
* **Transações atômicas**: Uso de `BeginTransactionAsync`, `CommitAsync` e `RollbackAsync` para garantir que o banco nunca fique em estado inconsistente.

### 8. Uso de LINQ em C#
* O LINQ foi amplamente utilizado para consultas, agregações, filtros e projeções:
  * **Projeções**: `Select(n => new NotaFiscalDto { ... })`
  * **Filtros e validações**: `Where()`, `AnyAsync()`, `FirstOrDefaultAsync()`
  * **Agregações numéricas**: `Sum(i => i.Quantidade)`, `Count()`
  * **Ordenação anti-deadlock**: `OrderBy(id => id)` para garantir ordenação determinística de produtos durante o bloqueio pessimista concorrente.

---

## 🚀 Como executar o projeto

### 🐳 Opção 1: via Docker Compose (Recomendado — 1 Comando)

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

### 💻 Opção 2: Execução local manual (Sem Docker)

#### Pré-requisitos
* [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* [Node.js (v20+)](https://nodejs.org/)
* [PostgreSQL](https://www.postgresql.org/) (porta 5432 padrão com senha configurada no `appsettings.json`)

#### 1. Iniciar os microsserviços
Em terminais separados, execute:

```bash
# Terminal 1: Estoque Service (Porta 5001)
dotnet run --project backend/EstoqueService

# Terminal 2: Faturamento Service (Porta 5002)
dotnet run --project backend/FaturamentoService
```

#### 2. Iniciar o frontend Angular
```bash
# Terminal 3: Frontend Angular (Porta 4200)
cd frontend
npm install
npm start
```

Acesse a aplicação no navegador em: **`http://localhost:4200`**.
