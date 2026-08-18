using System.Collections.Generic;
using System.Threading.Tasks;
using EstoqueService.DTOs;

namespace EstoqueService.Services
{
    public interface IProdutoService
    {
        Task<IEnumerable<ProdutoDto>> ObterTodosAsync();
        Task<ProdutoDto?> ObterPorIdAsync(int id);
        Task<ProdutoDto?> ObterPorCodigoAsync(string codigo);
        Task<ProdutoSaldoDto?> ObterSaldoAsync(int id);
        Task<ProdutoDto> CriarAsync(CriarProdutoDto dto);
        Task<ProdutoDto?> AtualizarAsync(int id, AtualizarProdutoDto dto);
        Task<BaixaEstoqueResultadoDto> BaixarEstoqueAsync(BaixarEstoqueRequestDto request);
    }
}
