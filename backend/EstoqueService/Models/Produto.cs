using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EstoqueService.Models
{
    [Table("produtos")]
    public class Produto
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        [Column("codigo")]
        public string Codigo { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        [Column("descricao")]
        public string Descricao { get; set; } = string.Empty;

        [Required]
        [Column("saldo")]
        public int Saldo { get; set; }

        [Column("criado_em")]
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        [Column("atualizado_em")]
        public DateTime? AtualizadoEm { get; set; }
    }
}
