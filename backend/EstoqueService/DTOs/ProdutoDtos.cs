using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EstoqueService.DTOs
{
    public class ProdutoDto
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int Saldo { get; set; }
        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }
    }

    public class ProdutoSaldoDto
    {
        public int Id { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int Saldo { get; set; }
    }

    public class CriarProdutoDto
    {
        [Required(ErrorMessage = "O código do produto é obrigatório.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "O código deve ter entre 1 e 50 caracteres.")]
        public string Codigo { get; set; } = string.Empty;

        [Required(ErrorMessage = "A descrição do produto é obrigatória.")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "A descrição deve ter entre 2 e 200 caracteres.")]
        public string Descricao { get; set; } = string.Empty;

        [Range(0, int.MaxValue, ErrorMessage = "O saldo inicial deve ser maior ou igual a zero.")]
        public int Saldo { get; set; }
    }

    public class AtualizarProdutoDto
    {
        [Required(ErrorMessage = "O código do produto é obrigatório.")]
        [StringLength(50, MinimumLength = 1, ErrorMessage = "O código deve ter entre 1 e 50 caracteres.")]
        public string Codigo { get; set; } = string.Empty;

        [Required(ErrorMessage = "A descrição do produto é obrigatória.")]
        [StringLength(200, MinimumLength = 2, ErrorMessage = "A descrição deve ter entre 2 e 200 caracteres.")]
        public string Descricao { get; set; } = string.Empty;

        [Range(0, int.MaxValue, ErrorMessage = "O saldo deve ser maior ou igual a zero.")]
        public int Saldo { get; set; }
    }

    public class BaixarEstoqueItemDto
    {
        [Required]
        public int ProdutoId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "A quantidade a ser baixada deve ser no mínimo 1.")]
        public int Quantidade { get; set; }
    }

    public class BaixarEstoqueRequestDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "A lista de itens para baixa não pode estar vazia.")]
        public List<BaixarEstoqueItemDto> Itens { get; set; } = new();

        public int? NotaFiscalId { get; set; }

        public string? IdempotencyKey { get; set; }

        public string? Motivo { get; set; }
    }

    public class BaixaEstoqueItemResultadoDto
    {
        public int ProdutoId { get; set; }
        public string Codigo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int SaldoAnterior { get; set; }
        public int QuantidadeBaixada { get; set; }
        public int SaldoAtual { get; set; }
    }

    public class BaixaEstoqueResultadoDto
    {
        public bool Sucesso { get; set; }
        public bool Idempotente { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public List<BaixaEstoqueItemResultadoDto> ItensProcessados { get; set; } = new();
    }
}
