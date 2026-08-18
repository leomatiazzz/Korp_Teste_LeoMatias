using FaturamentoService.Models;
using Microsoft.EntityFrameworkCore;

namespace FaturamentoService.Data
{
    public class FaturamentoDbContext : DbContext
    {
        public FaturamentoDbContext(DbContextOptions<FaturamentoDbContext> options) : base(options)
        {
        }

        public DbSet<NotaFiscal> NotasFiscais => Set<NotaFiscal>();
        public DbSet<ItemNotaFiscal> ItensNotaFiscal => Set<ItemNotaFiscal>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("faturamento");

            modelBuilder.Entity<NotaFiscal>(entity =>
            {
                entity.ToTable("notas_fiscais");

                entity.HasKey(n => n.Id);

                entity.Property(n => n.Numero)
                    .IsRequired();

                entity.HasIndex(n => n.Numero)
                    .IsUnique();

                entity.Property(n => n.Status)
                    .IsRequired()
                    .HasConversion<int>();

                entity.Property(n => n.DataCriacao)
                    .HasDefaultValueSql("NOW()");

                entity.Property(n => n.Observacao)
                    .HasMaxLength(500);

                entity.HasMany(n => n.Itens)
                    .WithOne(i => i.NotaFiscal)
                    .HasForeignKey(i => i.NotaFiscalId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ItemNotaFiscal>(entity =>
            {
                entity.ToTable("itens_nota_fiscal");

                entity.HasKey(i => i.Id);

                entity.Property(i => i.CodigoProduto)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(i => i.DescricaoProduto)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(i => i.Quantidade)
                    .IsRequired();
            });
        }
    }
}
