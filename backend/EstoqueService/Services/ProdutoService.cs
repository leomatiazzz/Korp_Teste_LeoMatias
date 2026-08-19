using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EstoqueService.Data;
using EstoqueService.DTOs;
using EstoqueService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EstoqueService.Services
{
    public class ProdutoService : IProdutoService
    {
        private readonly EstoqueDbContext _context;
        private readonly ILogger<ProdutoService> _logger;

        public ProdutoService(EstoqueDbContext context, ILogger<ProdutoService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<ProdutoDto>> ObterTodosAsync()
        {
            return await _context.Produtos
                .AsNoTracking()
                .OrderBy(p => p.Descricao)
                .Select(p => new ProdutoDto
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    Descricao = p.Descricao,
                    Saldo = p.Saldo,
                    CriadoEm = p.CriadoEm,
                    AtualizadoEm = p.AtualizadoEm
                })
                .ToListAsync();
        }

        public async Task<ProdutoDto?> ObterPorIdAsync(int id)
        {
            return await _context.Produtos
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new ProdutoDto
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    Descricao = p.Descricao,
                    Saldo = p.Saldo,
                    CriadoEm = p.CriadoEm,
                    AtualizadoEm = p.AtualizadoEm
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ProdutoDto?> ObterPorCodigoAsync(string codigo)
        {
            return await _context.Produtos
                .AsNoTracking()
                .Where(p => p.Codigo == codigo)
                .Select(p => new ProdutoDto
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    Descricao = p.Descricao,
                    Saldo = p.Saldo,
                    CriadoEm = p.CriadoEm,
                    AtualizadoEm = p.AtualizadoEm
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ProdutoSaldoDto?> ObterSaldoAsync(int id)
        {
            return await _context.Produtos
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new ProdutoSaldoDto
                {
                    Id = p.Id,
                    Codigo = p.Codigo,
                    Descricao = p.Descricao,
                    Saldo = p.Saldo
                })
                .FirstOrDefaultAsync();
        }

        public async Task<ProdutoDto> CriarAsync(CriarProdutoDto dto)
        {
            var codigoFormatado = dto.Codigo.Trim().ToUpperInvariant();

            var existeCodigo = await _context.Produtos
                .AnyAsync(p => p.Codigo == codigoFormatado);

            if (existeCodigo)
            {
                throw new InvalidOperationException($"Já existe um produto cadastrado com o código '{codigoFormatado}'.");
            }

            var produto = new Produto
            {
                Codigo = codigoFormatado,
                Descricao = dto.Descricao.Trim(),
                Saldo = dto.Saldo,
                CriadoEm = DateTime.UtcNow
            };

            _context.Produtos.Add(produto);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Produto {Codigo} criado com sucesso com ID {Id} e saldo inicial {Saldo}.", produto.Codigo, produto.Id, produto.Saldo);

            return new ProdutoDto
            {
                Id = produto.Id,
                Codigo = produto.Codigo,
                Descricao = produto.Descricao,
                Saldo = produto.Saldo,
                CriadoEm = produto.CriadoEm,
                AtualizadoEm = produto.AtualizadoEm
            };
        }

        public async Task<ProdutoDto?> AtualizarAsync(int id, AtualizarProdutoDto dto)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null)
            {
                return null;
            }

            var codigoFormatado = dto.Codigo.Trim().ToUpperInvariant();

            var existeOutroCodigo = await _context.Produtos
                .AnyAsync(p => p.Codigo == codigoFormatado && p.Id != id);

            if (existeOutroCodigo)
            {
                throw new InvalidOperationException($"Já existe outro produto cadastrado com o código '{codigoFormatado}'.");
            }

            produto.Codigo = codigoFormatado;
            produto.Descricao = dto.Descricao.Trim();
            produto.Saldo = dto.Saldo;
            produto.AtualizadoEm = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Produto {Id} ({Codigo}) atualizado com sucesso.", produto.Id, produto.Codigo);

            return new ProdutoDto
            {
                Id = produto.Id,
                Codigo = produto.Codigo,
                Descricao = produto.Descricao,
                Saldo = produto.Saldo,
                CriadoEm = produto.CriadoEm,
                AtualizadoEm = produto.AtualizadoEm
            };
        }

        public async Task<BaixaEstoqueResultadoDto> BaixarEstoqueAsync(BaixarEstoqueRequestDto request)
        {
            if (request.Itens == null || !request.Itens.Any())
            {
                throw new ArgumentException("A requisição não contém itens para baixa de estoque.");
            }

            // Ordenação determinística dos IDs para prevenir deadlocks em requisições simultâneas
            var idsSolicitados = request.Itens
                .Select(i => i.ProdutoId)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // =========================================================================
                // 1. Verificação de Idempotência
                // Se esta mesma Nota Fiscal já teve sua baixa processada, retorna sucesso sem duplicar
                // =========================================================================
                if (request.NotaFiscalId.HasValue && request.NotaFiscalId.Value > 0)
                {
                    var movimentacoesExistentes = await _context.MovimentacoesEstoque
                        .Where(m => m.NotaFiscalId == request.NotaFiscalId.Value)
                        .ToListAsync();

                    if (movimentacoesExistentes.Any())
                    {
                        _logger.LogInformation("Operação idempotente detectada: Baixa de estoque já processada para a Nota Fiscal Nº {NotaFiscalId}.", request.NotaFiscalId.Value);

                        var produtosExistentes = await _context.Produtos
                            .Where(p => idsSolicitados.Contains(p.Id))
                            .ToListAsync();

                        var itensIdempotentes = movimentacoesExistentes.Select(m =>
                        {
                            var prod = produtosExistentes.FirstOrDefault(p => p.Id == m.ProdutoId);
                            return new BaixaEstoqueItemResultadoDto
                            {
                                ProdutoId = m.ProdutoId,
                                Codigo = prod?.Codigo ?? string.Empty,
                                Descricao = prod?.Descricao ?? string.Empty,
                                SaldoAnterior = prod?.Saldo ?? 0,
                                QuantidadeBaixada = m.Quantidade,
                                SaldoAtual = prod?.Saldo ?? 0
                            };
                        }).ToList();

                        await transaction.CommitAsync();

                        return new BaixaEstoqueResultadoDto
                        {
                            Sucesso = true,
                            Idempotente = true,
                            Mensagem = $"Operação idempotente: A baixa de estoque para a Nota Fiscal Nº {request.NotaFiscalId.Value} já havia sido executada com sucesso.",
                            ItensProcessados = itensIdempotentes
                        };
                    }
                }

                // =========================================================================
                // 2. Bloqueio Concorrente Pessimista (SELECT ... FOR UPDATE) no PostgreSQL
                // Garante que requisições concorrentes disputando os mesmos produtos sejam
                // serializadas com lock exclusivo de linha no PostgreSQL, impedindo Race Conditions.
                // =========================================================================
                var produtos = await _context.Produtos
                    .FromSqlRaw(@"
                        SELECT p.id, p.codigo, p.descricao, p.saldo, p.criado_em, p.atualizado_em
                        FROM estoque.produtos p
                        WHERE p.id = ANY({0})
                        ORDER BY p.id
                        FOR UPDATE", idsSolicitados.ToArray())
                    .ToListAsync();

                // Valida se todos os produtos foram localizados
                foreach (var item in request.Itens)
                {
                    var produto = produtos.FirstOrDefault(p => p.Id == item.ProdutoId);
                    if (produto == null)
                    {
                        await transaction.RollbackAsync();
                        throw new InvalidOperationException($"Produto com ID {item.ProdutoId} não foi encontrado no estoque.");
                    }

                    // Valida se a quantidade disponível é suficiente
                    if (produto.Saldo < item.Quantidade)
                    {
                        await transaction.RollbackAsync();
                        throw new InvalidOperationException($"Saldo insuficiente para o produto '{produto.Descricao}' (Código: {produto.Codigo}). Saldo atual: {produto.Saldo}, Quantidade solicitada: {item.Quantidade}.");
                    }
                }

                // 3. Efetua a dedução de saldo de forma atômica e registra movimentações
                var resultadoItens = new List<BaixaEstoqueItemResultadoDto>();

                foreach (var item in request.Itens)
                {
                    var produto = produtos.First(p => p.Id == item.ProdutoId);
                    var saldoAnterior = produto.Saldo;

                    produto.Saldo -= item.Quantidade;
                    produto.AtualizadoEm = DateTime.UtcNow;

                    // Registro da movimentação para histórico e garantia de idempotência futura
                    if (request.NotaFiscalId.HasValue && request.NotaFiscalId.Value > 0)
                    {
                        _context.MovimentacoesEstoque.Add(new MovimentacaoEstoque
                        {
                            NotaFiscalId = request.NotaFiscalId.Value,
                            IdempotencyKey = request.IdempotencyKey,
                            ProdutoId = item.ProdutoId,
                            Quantidade = item.Quantidade,
                            Motivo = request.Motivo ?? $"Baixa para emissão da Nota Fiscal Nº {request.NotaFiscalId.Value}",
                            CriadoEm = DateTime.UtcNow
                        });
                    }

                    resultadoItens.Add(new BaixaEstoqueItemResultadoDto
                    {
                        ProdutoId = produto.Id,
                        Codigo = produto.Codigo,
                        Descricao = produto.Descricao,
                        SaldoAnterior = saldoAnterior,
                        QuantidadeBaixada = item.Quantidade,
                        SaldoAtual = produto.Saldo
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Baixa de estoque efetuada com sucesso para {Count} produto(s). Nota Fiscal Nº {NotaFiscalId}", request.Itens.Count, request.NotaFiscalId);

                return new BaixaEstoqueResultadoDto
                {
                    Sucesso = true,
                    Idempotente = false,
                    Mensagem = "Baixa de estoque realizada com sucesso.",
                    ItensProcessados = resultadoItens
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Erro ao realizar baixa de estoque.");
                throw;
            }
        }
    }
}
