using System.Collections.Generic;
using System.Threading.Tasks;
using FaturamentoService.DTOs;
using FaturamentoService.Models;

namespace FaturamentoService.Services
{
    public interface IEstoqueServiceClient
    {
        Task<EstoqueBaixaResponse> BaixarEstoqueAsync(IEnumerable<ItemNotaFiscal> itens, int numeroNota);
    }
}
