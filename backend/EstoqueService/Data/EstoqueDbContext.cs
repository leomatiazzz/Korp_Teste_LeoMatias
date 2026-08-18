using EstoqueService.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueService.Data
{
    public class EstoqueDbContext : DbContext
    {
        public EstoqueDbContext(DbContextOptions<EstoqueDbContext> options) : base(options)
        {
        }

        public DbSet<Produto> Produtos => Set<Produto>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasDefaultSchema("estoque");

            modelBuilder.Entity<Produto>(entity =>
            {
                entity.ToTable("produtos");

                entity.HasKey(p => p.Id);

                entity.Property(p => p.Codigo)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasIndex(p => p.Codigo)
                    .IsUnique();

                entity.Property(p => p.Descricao)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(p => p.Saldo)
                    .IsRequired()
                    .HasDefaultValue(0);

                entity.Property(p => p.CriadoEm)
                    .HasDefaultValueSql("NOW()");
            });
        }
    }
}
