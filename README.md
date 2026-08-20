# Korp - Sistema de Emissão de Notas Fiscais e Controle de Estoque

Projeto desenvolvido como parte do processo seletivo técnico da Korp.

## 📌 Visão Geral

O sistema é composto por uma arquitetura de **Microsserviços em .NET 9** e um frontend SPA em **Angular com Angular Material**, utilizando persistência real em **PostgreSQL**.

### Microsserviços:
1. **Estoque Service (`backend/EstoqueService`)**: Gerenciamento de produtos, códigos, descrições e saldos em estoque.
2. **Faturamento Service (`backend/FaturamentoService`)**: Gerenciamento de notas fiscais, numeração sequencial automática, status (Aberta/Fechada) e processo de emissão/baixa de estoque.
3. **Frontend (`frontend`)**: Interface web moderna construída com Angular Material, consumindo as APIs dos microsserviços com feedback visual em tempo real.

---

## 🛠️ Stack Tecnológica

* **Backend**:
  * C# / .NET 9 (ASP.NET Core Web API)
  * Entity Framework Core 9
  * PostgreSQL (Npgsql)
  * LINQ
  * Swagger / OpenAPI
* **Frontend**:
  * Angular
  * TypeScript
  * Angular Material & CDK
  * RxJS & HttpClient
* **Banco de Dados**:
  * PostgreSQL

---

## 🚀 Como Executar

### 1. Pré-requisitos
* [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
* [Node.js (LTS)](https://nodejs.org/)
* [PostgreSQL](https://www.postgresql.org/)

### 2. Backend
```bash
# Restaurar dependências
dotnet restore backend/Korp_Teste.sln

# Executar Estoque Service (Porta 5001)
dotnet run --project backend/EstoqueService

# Executar Faturamento Service (Porta 5002)
dotnet run --project backend/FaturamentoService
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```
Acesse a aplicação em `http://localhost:4200`.

---

## 📋 Arquitetura e Decisões Técnicas
Para consultar o detalhamento arquitetural completo, consulte o arquivo de plano de implementação e a documentação técnica.
