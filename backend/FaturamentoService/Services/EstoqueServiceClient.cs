using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using FaturamentoService.DTOs;
using FaturamentoService.Exceptions;
using FaturamentoService.Models;
using Microsoft.Extensions.Logging;

namespace FaturamentoService.Services
{
    public class EstoqueServiceClient : IEstoqueServiceClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<EstoqueServiceClient> _logger;

        public EstoqueServiceClient(HttpClient httpClient, ILogger<EstoqueServiceClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task<EstoqueBaixaResponse> BaixarEstoqueAsync(IEnumerable<ItemNotaFiscal> itens, int numeroNota)
        {
            var requestPayload = new EstoqueBaixarRequest
            {
                NotaFiscalId = numeroNota,
                IdempotencyKey = $"NF-{numeroNota}",
                Motivo = $"Emissão da Nota Fiscal Nº {numeroNota}",
                Itens = itens.Select(i => new EstoqueBaixarItemRequest
                {
                    ProdutoId = i.ProdutoId,
                    Quantidade = i.Quantidade
                }).ToList()
            };

            try
            {
                _logger.LogInformation("Solicitando baixa de estoque ao EstoqueService para Nota Fiscal Nº {Numero} ({Count} itens)...", numeroNota, requestPayload.Itens.Count);

                var response = await _httpClient.PostAsJsonAsync("api/produtos/baixar-estoque", requestPayload);

                if (response.IsSuccessStatusCode)
                {
                    var resultado = await response.Content.ReadFromJsonAsync<EstoqueBaixaResponse>(new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    _logger.LogInformation("Baixa de estoque confirmada com sucesso pelo EstoqueService para a Nota Fiscal Nº {Numero}.", numeroNota);
                    return resultado ?? new EstoqueBaixaResponse { Sucesso = true, Mensagem = "Baixa concluída com sucesso." };
                }

                // Tratamento de erros de negócio do EstoqueService (Ex: 400 Bad Request com saldo insuficiente)
                if (response.StatusCode == HttpStatusCode.BadRequest)
                {
                    var erroContent = await response.Content.ReadAsStringAsync();
                    string mensagemErro = "Falha de validação no estoque.";

                    try
                    {
                        using var doc = JsonDocument.Parse(erroContent);
                        if (doc.RootElement.TryGetProperty("mensagem", out var msgProp))
                        {
                            mensagemErro = msgProp.GetString() ?? mensagemErro;
                        }
                    }
                    catch
                    {
                        if (!string.IsNullOrWhiteSpace(erroContent))
                        {
                            mensagemErro = erroContent;
                        }
                    }

                    _logger.LogWarning("EstoqueService rejeitou a baixa para a Nota Fiscal Nº {Numero}. Motivo: {Mensagem}", numeroNota, mensagemErro);
                    throw new InvalidOperationException(mensagemErro);
                }

                // Tratamento de outros status de erro do servidor
                var detalheErro = await response.Content.ReadAsStringAsync();
                _logger.LogError("EstoqueService retornou status HTTP {StatusCode}: {Detalhe}", response.StatusCode, detalheErro);
                throw new EstoqueIndisponivelException($"O serviço de Estoque retornou erro inesperado (Status {(int)response.StatusCode}). A nota fiscal não foi fechada.");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Falha de comunicação HTTP ao conectar ao EstoqueService para a Nota Fiscal Nº {Numero}.", numeroNota);
                throw new EstoqueIndisponivelException("O serviço de Estoque está temporariamente indisponível. A nota fiscal permanece aberta e nenhuma alteração foi realizada. Tente novamente mais tarde.", ex);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Timeout na comunicação com o EstoqueService para a Nota Fiscal Nº {Numero}.", numeroNota);
                throw new EstoqueIndisponivelException("Tempo limite esgotado ao comunicar com o serviço de Estoque. A nota fiscal permanece aberta. Tente novamente.", ex);
            }
        }
    }
}
