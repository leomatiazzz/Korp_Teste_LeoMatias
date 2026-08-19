using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FaturamentoService.Data;
using FaturamentoService.DTOs;
using FaturamentoService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FaturamentoService.Services
{
    public class NotaFiscalService : INotaFiscalService
    {
        private readonly FaturamentoDbContext _context;
        private readonly IEstoqueServiceClient _estoqueClient;
        private readonly ILogger<NotaFiscalService> _logger;

        public NotaFiscalService(
            FaturamentoDbContext context,
            IEstoqueServiceClient estoqueClient,
            ILogger<NotaFiscalService> logger)
        {
            _context = context;
            _estoqueClient = estoqueClient;
            _logger = logger;
        }

        public async Task<IEnumerable<NotaFiscalDto>> ObterTodasAsync()
        {
            return await _context.NotasFiscais
                .AsNoTracking()
                .Include(n => n.Itens)
                .OrderByDescending(n => n.Numero)
                .Select(n => new NotaFiscalDto
                {
                    Id = n.Id,
                    Numero = n.Numero,
                    Status = n.Status,
                    DataCriacao = n.DataCriacao,
                    DataFechamento = n.DataFechamento,
                    Observacao = n.Observacao,
                    TotalItens = n.Itens.Count,
                    QuantidadeTotalProdutos = n.Itens.Sum(i => i.Quantidade),
                    Itens = n.Itens.Select(i => new ItemNotaFiscalDto
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        CodigoProduto = i.CodigoProduto,
                        DescricaoProduto = i.DescricaoProduto,
                        Quantidade = i.Quantidade
                    }).ToList()
                })
                .ToListAsync();
        }

        public async Task<NotaFiscalDto?> ObterPorIdAsync(int id)
        {
            return await _context.NotasFiscais
                .AsNoTracking()
                .Include(n => n.Itens)
                .Where(n => n.Id == id)
                .Select(n => new NotaFiscalDto
                {
                    Id = n.Id,
                    Numero = n.Numero,
                    Status = n.Status,
                    DataCriacao = n.DataCriacao,
                    DataFechamento = n.DataFechamento,
                    Observacao = n.Observacao,
                    TotalItens = n.Itens.Count,
                    QuantidadeTotalProdutos = n.Itens.Sum(i => i.Quantidade),
                    Itens = n.Itens.Select(i => new ItemNotaFiscalDto
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        CodigoProduto = i.CodigoProduto,
                        DescricaoProduto = i.DescricaoProduto,
                        Quantidade = i.Quantidade
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<int> ObterProximoNumeroAsync()
        {
            var maxNumero = await _context.NotasFiscais
                .MaxAsync(n => (int?)n.Numero) ?? 0;

            return maxNumero + 1;
        }

        public async Task<NotaFiscalDto> CriarAsync(CriarNotaFiscalDto dto)
        {
            if (dto.Itens == null || !dto.Itens.Any())
            {
                throw new InvalidOperationException("A nota fiscal deve conter pelo menos um item.");
            }

            var proximoNumero = await ObterProximoNumeroAsync();

            var notaFiscal = new NotaFiscal
            {
                Numero = proximoNumero,
                Status = NotaStatus.Aberta,
                DataCriacao = DateTime.UtcNow,
                Observacao = dto.Observacao?.Trim(),
                Itens = dto.Itens.Select(i => new ItemNotaFiscal
                {
                    ProdutoId = i.ProdutoId,
                    CodigoProduto = i.CodigoProduto.Trim().ToUpperInvariant(),
                    DescricaoProduto = i.DescricaoProduto.Trim(),
                    Quantidade = i.Quantidade
                }).ToList()
            };

            _context.NotasFiscais.Add(notaFiscal);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Nota Fiscal Nº {Numero} criada com sucesso no status Aberta contendo {Count} item(ns).", notaFiscal.Numero, notaFiscal.Itens.Count);

            return new NotaFiscalDto
            {
                Id = notaFiscal.Id,
                Numero = notaFiscal.Numero,
                Status = notaFiscal.Status,
                DataCriacao = notaFiscal.DataCriacao,
                DataFechamento = notaFiscal.DataFechamento,
                Observacao = notaFiscal.Observacao,
                TotalItens = notaFiscal.Itens.Count,
                QuantidadeTotalProdutos = notaFiscal.Itens.Sum(i => i.Quantidade),
                Itens = notaFiscal.Itens.Select(i => new ItemNotaFiscalDto
                {
                    Id = i.Id,
                    ProdutoId = i.ProdutoId,
                    CodigoProduto = i.CodigoProduto,
                    DescricaoProduto = i.DescricaoProduto,
                    Quantidade = i.Quantidade
                }).ToList()
            };
        }

        public async Task<ImprimirNotaResultadoDto> ImprimirAsync(int id)
        {
            var nota = await _context.NotasFiscais
                .Include(n => n.Itens)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (nota == null)
            {
                throw new KeyNotFoundException($"Nota Fiscal com ID {id} não encontrada.");
            }

            // 1. Verificação de Idempotência no Faturamento
            // Se a nota já estiver Fechada, retorna o estado final imediatamente sem reexecutar baixa de estoque
            if (nota.Status == NotaStatus.Fechada)
            {
                _logger.LogInformation("Operação idempotente: Nota Fiscal Nº {Numero} já se encontra FECHADA.", nota.Numero);

                var notaFechadaDto = new NotaFiscalDto
                {
                    Id = nota.Id,
                    Numero = nota.Numero,
                    Status = nota.Status,
                    DataCriacao = nota.DataCriacao,
                    DataFechamento = nota.DataFechamento,
                    Observacao = nota.Observacao,
                    TotalItens = nota.Itens.Count,
                    QuantidadeTotalProdutos = nota.Itens.Sum(i => i.Quantidade),
                    Itens = nota.Itens.Select(i => new ItemNotaFiscalDto
                    {
                        Id = i.Id,
                        ProdutoId = i.ProdutoId,
                        CodigoProduto = i.CodigoProduto,
                        DescricaoProduto = i.DescricaoProduto,
                        Quantidade = i.Quantidade
                    }).ToList()
                };

                return new ImprimirNotaResultadoDto
                {
                    Sucesso = true,
                    Mensagem = $"Operação idempotente: A Nota Fiscal Nº {nota.Numero} já havia sido impressa e finalizada.",
                    NotaFiscal = notaFechadaDto,
                    DetalheEstoque = new { Idempotente = true, Mensagem = "Nota fiscal já encerrada anteriormente." }
                };
            }

            if (!nota.Itens.Any())
            {
                throw new InvalidOperationException($"A Nota Fiscal Nº {nota.Numero} não possui itens cadastrados.");
            }

            // 2. Comunicar com o EstoqueService para validar saldos e deduzir estoque
            var resultadoEstoque = await _estoqueClient.BaixarEstoqueAsync(nota.Itens, nota.Numero);

            // 3. Atualizar o status da nota para Fechada e registrar data de fechamento
            nota.Status = NotaStatus.Fechada;
            nota.DataFechamento = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Nota Fiscal Nº {Numero} impressa e FECHADA com sucesso.", nota.Numero);

            var notaDto = new NotaFiscalDto
            {
                Id = nota.Id,
                Numero = nota.Numero,
                Status = nota.Status,
                DataCriacao = nota.DataCriacao,
                DataFechamento = nota.DataFechamento,
                Observacao = nota.Observacao,
                TotalItens = nota.Itens.Count,
                QuantidadeTotalProdutos = nota.Itens.Sum(i => i.Quantidade),
                Itens = nota.Itens.Select(i => new ItemNotaFiscalDto
                {
                    Id = i.Id,
                    ProdutoId = i.ProdutoId,
                    CodigoProduto = i.CodigoProduto,
                    DescricaoProduto = i.DescricaoProduto,
                    Quantidade = i.Quantidade
                }).ToList()
            };

            return new ImprimirNotaResultadoDto
            {
                Sucesso = true,
                Mensagem = $"Nota Fiscal Nº {nota.Numero} impressa e finalizada com sucesso. Estoque atualizado.",
                NotaFiscal = notaDto,
                DetalheEstoque = resultadoEstoque
            };
        }
    }
}
