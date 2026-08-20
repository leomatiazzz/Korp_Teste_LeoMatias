# Multi-stage Dockerfile para FaturamentoService (.NET 9)

# Estágio 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências
COPY ["FaturamentoService.csproj", "./"]
RUN dotnet restore "./FaturamentoService.csproj"

# Copiar o restante do código e compilar
COPY . .
RUN dotnet publish "./FaturamentoService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5002
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5002

ENTRYPOINT ["dotnet", "FaturamentoService.dll"]
