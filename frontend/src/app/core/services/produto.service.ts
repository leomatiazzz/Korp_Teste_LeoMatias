import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AtualizarProduto, CriarProduto, Produto, ProdutoSaldo } from '../models/produto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.estoqueApiUrl}/produtos`;

  obterTodos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  obterPorId(id: number): Observable<Produto> {
    return this.http.get<Produto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  obterPorCodigo(codigo: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.apiUrl}/codigo/${codigo}`).pipe(
      catchError(this.handleError)
    );
  }

  obterSaldo(id: number): Observable<ProdutoSaldo> {
    return this.http.get<ProdutoSaldo>(`${this.apiUrl}/${id}/saldo`).pipe(
      catchError(this.handleError)
    );
  }

  criar(produto: CriarProduto): Observable<Produto> {
    return this.http.post<Produto>(this.apiUrl, produto).pipe(
      catchError(this.handleError)
    );
  }

  atualizar(id: number, produto: AtualizarProduto): Observable<Produto> {
    return this.http.put<Produto>(`${this.apiUrl}/${id}`, produto).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao comunicar com o serviço de Estoque.';

    if (error.status === 0) {
      errorMessage = 'Não foi possível conectar ao microsserviço de Estoque (Porta 5001). Verifique se o serviço está em execução.';
    } else if (error.error?.mensagem) {
      errorMessage = error.error.mensagem;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    return throwError(() => new Error(errorMessage));
  }
}
