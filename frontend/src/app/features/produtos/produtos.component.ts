import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ProdutoService } from '../../core/services/produto.service';
import { NotificationService } from '../../core/services/notification.service';
import { Produto } from '../../core/models/produto.model';
import { ProdutoDialogComponent } from './produto-dialog/produto-dialog.component';
import { SaldoDialogComponent } from './saldo-dialog/saldo-dialog.component';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="page-container">
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <h1 class="page-title">
            <mat-icon color="primary">inventory_2</mat-icon>
            Catálogo de produtos e estoque
          </h1>
          <p class="page-subtitle">
            Gerenciamento do cadastro de produtos e controle de saldo em estoque (Estoque Service).
          </p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" class="btn-action" (click)="abrirModalCriar()">
            <mat-icon>add</mat-icon>
            Novo produto
          </button>
        </div>
      </div>

      <!-- Cards de Resumo -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon-wrap blue">
            <mat-icon>category</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ produtos.length }}</span>
            <span class="metric-label">Produtos cadastrados</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-wrap green">
            <mat-icon>inventory</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ totalSaldoEstoque }}</span>
            <span class="metric-label">Total de unidades em estoque</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-wrap red">
            <mat-icon>warning_amber</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-value">{{ produtosSemSaldoCount }}</span>
            <span class="metric-label">Produtos zerados ou sem saldo</span>
          </div>
        </div>
      </div>

      <!-- Conteúdo Principal / Tabela -->
      <div class="app-card">
        <div class="table-toolbar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Pesquisar por código ou descrição</mat-label>
            <input matInput [(ngModel)]="filtroTexto" (keyup)="aplicarFiltro()" placeholder="Ex: PROD ou Teclado">
            <mat-icon matPrefix>search</mat-icon>
            <button mat-icon-button matSuffix *ngIf="filtroTexto" (click)="filtroTexto=''; aplicarFiltro()">
              <mat-icon>clear</mat-icon>
            </button>
          </mat-form-field>

          <button mat-stroked-button (click)="carregarProdutos()" [disabled]="carregando" matTooltip="Atualizar lista">
            <mat-icon [class.pulsing]="carregando">refresh</mat-icon>
            Atualizar
          </button>
        </div>

        <!-- Indicador de Carregamento -->
        <div *ngIf="carregando" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <span>Carregando catálogo de produtos...</span>
        </div>

        <!-- Tabela -->
        <div class="table-responsive" *ngIf="!carregando">
          <table mat-table [dataSource]="produtosFiltrados" class="mat-elevation-z0">
            <!-- Coluna Código -->
            <ng-container matColumnDef="codigo">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let p">
                <span class="code-badge">{{ p.codigo }}</span>
              </td>
            </ng-container>

            <!-- Coluna Descrição -->
            <ng-container matColumnDef="descricao">
              <th mat-header-cell *matHeaderCellDef>Descrição</th>
              <td mat-cell *matCellDef="let p">
                <span class="desc-text">{{ p.descricao }}</span>
              </td>
            </ng-container>

            <!-- Coluna Saldo -->
            <ng-container matColumnDef="saldo">
              <th mat-header-cell *matHeaderCellDef>Saldo disponível</th>
              <td mat-cell *matCellDef="let p">
                <span class="stock-badge" [ngClass]="getSaldoClass(p.saldo)">
                  <mat-icon class="stock-icon">{{ p.saldo > 0 ? 'check_circle' : 'cancel' }}</mat-icon>
                  {{ p.saldo }} un.
                </span>
              </td>
            </ng-container>

            <!-- Coluna Criado Em -->
            <ng-container matColumnDef="criadoEm">
              <th mat-header-cell *matHeaderCellDef>Cadastrado em</th>
              <td mat-cell *matCellDef="let p">
                {{ p.criadoEm | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <!-- Coluna Ações -->
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef class="text-right">Ações</th>
              <td mat-cell *matCellDef="let p" class="text-right">
                <div class="row-actions">
                  <button mat-icon-button color="accent" (click)="consultarSaldo(p)" matTooltip="Consultar saldo individual">
                    <mat-icon>query_stats</mat-icon>
                  </button>
                  <button mat-icon-button color="primary" (click)="abrirModalEditar(p)" matTooltip="Editar produto">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="colunasExibidas"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasExibidas;"></tr>

            <!-- Linha Quando Vazio -->
            <tr class="mat-row empty-row" *matNoDataRow>
              <td class="mat-cell" [attr.colspan]="colunasExibidas.length">
                <div class="empty-state">
                  <mat-icon class="empty-icon">inventory</mat-icon>
                  <h3>Nenhum produto encontrado</h3>
                  <p>Cadastre um novo produto para começar a emitir notas fiscais.</p>
                  <button mat-flat-button color="primary" (click)="abrirModalCriar()">
                    <mat-icon>add</mat-icon> Cadastrar primeiro produto
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
    .metric-icon-wrap.green { background: var(--success-bg, #ecfdf5); color: var(--success-color, #059669); }
    .metric-icon-wrap.red { background: var(--accent-light, #fff0f3); color: var(--accent-color, #ff0c46); }

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

    .search-field {
      flex: 1;
      min-width: 280px;
    }

    .code-badge {
      font-family: 'Roboto Mono', monospace;
      font-weight: 600;
      background: #edf3f7;
      color: var(--primary-color, #2b485a);
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #dce4eb;
    }

    .desc-text {
      font-weight: 500;
      color: var(--text-main, #2b485a);
    }

    .stock-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .text-right {
      text-align: right !important;
    }

    .row-actions {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
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
export class ProdutosComponent implements OnInit, OnDestroy {
  private produtoService = inject(ProdutoService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  colunasExibidas: string[] = ['codigo', 'descricao', 'saldo', 'criadoEm', 'acoes'];
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  filtroTexto = '';
  carregando = false;

  get totalSaldoEstoque(): number {
    return this.produtos.reduce((acc, p) => acc + p.saldo, 0);
  }

  get produtosSemSaldoCount(): number {
    return this.produtos.filter(p => p.saldo <= 0).length;
  }

  ngOnInit(): void {
    this.carregarProdutos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.cdr.markForCheck();
    this.produtoService.obterTodos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dados) => {
          this.produtos = dados;
          this.aplicarFiltro();
          this.carregando = false;
          this.cdr.detectChanges();
        },
        error: (erro) => {
          this.notification.error(erro.message || 'Erro ao carregar produtos.');
          this.carregando = false;
          this.cdr.detectChanges();
        }
      });
  }

  aplicarFiltro(): void {
    if (!this.filtroTexto.trim()) {
      this.produtosFiltrados = [...this.produtos];
      return;
    }

    const termo = this.filtroTexto.toLowerCase().trim();
    this.produtosFiltrados = this.produtos.filter(p =>
      p.codigo.toLowerCase().includes(termo) ||
      p.descricao.toLowerCase().includes(termo)
    );
    this.cdr.detectChanges();
  }

  abrirModalCriar(): void {
    const dialogRef = this.dialog.open(ProdutoDialogComponent, {
      width: '460px',
      data: { modo: 'criar' }
    });

    dialogRef.afterClosed().subscribe((novoProduto) => {
      if (novoProduto) {
        this.produtoService.criar(novoProduto).subscribe({
          next: (criado) => {
            this.notification.success(`Produto '${criado.descricao}' (${criado.codigo}) cadastrado com sucesso!`);
            this.carregarProdutos();
          },
          error: (erro) => {
            this.notification.error(erro.message || 'Erro ao cadastrar produto.');
          }
        });
      }
    });
  }

  abrirModalEditar(produto: Produto): void {
    const dialogRef = this.dialog.open(ProdutoDialogComponent, {
      width: '460px',
      data: { modo: 'editar', produto: { ...produto } }
    });

    dialogRef.afterClosed().subscribe((dadosAtualizados) => {
      if (dadosAtualizados) {
        this.produtoService.atualizar(produto.id, dadosAtualizados).subscribe({
          next: (atualizado) => {
            this.notification.success(`Produto '${atualizado.codigo}' atualizado com sucesso!`);
            this.carregarProdutos();
          },
          error: (erro) => {
            this.notification.error(erro.message || 'Erro ao atualizar produto.');
          }
        });
      }
    });
  }

  consultarSaldo(produto: Produto): void {
    this.dialog.open(SaldoDialogComponent, {
      width: '420px',
      data: produto.id
    });
  }

  getSaldoClass(saldo: number): string {
    if (saldo >= 10) return 'high';
    if (saldo > 0) return 'medium';
    return 'low';
  }
}
