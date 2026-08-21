# 🎬 Roteiro de Gravação do Vídeo de Demonstração (Korp)

Este guia foi elaborado para cobrir **100% dos requisitos exigidos no edital do teste da Korp (Viasoft)**, garantindo uma apresentação clara, objetiva e de alto impacto técnico.

⏱️ **Duração Recomendada**: Entre **5 a 7 minutos**.

---

## 📋 Checklist de Preparação Antes de Gravar

Deixe os seguintes itens abertos na tela:
1. **Navegador**:
   * Aba 1: Frontend Angular em `http://localhost:4200`
   * Aba 2: Swagger do Estoque em `http://localhost:5001/swagger`
   * Aba 3: Swagger do Faturamento em `http://localhost:5002/swagger`
2. **Terminais (ou VS Code)**:
   * Terminal 1: Rodando `dotnet run --project backend/EstoqueService` (Porta 5001)
   * Terminal 2: Rodando `dotnet run --project backend/FaturamentoService` (Porta 5002)
   * Terminal 3: Rodando o Frontend `npm start` (Porta 4200)
3. **pgAdmin / DBeaver (Opcional, 10 segundos)**:
   * Mostrando o banco `korp_db` com os dois schemas separados: `estoque` e `faturamento`.

---

## 🕒 Cronograma do Vídeo

```
┌───────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Bloco / Tempo Estimado                │ Ação em Tela & O Que Dizer                             │
├───────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1. Introdução (~40 seg)               │ Apresentação pessoal, stack e microsserviços.          │
│ 2. Fluxo Principal de Sucesso (~2 min)│ Produtos, saldo em tempo real, criação e impressão.   │
│ 3. Cenário de Resiliência (~1m30s) ⭐  │ Queda do EstoqueService, erro 503 e recuperação.      │
│ 4. Requisitos Opcionais (~1 min) ⭐   │ Concorrência (FOR UPDATE) e Idempotência distribuída. │
│ 5. Detalhamento Técnico (~1 min) 🎯   │ Ciclos de vida, RxJS, LINQ, tratamento de erros, etc.  │
│ 6. Swagger, Docker e Fim (~30 seg)    │ Demonstração do Swagger, Docker Compose e encerramento.│
└───────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### 🎙️ Bloco 1: Introdução e Arquitetura (0:00 - 0:40)

* **O que mostrar na tela**: A página inicial do sistema (`http://localhost:4200/notas-fiscais`).
* **O que falar (Roteiro sugerido)**:
  > *"Olá a todos da equipe da Korp! Meu nome é Leo Matias e vou apresentar a solução desenvolvida para o teste técnico de Emissão de Notas Fiscais e Controle de Estoque.*  
  >  
  > *A arquitetura foi estruturada em **Microsserviços em .NET 9**, utilizando persistência real no **PostgreSQL** com isolamento por schemas (`estoque` e `faturamento`). No frontend, desenvolvi uma SPA em **Angular com Angular Material**, adotando a identidade visual e tokens oficiais da Korp (Work Sans e paleta corporativa).*  
  >  
  > *Toda a solução também está conteinerizada com **Docker e Docker Compose**."*

---

### 🎙️ Bloco 2: Demonstração do Fluxo Principal de Sucesso (0:40 - 2:30)

#### Passo 2.1: Catálogo de Produtos e Saldo em Tempo Real
* **Ação**: Clique no menu **"Produtos e estoque"**.
* **O que falar**:
  > *"No módulo de produtos (gerenciado pelo **Estoque Service na porta 5001**), temos o catálogo completo. Ao clicar no botão de saldo, o frontend consome em tempo real o endpoint `GET /api/produtos/{id}/saldo`, trazendo a quantidade atualizada diretamente do banco de dados."*
* **Ação**: Abra o modal de saldo de um produto (ex: Notebook ou Teclado).

#### Passo 2.2: Criação de Nova Nota Fiscal
* **Ação**: Volte para **"Notas fiscais"** e clique no botão **"+ Nova nota fiscal"**.
* **O que falar**:
  > *"No módulo de Faturamento (**porta 5002**), ao abrir a tela de nova nota, o sistema calcula e exibe automaticamente o próximo número sequencial contínuo.*  
  > *Adicionamos múltiplos produtos com suas respectivas quantidades, com validação instantânea em tela."*
* **Ação**: Adicione itens e clique em **"Salvar e gerar nota fiscal"**. A nota aparecerá na tabela com a tag amarela **"ABERTA"**.

#### Passo 2.3: Impressão e Dedução Automática de Estoque
* **O que falar**:
  > *"A nota foi criada com status **ABERTA**. Agora vamos acionar o botão visível **Imprimir**.*  
  > *Ao clicar, é exibido o indicador de carregamento, o Faturamento Service aciona o Estoque Service via HTTP para deduzir as quantidades no banco e a nota é atualizada para **FECHADA**."*
* **Ação**: Clique em **"Imprimir"**. Veja o feedback visual e o badge mudando para verde **"FECHADA"**.
* **Ação**: Vá na tela de Produtos e mostre que o saldo foi debitado com exatidão.

---

### 🎙️ Bloco 3: Demonstração do Cenário de Resiliência (2:30 - 4:00) ⭐

*Requisito obrigatório de tratamento de falhas entre microsserviços.*

