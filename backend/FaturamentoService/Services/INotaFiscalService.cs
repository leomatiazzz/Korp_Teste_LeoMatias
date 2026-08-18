using System.Collections.Generic;
using System.Threading.Tasks;
using FaturamentoService.DTOs;

namespace FaturamentoService.Services
{
    public interface INotaFiscalService
    {
        Task<IEnumerable<NotaFiscalDto>> ObterTodasAsync();
        Task<NotaFiscalDto?> ObterPorIdAsync(int id);
        Task<int> ObterProximoNumeroAsync();
        Task<NotaFiscalDto> CriarAsync(CriarNotaFiscalDto dto);
        Task<ImprimirNotaResultadoDto> ImprimirAsync(int id);
    }
}
