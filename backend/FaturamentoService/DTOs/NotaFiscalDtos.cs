using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FaturamentoService.Models;

namespace FaturamentoService.DTOs
{
    public class ItemNotaFiscalDto
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public string CodigoProduto { get; set; } = string.Empty;
        public string DescricaoProduto { get; set; } = string.Empty;
        public int Quantidade { get; set; }
    }

    public class NotaFiscalDto
    {
        public int Id { get; set; }
        public int Numero { get; set; }
        public NotaStatus Status { get; set; }
        public string StatusDescricao => Status == NotaStatus.Aberta ? "Aberta" : "Fechada";
        public DateTime DataCriacao { get; set; }
        public DateTime? DataFechamento { get; set; }
        public string? Observacao { get; set; }
        public int TotalItens { get; set; }
        public int QuantidadeTotalProdutos { get; set; }
        public List<ItemNotaFiscalDto> Itens { get; set; } = new();
    }

    public class CriarItemNotaFiscalDto
    {
        [Required(ErrorMessage = "O ID do produto é obrigatório.")]
        public int ProdutoId { get; set; }

        [Required(ErrorMessage = "O código do produto é obrigatório.")]
        public string CodigoProduto { get; set; } = string.Empty;

        [Required(ErrorMessage = "A descrição do produto é obrigatória.")]
        public string DescricaoProduto { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "A quantidade do item deve ser no mínimo 1.")]
        public int Quantidade { get; set; }
    }

    public class CriarNotaFiscalDto
    {
        [MaxLength(500, ErrorMessage = "A observação não pode exceder 500 caracteres.")]
        public string? Observacao { get; set; }

        [Required(ErrorMessage = "A nota fiscal deve conter pelo menos um item.")]
        [MinLength(1, ErrorMessage = "A nota fiscal deve conter pelo menos um produto.")]
        public List<CriarItemNotaFiscalDto> Itens { get; set; } = new();
    }

    public class ImprimirNotaResultadoDto
    {
        public bool Sucesso { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public NotaFiscalDto? NotaFiscal { get; set; }
        public object? DetalheEstoque { get; set; }
    }

    // Modelos para comunicação com EstoqueService
    public class EstoqueBaixarItemRequest
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }

    public class EstoqueBaixarRequest
    {
        public List<EstoqueBaixarItemRequest> Itens { get; set; } = new();
        public int? NotaFiscalId { get; set; }
        public string? IdempotencyKey { get; set; }
        public string? Motivo { get; set; }
    }

    public class EstoqueBaixaItemResultado
    {
        public int ProdutoId { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int SaldoAnterior { get; set; }
        public int QuantidadeBaixada { get; set; }
        public int SaldoAtual { get; set; }
    }

    public class EstoqueBaixaResponse
    {
        public bool Sucesso { get; set; }
        public bool Idempotente { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public List<EstoqueBaixaItemResultado> ItensProcessados { get; set; } = new();
    }
}
