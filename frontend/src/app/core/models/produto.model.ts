export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  saldo: number;
  criadoEm: string;
  atualizadoEm?: string | null;
}

export interface ProdutoSaldo {
  id: number;
  codigo: string;
  descricao: string;
  saldo: number;
}

export interface CriarProduto {
  codigo: string;
  descricao: string;
  saldo: number;
}

export interface AtualizarProduto {
  codigo: string;
  descricao: string;
  saldo: number;
}
