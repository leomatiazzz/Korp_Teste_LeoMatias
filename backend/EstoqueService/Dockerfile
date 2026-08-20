# ==============================================================================
# Multi-stage Dockerfile para EstoqueService (.NET 9)
# ==============================================================================

# Estágio 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências
COPY ["EstoqueService.csproj", "./"]
RUN dotnet restore "./EstoqueService.csproj"

# Copiar o restante do código e compilar
COPY . .
RUN dotnet publish "./EstoqueService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5001
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5001

ENTRYPOINT ["dotnet", "EstoqueService.dll"]
