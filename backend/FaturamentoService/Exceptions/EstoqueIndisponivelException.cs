using System;

namespace FaturamentoService.Exceptions
{
    public class EstoqueIndisponivelException : Exception
    {
        public EstoqueIndisponivelException(string message) : base(message)
        {
        }

        public EstoqueIndisponivelException(string message, Exception innerException) : base(message, innerException)
        {
        }
    }
}