#### Passo 3.1: Criar uma Nota Aberta
* **Ação**: Crie uma nova nota fiscal (status inicial **ABERTA**).

#### Passo 3.2: Simular Queda do Estoque Service
* **Ação**: Vá no terminal do `EstoqueService` e encerre o processo (`Ctrl + C`).
* **O que falar**:
  > *"Agora vamos simular o cenário de falha exigido pelo desafio: **O que acontece se o serviço de Estoque estiver fora do ar no momento da impressão?**.*  
  > *Acabei de derrubar o Estoque Service no terminal."*

#### Passo 3.3: Tentar Imprimir com Serviço Offline
* **Ação**: Clique no botão **"Imprimir"** da nota aberta.
* **O que falar**:
  > *"O sistema não trava. O Faturamento Service captura a falha de comunicação HTTP e retorna um erro 503 amigável informando que o Estoque está indisponível.*  
  > *E o mais importante: **a Nota Fiscal permanece com status ABERTA**, garantindo integridade transacional sem corromper o estado."*

#### Passo 3.4: Recuperação e Conclusão
* **Ação**: No terminal, reinicie o Estoque (`dotnet run --project backend/EstoqueService`).
* **Ação**: Volte ao navegador e clique novamente em **"Imprimir"**.
* **O que falar**:
  > *"Com o Estoque restabelecido, acionamos a impressão novamente e a nota é finalizada com sucesso como FECHADA."*

---

### 🎙️ Bloco 4: Requisitos Opcionais Implementados (4:00 - 4:50) ⭐

* **O que falar**:
  > *"Implementei também dois requisitos opcionais essenciais para sistemas de ERP:*  
  >  
  > 1. ***Idempotência Distribuída**: Tabela `movimentacoes_estoque` para rastreamento por `NotaFiscalId`. Duplos cliques ou reenvios HTTP não duplicam a baixa de estoque.*  
  > 2. ***Tratamento de Concorrência com Bloqueio Pessimista**: No PostgreSQL, usamos `SELECT ... FOR UPDATE` dentro da transação atômica. Se duas notas simultâneas disputarem um produto com **saldo 1**, o banco serializa a operação com lock exclusivo de linha, impedindo concorrência e saldo negativo.*  
  > 3. *Ordenação determinística de IDs para **prevenção de Deadlocks**."*

---

### 🎙️ Bloco 5: Detalhamento Técnico Exigido pelo Edital (4:50 - 5:50) 🎯

*Neste momento, fale de forma clara respondendo pontualmente aos itens exigidos pelo PDF do teste:*

* **O que falar (Roteiro dos itens técnicos)**:
  > *"Passando agora pelo detalhamento técnico exigido na especificação:*  
  >  
  > *• **Ciclos de vida do Angular**: Utilizei o `ngOnInit` para inicialização e carregamento reativo de dados e o `ngOnDestroy` para o descarte e cancelamento seguro de inscrições com `Subject` e `takeUntil`, prevenindo vazamentos de memória (memory leaks).*  
  > *• **Uso do RxJS**: Utilizado com `Observable`, `Subject`, `takeUntil`, `pipe` e operadores de tratamento de erro (`catchError`) na integração com o `HttpClient`.*  
  > *• **Bibliotecas e Componentes Visuais**: No frontend, utilizei o **Angular Material** (`MatTable`, `MatDialog`, `MatSnackBar`, `MatToolbar`, `MatButton`, etc.). No backend, **Entity Framework Core 9**, **Npgsql** para PostgreSQL e **Swashbuckle** para Swagger/OpenAPI.*  
  > *• **Frameworks em C# e Gerenciamento**: Utilizei o **ASP.NET Core Web API (.NET 9)** com gerenciamento de pacotes via **NuGet** e injeção de dependência nativa.*  
  > *• **Tratamento de Exceções**: Exceções de domínio customizadas (`EstoqueIndisponivelException`), respostas com status semânticos (400, 404, 503) e transações com rollback automático.*  
  > *• **Uso de LINQ**: Utilizado amplamente em consultas, projeções DTOs (`Select`), agregações (`Sum`, `Count`), filtros (`Where`, `AnyAsync`) e ordenação determinística anti-deadlock (`OrderBy`)."*

---

### 🎙️ Bloco 6: Swagger, Docker e Encerramento (5:50 - 6:30)

* **O que mostrar**: 
  * Mostre rapidamente as abas do **Swagger** (`http://localhost:5001/swagger` e `http://localhost:5002/swagger`).
  * Mostre o arquivo `docker-compose.yml` ou o terminal.
* **O que falar**:
  > *"Aqui temos as documentações interativas Swagger de ambos os microsserviços e o arquivo `docker-compose.yml` que sobe toda a aplicação com um único comando `docker compose up`.*  
  >  
  > *O código está disponível no GitHub com histórico semântico de commits e documentação detalhada no README.*  
  > *Agradeço a oportunidade e fico à disposição para a entrevista técnica. Muito obrigado!"*

---

## 💡 Dicas de Gravação
1. **Gravação**: Use o atalho nativo do Windows **`Win + Alt + R`** ou o **OBS Studio**.
2. **Qualidade**: Grave em **1080p** com o navegador em 100% ou 110% de zoom.
3. **Áudio**: Fale perto do microfone com clareza e sem pressa.
