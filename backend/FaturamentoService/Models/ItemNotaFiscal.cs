using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FaturamentoService.Models
{
    [Table("itens_nota_fiscal")]
    public class ItemNotaFiscal
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("nota_fiscal_id")]
        public int NotaFiscalId { get; set; }

        [ForeignKey(nameof(NotaFiscalId))]
        public NotaFiscal? NotaFiscal { get; set; }

        [Required]
        [Column("produto_id")]
        public int ProdutoId { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("codigo_produto")]
        public string CodigoProduto { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("descricao_produto")]
        public string DescricaoProduto { get; set; } = string.Empty;

        [Required]
        [Column("quantidade")]
        public int Quantidade { get; set; }
    }
}
