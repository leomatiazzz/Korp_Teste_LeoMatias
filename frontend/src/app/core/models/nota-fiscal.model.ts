export enum NotaStatus {
  Aberta = 1,
  Fechada = 2
}

export interface ItemNotaFiscal {
  id: number;
  produtoId: number;
  codigoProduto: string;
  descricaoProduto: string;
  quantidade: number;
}

export interface NotaFiscal {
  id: number;
  numero: number;
  status: NotaStatus;
  statusDescricao: string;
  dataCriacao: string;
  dataFechamento?: string | null;
  observacao?: string | null;
  totalItens: number;
  quantidadeTotalProdutos: number;
  itens: ItemNotaFiscal[];
}

export interface CriarItemNotaFiscal {
  produtoId: number;
  codigoProduto: string;
  descricaoProduto: string;
  quantidade: number;
}

export interface CriarNotaFiscal {
  observacao?: string | null;
  itens: CriarItemNotaFiscal[];
}

export interface ImprimirNotaResultado {
  sucesso: boolean;
  mensagem: string;
  notaFiscal?: NotaFiscal;
  detalheEstoque?: any;
}
