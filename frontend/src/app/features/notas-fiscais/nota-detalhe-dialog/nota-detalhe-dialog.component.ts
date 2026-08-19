import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotaFiscal, NotaStatus } from '../../../core/models/nota-fiscal.model';
import { NotaFiscalService } from '../../../core/services/nota-fiscal.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-nota-detalhe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-header">
      <div class="title-wrap">
        <mat-icon color="primary">receipt</mat-icon>
        <h2 mat-dialog-title>Detalhes da nota fiscal #{{ formatNumero(nota.numero) }}</h2>
      </div>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <!-- Cabeçalho Informativo -->
      <div class="info-grid">
        <div class="info-card">
          <span class="info-label">Status atual</span>
          <span class="status-badge" [ngClass]="nota.status === NotaStatus.Aberta ? 'aberta' : 'fechada'">
            <mat-icon class="badge-icon">{{ nota.status === NotaStatus.Aberta ? 'schedule' : 'verified' }}</mat-icon>
            {{ nota.status === NotaStatus.Aberta ? 'Aberta' : 'Fechada' }}
          </span>
        </div>

        <div class="info-card">
          <span class="info-label">Data de criação</span>
          <span class="info-val">{{ nota.dataCriacao | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>

        <div class="info-card" *ngIf="nota.dataFechamento">
          <span class="info-label">Data de fechamento ou emissão</span>
          <span class="info-val">{{ nota.dataFechamento | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>

        <div class="info-card" *ngIf="nota.observacao">
          <span class="info-label">Observações</span>
          <span class="info-val">{{ nota.observacao }}</span>
        </div>
      </div>

      <!-- Tabela de Itens da Nota -->
      <div class="items-section">
        <h3 class="section-title">
          <mat-icon>list_alt</mat-icon>
          Itens da nota fiscal ({{ nota.itens.length }} produtos)
        </h3>

        <table mat-table [dataSource]="nota.itens" class="items-table">
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let item">
              <span class="code-badge">{{ item.codigoProduto }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição do produto</th>
            <td mat-cell *matCellDef="let item">
              <strong>{{ item.descricaoProduto }}</strong>
            </td>
          </ng-container>

          <ng-container matColumnDef="quantidade">
            <th mat-header-cell *matHeaderCellDef class="text-right">Quantidade</th>
            <td mat-cell *matCellDef="let item" class="text-right">
              <span class="qty-badge">{{ item.quantidade }} un.</span>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunasItens"></tr>
          <tr mat-row *matRowDef="let row; columns: colunasItens;"></tr>
        </table>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Fechar</button>

      <!-- Botão de Impressão / Fechamento da Nota -->
      <button
        *ngIf="nota.status === NotaStatus.Aberta"
        mat-raised-button
        color="accent"
        class="btn-print"
        [disabled]="processandoImpressao"
        (click)="imprimirNota()"
      >
        <mat-spinner *ngIf="processandoImpressao" diameter="20" class="btn-spinner"></mat-spinner>
        <mat-icon *ngIf="!processandoImpressao">print</mat-icon>
        <span>{{ processandoImpressao ? 'Processando baixa de estoque...' : 'Imprimir e fechar nota' }}</span>
      </button>

      <span *ngIf="nota.status === NotaStatus.Fechada" class="closed-notice">
        <mat-icon color="primary">task_alt</mat-icon>
        Nota fiscal já finalizada no estoque
      </span>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 8px;
    }

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .title-wrap h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-dark, #1b3240);
    }

    .dialog-content {
      padding: 16px 24px !important;
      min-width: 540px;
      max-width: 720px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      background: #f8fafc;
      padding: 16px;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-color, #dce4eb);
      margin-bottom: 20px;
    }

    .info-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted, #688294);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-val {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main, #2b485a);
    }

    .badge-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-main, #2b485a);
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .items-table {
      width: 100%;
      background: #ffffff;
      border: 1px solid var(--border-color, #dce4eb);
      border-radius: 6px;
    }

    .code-badge {
      font-family: 'Roboto Mono', monospace;
      font-weight: 600;
      background: #edf3f7;
      color: var(--primary-color, #2b485a);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #dce4eb;
    }

    .qty-badge {
      font-family: 'Roboto Mono', monospace;
      font-weight: 700;
      color: var(--primary-color, #2b485a);
    }

    .text-right {
      text-align: right !important;
    }

    .dialog-actions {
      padding: 16px 24px !important;
      gap: 10px;
    }

    .btn-print {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      padding: 0 20px !important;
      background-color: var(--accent-color, #ff0c46) !important;
      color: #ffffff !important;
      border-radius: 6px !important;
      box-shadow: 0 2px 6px rgb(255 12 70 / 0.25) !important;
      transition: background-color 0.2s ease;
    }

    .btn-print:hover:not([disabled]) {
      background-color: var(--accent-hover, #e00038) !important;
    }

    .btn-spinner {
      margin-right: 8px;
    }

    .closed-notice {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      color: var(--success-color, #059669);
      font-weight: 600;
    }
  `]
})
export class NotaDetalheDialogComponent {
  private notaFiscalService = inject(NotaFiscalService);
  private notification = inject(NotificationService);
  dialogRef = inject(MatDialogRef<NotaDetalheDialogComponent>);

  NotaStatus = NotaStatus;
  colunasItens: string[] = ['codigo', 'descricao', 'quantidade'];
  processandoImpressao = false;

  constructor(@Inject(MAT_DIALOG_DATA) public nota: NotaFiscal) {}

  formatNumero(numero: number): string {
    return numero.toString().padStart(4, '0');
  }

  imprimirNota(): void {
    this.processandoImpressao = true;

    this.notaFiscalService.imprimir(this.nota.id).subscribe({
      next: (resultado) => {
        this.processandoImpressao = false;
        this.notification.success(resultado.mensagem);
        if (resultado.notaFiscal) {
          this.nota = resultado.notaFiscal;
        }
        this.dialogRef.close(true);
      },
      error: (erro) => {
        this.processandoImpressao = false;
        this.notification.error(erro.message || 'Erro ao processar impressão da nota fiscal.');
      }
    });
  }
}
