import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { NotaFiscalService } from '../../core/services/nota-fiscal.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotaFiscal, NotaStatus } from '../../core/models/nota-fiscal.model';
import { NotaDetalheDialogComponent } from './nota-detalhe-dialog/nota-detalhe-dialog.component';

@Component({
  selector: 'app-notas-fiscais',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="page-container">
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <mat-icon color="primary">receipt_long</mat-icon>
            Gestão de notas fiscais
          </h1>
          <p class="page-subtitle">
            Emissão de notas fiscais, controle de status e integração com o Estoque Service.
          </p>
        </div>

        <div class="header-actions">
          <button mat-raised-button color="primary" class="btn-action" routerLink="/notas-fiscais/nova">
            <mat-icon>add</mat-icon>
            Nova nota fiscal
          </button>
        </div>
      </div>

      <!-- Cards de Métricas -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-wrap blue">
            <mat-icon>description</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ notas.length }}</span>
            <span class="metric-label">Total de notas fiscais</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-wrap yellow">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ notasAbertasCount }}</span>
            <span class="metric-label">Notas abertas (pendentes)</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-wrap green">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ notasFechadasCount }}</span>
            <span class="metric-label">Notas fechadas (finalizadas)</span>
          </div>
        </div>
      </div>

      <!-- Tabela Principal -->
      <div class="app-card">
        <div class="table-toolbar">
          <div class="filter-tabs">
            <button
              mat-stroked-button
              [class.active-tab]="filtroStatus === 'TODAS'"
              (click)="filtrarStatus('TODAS')"
            >
              Todas ({{ notas.length }})
            </button>
            <button
              mat-stroked-button
              [class.active-tab]="filtroStatus === 'ABERTA'"
              (click)="filtrarStatus('ABERTA')"
            >
              Abertas ({{ notasAbertasCount }})
            </button>
            <button
              mat-stroked-button
              [class.active-tab]="filtroStatus === 'FECHADA'"
              (click)="filtrarStatus('FECHADA')"
            >
              Fechadas ({{ notasFechadasCount }})
            </button>
          </div>

          <button mat-stroked-button (click)="carregarNotas()" [disabled]="carregando">
            <mat-icon [class.pulsing]="carregando">refresh</mat-icon>
            Atualizar
          </button>
        </div>

        <!-- Carregando -->
        <div *ngIf="carregando" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Carregando notas fiscais...</span>
        </div>

        <!-- Tabela -->
        <div class="table-responsive" *ngIf="!carregando">
          <table mat-table [dataSource]="notasFiltradas" class="mat-elevation-z0">
            <!-- Número Sequencial -->
            <ng-container matColumnDef="numero">
              <th mat-header-cell *matHeaderCellDef>Número</th>
              <td mat-cell *matCellDef="let n">
                <span class="number-badge">#{{ formatNumero(n.numero) }}</span>
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let n">
                <span class="status-badge" [ngClass]="n.status === NotaStatus.Aberta ? 'aberta' : 'fechada'">
                  <mat-icon class="badge-icon">{{ n.status === NotaStatus.Aberta ? 'schedule' : 'check_circle' }}</mat-icon>
                  {{ n.status === NotaStatus.Aberta ? 'Aberta' : 'Fechada' }}
                </span>
              </td>
            </ng-container>

            <!-- Data Criação -->
            <ng-container matColumnDef="dataCriacao">
              <th mat-header-cell *matHeaderCellDef>Criação</th>
              <td mat-cell *matCellDef="let n">
                {{ n.dataCriacao | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <!-- Data Fechamento -->
            <ng-container matColumnDef="dataFechamento">
              <th mat-header-cell *matHeaderCellDef>Fechamento ou emissão</th>
              <td mat-cell *matCellDef="let n">
                <span *ngIf="n.dataFechamento">{{ n.dataFechamento | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="!n.dataFechamento" class="text-muted">-</span>
              </td>
            </ng-container>

            <!-- Resumo dos Itens -->
            <ng-container matColumnDef="itens">
              <th mat-header-cell *matHeaderCellDef>Itens e quantidade</th>
              <td mat-cell *matCellDef="let n">
                <span class="items-summary" (click)="abrirDetalhes(n)" matTooltip="Clique para ver os itens">
                  <mat-icon class="inline-icon">inventory_2</mat-icon>
                  {{ n.totalItens }} item(ns) &bull; <strong>{{ n.quantidadeTotalProdutos }} un.</strong>
                </span>
              </td>
            </ng-container>

            <!-- Ações -->
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef class="text-right">Ações e impressão</th>
              <td mat-cell *matCellDef="let n" class="text-right">
                <div class="row-actions">
                  <!-- Botão de Ver Detalhes -->
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="abrirDetalhes(n)"
                    matTooltip="Ver detalhes e itens"
                  >
                    <mat-icon>visibility</mat-icon>
                  </button>

                  <!-- BOTÃO DE IMPRESSÃO CLARAMENTE VISÍVEL -->
                  <button
                    *ngIf="n.status === NotaStatus.Aberta"
                    mat-raised-button
                    color="accent"
                    class="btn-print-action"
                    [disabled]="processandoNotaId === n.id"
                    (click)="imprimirNota(n)"
                    matTooltip="Validar e baixar estoque no EstoqueService e fechar a nota"
                  >
                    <mat-spinner *ngIf="processandoNotaId === n.id" diameter="16" class="inline-spinner"></mat-spinner>
                    <mat-icon *ngIf="processandoNotaId !== n.id">print</mat-icon>
                    <span>{{ processandoNotaId === n.id ? 'Emitindo...' : 'Imprimir' }}</span>
                  </button>

                  <button
                    *ngIf="n.status === NotaStatus.Fechada"
                    mat-stroked-button
                    disabled
                    class="btn-closed"
                    matTooltip="Esta nota já foi impressa e fechada. Operação finalizada."
                  >
                    <mat-icon>check</mat-icon>
                    <span>Fechada</span>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="colunasExibidas"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasExibidas;"></tr>

            <tr class="mat-row empty-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="colunasExibidas.length">
                <div class="empty-state">
                  <mat-icon class="empty-icon">receipt_long</mat-icon>
                  <h3>Nenhuma nota fiscal encontrada</h3>
                  <p>Crie sua primeira nota fiscal com múltiplos produtos.</p>
                  <button mat-flat-button color="primary" routerLink="/notas-fiscais/nova">
                    <mat-icon>add</mat-icon> Criar nova nota fiscal
                  </button>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #dce4eb);
      border-radius: var(--radius-md, 8px);
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
    }

    .metric-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .metric-icon-wrap.blue { background: #edf3f7; color: var(--primary-color, #2b485a); }
    .metric-icon-wrap.yellow { background: var(--warning-bg, #fffbeb); color: var(--warning-color, #d97706); }
    .metric-icon-wrap.green { background: var(--success-bg, #ecfdf5); color: var(--success-color, #059669); }

    .metric-info {
      display: flex;
      flex-direction: column;
    }

    .metric-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-dark, #1a2d38);
      line-height: 1.2;
    }

    .metric-label {
      font-size: 0.813rem;
      color: var(--text-muted, #688294);
      font-weight: 500;
    }

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
    }

    .active-tab {
      background-color: var(--primary-color, #2b485a) !important;
      color: #ffffff !important;
      font-weight: 600;
      border-color: var(--primary-color, #2b485a) !important;
    }

    .number-badge {
      font-family: 'Roboto Mono', monospace;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary-color, #2b485a);
      background: #edf3f7;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #dce4eb;
    }

    .badge-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .items-summary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--text-main, #2b485a);
      font-size: 0.9rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .items-summary:hover {
      background: #edf3f7;
      color: var(--primary-dark, #1b3240);
    }

    .inline-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--text-muted, #688294);
    }

    .text-muted {
      color: var(--text-muted, #688294);
    }

    .text-right {
      text-align: right !important;
    }

    .row-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
    }

    .btn-print-action {
      background-color: var(--accent-color, #ff0c46) !important;
      color: #ffffff !important;
      font-weight: 600;
      height: 36px;
      padding: 0 16px !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 6px !important;
      box-shadow: 0 2px 6px rgb(255 12 70 / 0.25) !important;
      transition: background-color 0.2s ease, transform 0.1s ease;
    }

    .btn-print-action:hover:not([disabled]) {
      background-color: var(--accent-hover, #e00038) !important;
    }

    .btn-closed {
      height: 36px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--text-muted, #688294) !important;
      border-color: var(--border-color, #dce4eb) !important;
    }

    .inline-spinner {
      margin-right: 4px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 0;
      color: var(--text-muted);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #94a3b8;
    }

    .table-responsive {
      overflow-x: auto;
    }
  `]
})
export class NotasFiscaisComponent implements OnInit, OnDestroy {
  private notaFiscalService = inject(NotaFiscalService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();

  NotaStatus = NotaStatus;
  colunasExibidas: string[] = ['numero', 'status', 'dataCriacao', 'dataFechamento', 'itens', 'acoes'];

  notas: NotaFiscal[] = [];
  notasFiltradas: NotaFiscal[] = [];
  filtroStatus: 'TODAS' | 'ABERTA' | 'FECHADA' = 'TODAS';
  carregando = false;
  processandoNotaId?: number;

  get notasAbertasCount(): number {
    return this.notas.filter(n => n.status === NotaStatus.Aberta).length;
  }

  get notasFechadasCount(): number {
    return this.notas.filter(n => n.status === NotaStatus.Fechada).length;
  }

  ngOnInit(): void {
    this.carregarNotas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatNumero(num: number): string {
    return num.toString().padStart(4, '0');
  }

  carregarNotas(): void {
    this.carregando = true;
    this.notaFiscalService.obterTodas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.notas = dados;
          this.aplicarFiltro();
          this.carregando = false;
        },
        error: (erro) => {
          this.notification.error(erro.message || 'Erro ao carregar notas fiscais.');
          this.carregando = false;
        }
      });
  }

  filtrarStatus(status: 'TODAS' | 'ABERTA' | 'FECHADA'): void {
    this.filtroStatus = status;
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    if (this.filtroStatus === 'TODAS') {
      this.notasFiltradas = [...this.notas];
    } else if (this.filtroStatus === 'ABERTA') {
      this.notasFiltradas = this.notas.filter(n => n.status === NotaStatus.Aberta);
    } else {
      this.notasFiltradas = this.notas.filter(n => n.status === NotaStatus.Fechada);
    }
  }

  abrirDetalhes(nota: NotaFiscal): void {
    const dialogRef = this.dialog.open(NotaDetalheDialogComponent, {
      width: '640px',
      data: { ...nota }
    });

    dialogRef.afterClosed().subscribe((recarregar) => {
      if (recarregar) {
        this.carregarNotas();
      }
    });
  }

  imprimirNota(nota: NotaFiscal): void {
    if (nota.status === NotaStatus.Fechada) {
      this.notification.warning(`A Nota Fiscal #${this.formatNumero(nota.numero)} já está Fechada.`);
      return;
    }

    this.processandoNotaId = nota.id;

    this.notaFiscalService.imprimir(nota.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resultado) => {
          this.processandoNotaId = undefined;
          this.notification.success(resultado.mensagem || `Nota Fiscal #${this.formatNumero(nota.numero)} emitida e fechada com sucesso!`);
          this.carregarNotas();
        },
        error: (erro) => {
          this.processandoNotaId = undefined;
          this.notification.error(erro.message || 'Falha ao processar impressão da nota fiscal.');
          // A nota permanece aberta, nenhuma alteração indevida é feita
          this.carregarNotas();
        }
      });
  }
}
