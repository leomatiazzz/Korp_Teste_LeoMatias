using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FaturamentoService.Models
{
    [Table("notas_fiscais")]
    public class NotaFiscal
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [Column("numero")]
        public int Numero { get; set; }

        [Required]
        [Column("status")]
        public NotaStatus Status { get; set; } = NotaStatus.Aberta;

        [Column("data_criacao")]
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [Column("data_fechamento")]
        public DateTime? DataFechamento { get; set; }

        [MaxLength(500)]
        [Column("observacao")]
        public string? Observacao { get; set; }

        public ICollection<ItemNotaFiscal> Itens { get; set; } = new List<ItemNotaFiscal>();
    }
}
