import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { CriarNotaFiscal, ImprimirNotaResultado, NotaFiscal } from '../models/nota-fiscal.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotaFiscalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.faturamentoApiUrl}/notas-fiscais`;

  obterTodas(): Observable<NotaFiscal[]> {
    return this.http.get<NotaFiscal[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  obterPorId(id: number): Observable<NotaFiscal> {
    return this.http.get<NotaFiscal>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  obterProximoNumero(): Observable<{ proximoNumero: number }> {
    return this.http.get<{ proximoNumero: number }>(`${this.apiUrl}/proximo-numero`).pipe(
      catchError(this.handleError)
    );
  }

  criar(nota: CriarNotaFiscal): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(this.apiUrl, nota).pipe(
      catchError(this.handleError)
    );
  }

  imprimir(id: number): Observable<ImprimirNotaResultado> {
    return this.http.post<ImprimirNotaResultado>(`${this.apiUrl}/${id}/imprimir`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocorreu um erro ao comunicar com o serviço de Faturamento.';

    if (error.status === 0) {
      errorMessage = 'Não foi possível conectar ao microsserviço de Faturamento (Porta 5002). Verifique se o serviço está em execução.';
    } else if (error.status === 503) {
      // Falha de comunicação entre microsserviços
      errorMessage = error.error?.mensagem || 'O serviço de Estoque está temporariamente indisponível. A nota fiscal permanece aberta.';
    } else if (error.error?.mensagem) {
      errorMessage = error.error.mensagem;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    return throwError(() => new Error(errorMessage));
  }
}
