using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FaturamentoService.DTOs;
using FaturamentoService.Exceptions;
using FaturamentoService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace FaturamentoService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/notas-fiscais")]
    [Produces("application/json")]
    public class NotasFiscaisController : ControllerBase
    {
        private readonly INotaFiscalService _notaFiscalService;

        public NotasFiscaisController(INotaFiscalService notaFiscalService)
        {
            _notaFiscalService = notaFiscalService;
        }

        /// <summary>
        /// Lista todas as notas fiscais cadastradas.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<NotaFiscalDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTodas()
        {
            var notas = await _notaFiscalService.ObterTodasAsync();
            return Ok(notas);
        }

        /// <summary>
        /// Obtém uma nota fiscal por seu ID com a lista detalhada de itens.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(NotaFiscalDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var nota = await _notaFiscalService.ObterPorIdAsync(id);
            if (nota == null)
            {
                return NotFound(new { mensagem = $"Nota Fiscal com ID {id} não encontrada." });
            }

            return Ok(nota);
        }

        /// <summary>
        /// Consulta o próximo número sequencial de nota fiscal.
        /// </summary>
        [HttpGet("proximo-numero")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterProximoNumero()
        {
            var proximoNumero = await _notaFiscalService.ObterProximoNumeroAsync();
            return Ok(new { proximoNumero });
        }

        /// <summary>
        /// Cria uma nova nota fiscal no status Aberta com numeração sequencial automática.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(NotaFiscalDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Criar([FromBody] CriarNotaFiscalDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var novaNota = await _notaFiscalService.CriarAsync(dto);
                return CreatedAtAction(nameof(ObterPorId), new { id = novaNota.Id }, novaNota);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { mensagem = "Erro ao criar nota fiscal.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Processa a impressão e fechamento da Nota Fiscal.
        /// Valida se a nota está aberta, solicita baixa no EstoqueService e altera o status para Fechada.
        /// Se o EstoqueService estiver indisponível, retorna 503 e mantém a nota Aberta.
        /// </summary>
        [HttpPost("{id:int}/imprimir")]
        [ProducesResponseType(typeof(ImprimirNotaResultadoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public async Task<IActionResult> Imprimir(int id)
        {
            try
            {
                var resultado = await _notaFiscalService.ImprimirAsync(id);
                return Ok(resultado);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Erros de negócio (ex: nota já fechada, saldo insuficiente)
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (EstoqueIndisponivelException ex)
            {
                // Falha de comunicação entre microsserviços
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    mensagem = ex.Message,
                    status = 503,
                    servicoIndisponivel = "EstoqueService"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    mensagem = "Erro interno ao processar impressão da nota fiscal.",
                    detalhe = ex.Message
                });
            }
        }
    }
}
