using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EstoqueService.DTOs;
using EstoqueService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueService.Controllers
{
    [ApiController]
    [Route("api/produtos")]
    [Produces("application/json")]
    public class ProdutosController : ControllerBase
    {
        private readonly IProdutoService _produtoService;

        public ProdutosController(IProdutoService produtoService)
        {
            _produtoService = produtoService;
        }

        /// <summary>
        /// Lista todos os produtos cadastrados com seus saldos.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ProdutoDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTodos()
        {
            var produtos = await _produtoService.ObterTodosAsync();
            return Ok(produtos);
        }

        /// <summary>
        /// Obtém um produto pelo seu identificador (ID).
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var produto = await _produtoService.ObterPorIdAsync(id);
            if (produto == null)
            {
                return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });
            }

            return Ok(produto);
        }

        /// <summary>
        /// Obtém um produto pelo seu código.
        /// </summary>
        [HttpGet("codigo/{codigo}")]
        [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorCodigo(string codigo)
        {
            var produto = await _produtoService.ObterPorCodigoAsync(codigo.Trim().ToUpperInvariant());
            if (produto == null)
            {
                return NotFound(new { mensagem = $"Produto com código '{codigo}' não encontrado." });
            }

            return Ok(produto);
        }

        /// <summary>
        /// Consulta apenas o saldo disponível de um produto.
        /// </summary>
        [HttpGet("{id:int}/saldo")]
        [ProducesResponseType(typeof(ProdutoSaldoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterSaldo(int id)
        {
            var saldoDto = await _produtoService.ObterSaldoAsync(id);
            if (saldoDto == null)
            {
                return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });
            }

            return Ok(saldoDto);
        }

        /// <summary>
        /// Cadastra um novo produto no estoque.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Criar([FromBody] CriarProdutoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var novoProduto = await _produtoService.CriarAsync(dto);
                return CreatedAtAction(nameof(ObterPorId), new { id = novoProduto.Id }, novoProduto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { mensagem = "Erro interno ao cadastrar produto.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza os dados de um produto (descrição, código e saldo).
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] AtualizarProdutoDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var produtoAtualizado = await _produtoService.AtualizarAsync(id, dto);
                if (produtoAtualizado == null)
                {
                    return NotFound(new { mensagem = $"Produto com ID {id} não encontrado." });
                }

                return Ok(produtoAtualizado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { mensagem = "Erro interno ao atualizar produto.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Realiza a baixa de estoque em lote para os itens de uma nota fiscal.
        /// Valida se todos os produtos possuem saldo suficiente antes de efetivar a baixa.
        /// </summary>
        [HttpPost("baixar-estoque")]
        [ProducesResponseType(typeof(BaixaEstoqueResultadoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> BaixarEstoque([FromBody] BaixarEstoqueRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var resultado = await _produtoService.BaixarEstoqueAsync(request);
                return Ok(resultado);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { mensagem = "Erro ao processar baixa de estoque.", detalhe = ex.Message });
            }
        }
    }
}
