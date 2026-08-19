using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueService.Models
{
    [Table("movimentacoes_estoque", Schema = "estoque")]
    public class MovimentacaoEstoque
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("nota_fiscal_id")]
        public int NotaFiscalId { get; set; }

        [Column("idempotency_key")]
        [MaxLength(100)]
        public string? IdempotencyKey { get; set; }

        [Required]
        [Column("produto_id")]
        public int ProdutoId { get; set; }

        [Required]
        [Column("quantidade")]
        public int Quantidade { get; set; }

        [Column("motivo")]
        [MaxLength(200)]
        public string? Motivo { get; set; }

        [Required]
        [Column("criado_em")]
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    }
}
