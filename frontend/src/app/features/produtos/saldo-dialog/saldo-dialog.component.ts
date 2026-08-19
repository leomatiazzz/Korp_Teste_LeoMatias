import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProdutoService } from '../../../core/services/produto.service';
import { ProdutoSaldo } from '../../../core/models/produto.model';

@Component({
  selector: 'app-saldo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="saldo-dialog-header">
      <div class="title-wrap">
        <mat-icon class="icon-saldo">query_stats</mat-icon>
        <h2 mat-dialog-title>Consulta de saldo</h2>
      </div>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="saldo-content">
      <div *ngIf="carregando" class="loading-wrap">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Consultando saldo em tempo real no EstoqueService...</span>
      </div>

      <div *ngIf="!carregando && saldoInfo" class="saldo-details">
        <div class="product-info-card">
          <div class="info-row">
            <span class="label">Código:</span>
            <span class="value code">{{ saldoInfo.codigo }}</span>
          </div>
          <div class="info-row">
            <span class="label">Descrição:</span>
            <span class="value">{{ saldoInfo.descricao }}</span>
          </div>
        </div>

        <div class="saldo-highlight-box" [ngClass]="getSaldoClass(saldoInfo.saldo)">
          <div class="saldo-number">{{ saldoInfo.saldo }}</div>
          <div class="saldo-label">Unidades disponíveis</div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .saldo-dialog-header {
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
      color: var(--primary-dark, #1b3240);
      font-weight: 700;
    }

    .icon-saldo {
      color: var(--primary-color, #2b485a);
    }

    .saldo-content {
      padding: 16px 24px !important;
      min-width: 360px;
    }

    .loading-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: var(--text-muted, #688294);
    }

    .product-info-card {
      background: #f8fafc;
      border: 1px solid var(--border-color, #dce4eb);
      border-radius: var(--radius-md, 8px);
      padding: 14px;
      margin-bottom: 16px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.9rem;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      color: var(--text-muted, #688294);
      font-weight: 500;
    }

    .value {
      color: var(--text-main, #2b485a);
      font-weight: 600;
    }

    .value.code {
      font-family: 'Roboto Mono', monospace;
      background: #edf3f7;
      color: var(--primary-color, #2b485a);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #dce4eb;
    }

    .saldo-highlight-box {
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 2px solid transparent;
    }

    .saldo-highlight-box.high {
      background: #dcfce7;
      border-color: #86efac;
      color: #15803d;
    }

    .saldo-highlight-box.medium {
      background: #fef9c3;
      border-color: #fde047;
      color: #a16207;
    }

    .saldo-highlight-box.low {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #b91c1c;
    }

    .saldo-number {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }

    .saldo-label {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class SaldoDialogComponent implements OnInit {
  private produtoService = inject(ProdutoService);
  dialogRef = inject(MatDialogRef<SaldoDialogComponent>);

  carregando = true;
  saldoInfo?: ProdutoSaldo;

  constructor(@Inject(MAT_DIALOG_DATA) public produtoId: number) {}

  ngOnInit(): void {
    this.produtoService.obterSaldo(this.produtoId).subscribe({
      next: (res) => {
        this.saldoInfo = res;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  getSaldoClass(saldo: number): string {
    if (saldo >= 10) return 'high';
    if (saldo > 0) return 'medium';
    return 'low';
  }
}
