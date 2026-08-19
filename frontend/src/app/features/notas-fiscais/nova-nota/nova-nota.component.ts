import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { NotaFiscalService } from '../../../core/services/nota-fiscal.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Produto } from '../../../core/models/produto.model';
import { CriarItemNotaFiscal, CriarNotaFiscal } from '../../../core/models/nota-fiscal.model';

@Component({
  selector: 'app-nova-nota',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <div class="breadcrumb">
            <a routerLink="/notas-fiscais">Notas fiscais</a>
            <mat-icon>chevron_right</mat-icon>
            <span>Nova nota fiscal</span>
          </div>
          <h1 class="page-title">
            <mat-icon color="primary">post_add</mat-icon>
            Cadastrar nova nota fiscal
          </h1>
          <p class="page-subtitle">
            A nota será criada inicialmente no status <strong>ABERTA</strong> com numeração sequencial automática.
          </p>
        </div>

        <div class="header-actions">
          <button mat-stroked-button routerLink="/notas-fiscais">
            <mat-icon>arrow_back</mat-icon>
            Voltar para a lista
          </button>
        </div>
      </div>

      <!-- Carregando Dados Iniciais -->
      <div *ngIf="carregandoInicial" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Carregando produtos e numeração sequencial...</span>
      </div>

      <div class="form-layout" *ngIf="!carregandoInicial">
        <!-- Coluna Principal do Formulário -->
        <div class="main-form-column">
          <!-- Card de Informações da Nota -->
          <div class="app-card mb-20">
            <h2 class="card-title">
              <mat-icon>info</mat-icon>
              Dados gerais da nota fiscal
            </h2>

            <div class="form-grid">
              <div class="preview-number-box">
                <span class="preview-label">Número sequencial sugerido</span>
                <span class="preview-number">#{{ formatNumero(proximoNumero) }}</span>
                <span class="preview-badge">Status inicial: Aberta</span>
              </div>

              <div class="obs-field-wrap">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Observação ou justificativa (opcional)</mat-label>
                  <textarea
                    matInput
                    [(ngModel)]="observacao"
                    rows="3"
                    placeholder="Ex: Faturamento referente ao pedido comercial 4500"
                  ></textarea>
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- Card de Adicionar Produtos -->
          <div class="app-card mb-20">
            <h2 class="card-title">
              <mat-icon>add_shopping_cart</mat-icon>
              Adicionar produtos à nota
            </h2>

            <form [formGroup]="itemForm" (ngSubmit)="adicionarItem()" class="add-item-form">
              <div class="item-inputs-grid">
                <mat-form-field appearance="outline" class="product-select-field">
                  <mat-label>Selecione um produto do estoque</mat-label>
                  <mat-select formControlName="produtoId" (selectionChange)="onProdutoSelecionado()">
                    <mat-option *ngFor="let p of produtos" [value]="p.id">
                      {{ p.codigo }} - {{ p.descricao }} (Saldo em estoque: {{ p.saldo }} un.)
                    </mat-option>
                  </mat-select>
                  <mat-error *ngIf="itemForm.get('produtoId')?.hasError('required')">
                    Selecione um produto.
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="qty-field">
                  <mat-label>Quantidade</mat-label>
                  <input matInput type="number" formControlName="quantidade" min="1" placeholder="1">
                  <mat-error *ngIf="itemForm.get('quantidade')?.hasError('required')">
                    Informe a quantidade.
                  </mat-error>
                  <mat-error *ngIf="itemForm.get('quantidade')?.hasError('min')">
                    Mínimo 1 unidade.
                  </mat-error>
                </mat-form-field>

                <div class="add-btn-wrap">
                  <button mat-raised-button color="primary" type="submit" [disabled]="itemForm.invalid" class="btn-add">
                    <mat-icon>add</mat-icon>
                    Adicionar item
                  </button>
                </div>
              </div>

              <!-- Alerta de Saldo para o Produto Selecionado -->
              <div *ngIf="produtoSelecionado" class="selected-product-alert" [ngClass]="produtoSelecionado.saldo > 0 ? 'alert-info' : 'alert-danger'">
                <mat-icon>{{ produtoSelecionado.saldo > 0 ? 'info' : 'warning' }}</mat-icon>
                <span>
                  <strong>{{ produtoSelecionado.descricao }}</strong>: Saldo disponível no Estoque Service:
                  <strong>{{ produtoSelecionado.saldo }} unidades</strong>.
                  <em *ngIf="produtoSelecionado.saldo <= 0"> (Atenção: Produto sem saldo em estoque!)</em>
                </span>
              </div>
            </form>
          </div>

          <!-- Tabela de Itens Adicionados -->
          <div class="app-card">
            <div class="items-header">
              <h2 class="card-title">
                <mat-icon>checklist</mat-icon>
                Itens adicionados à nota ({{ itensNota.length }})
              </h2>
            </div>

            <div class="table-responsive" *ngIf="itensNota.length > 0">
              <table mat-table [dataSource]="itensNota" class="mat-elevation-z0">
                <ng-container matColumnDef="codigo">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let item">
                    <span class="code-badge">{{ item.codigoProduto }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="descricao">
                  <th mat-header-cell *matHeaderCellDef>Descrição</th>
                  <td mat-cell *matCellDef="let item">
                    <strong>{{ item.descricaoProduto }}</strong>
                  </td>
                </ng-container>

                <ng-container matColumnDef="quantidade">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Quantidade</th>
                  <td mat-cell *matCellDef="let item" class="text-right">
                    <span class="qty-highlight">{{ item.quantidade }} un.</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="acoes">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Remover</th>
                  <td mat-cell *matCellDef="let item; let i = index" class="text-right">
                    <button mat-icon-button color="warn" (click)="removerItem(i)" matTooltip="Remover item da nota">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="colunasItens"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasItens;"></tr>
              </table>
            </div>

            <div *ngIf="itensNota.length === 0" class="no-items-state">
              <mat-icon>shopping_bag</mat-icon>
              <p>Nenhum produto adicionado ainda. Selecione um produto acima e clique em "Adicionar item".</p>
            </div>
          </div>
        </div>

        <!-- Coluna Lateral de Resumo e Salvar -->
        <div class="sidebar-column">
          <div class="app-card summary-card">
            <h2 class="card-title">
              <mat-icon>receipt</mat-icon>
              Resumo da nota
            </h2>

            <div class="summary-list">
              <div class="summary-row">
                <span class="summary-label">Número sugerido:</span>
                <span class="summary-val font-mono">#{{ formatNumero(proximoNumero) }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Status inicial:</span>
                <span class="status-badge aberta">Aberta</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Itens diferentes:</span>
                <span class="summary-val">{{ itensNota.length }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Total de peças ou unidades:</span>
                <span class="summary-val total-qty">{{ totalQuantidade }} un.</span>
              </div>
            </div>

            <div class="summary-actions">
              <button
                mat-raised-button
                color="primary"
                class="btn-submit-nota"
                [disabled]="itensNota.length === 0 || salvando"
                (click)="salvarNotaFiscal()"
              >
                <mat-spinner *ngIf="salvando" diameter="20" class="btn-spinner"></mat-spinner>
                <mat-icon *ngIf="!salvando">check_circle</mat-icon>
                <span>{{ salvando ? 'Salvando nota fiscal...' : 'Criar nota fiscal' }}</span>
              </button>

              <button mat-stroked-button routerLink="/notas-fiscais" [disabled]="salvando">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .breadcrumb a {
      color: var(--primary-light, #3b82f6);
      text-decoration: none;
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 960px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }

    .mb-20 {
      margin-bottom: 20px;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 20px;
      align-items: center;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .preview-number-box {
      background: linear-gradient(135deg, var(--primary-color, #2b485a), var(--primary-dark, #1b3240));
      color: #ffffff;
      padding: 16px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(27, 50, 64, 0.15);
    }

    .preview-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.85;
    }

    .preview-number {
      font-size: 1.8rem;
      font-weight: 800;
      font-family: 'Roboto Mono', monospace;
    }

    .preview-badge {
      background: rgba(255, 255, 255, 0.18);
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .w-full {
      width: 100%;
    }

    .item-inputs-grid {
      display: grid;
      grid-template-columns: 1fr 140px 160px;
      gap: 12px;
      align-items: start;
    }

    @media (max-width: 768px) {
      .item-inputs-grid {
        grid-template-columns: 1fr;
      }
    }

    .add-btn-wrap {
      padding-top: 4px;
    }

    .btn-add {
      height: 54px;
      width: 100%;
      font-weight: 600;
      background-color: var(--primary-color, #2b485a) !important;
      color: #ffffff !important;
    }

    .btn-add:hover {
      background-color: var(--primary-dark, #1b3240) !important;
    }

    .selected-product-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 0.875rem;
    }

    .alert-info {
      background: var(--info-bg, #f0f9ff);
      border: 1px solid var(--info-border, #bae6fd);
      color: var(--info-color, #0284c7);
    }

    .alert-danger {
      background: var(--danger-bg, #fff1f2);
      border: 1px solid var(--danger-border, #fecdd3);
      color: var(--danger-color, #e11d48);
    }

    .code-badge {
      font-family: 'Roboto Mono', monospace;
      background: #edf3f7;
      color: var(--primary-color, #2b485a);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      border: 1px solid #dce4eb;
    }

    .qty-highlight {
      font-weight: 700;
      color: var(--primary-color, #2b485a);
    }

    .text-right {
      text-align: right !important;
    }

    .no-items-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 16px;
      color: var(--text-muted, #688294);
      text-align: center;
    }

    .summary-card {
      position: sticky;
      top: 84px;
      border-top: 3px solid var(--accent-color, #ff0c46);
    }

    .summary-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }

    .summary-label {
      color: var(--text-muted, #688294);
      font-weight: 500;
    }

    .summary-val {
      font-weight: 600;
      color: var(--text-main, #2b485a);
    }

    .font-mono {
      font-family: 'Roboto Mono', monospace;
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--primary-color, #2b485a);
    }

    .total-qty {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--primary-color, #2b485a);
    }

    .summary-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .btn-submit-nota {
      height: 48px;
      font-weight: 600;
      font-size: 0.95rem;
      background-color: var(--accent-color, #ff0c46) !important;
      color: #ffffff !important;
      border-radius: 6px !important;
      box-shadow: 0 2px 8px rgb(255 12 70 / 0.3) !important;
      transition: background-color 0.2s ease;
    }

    .btn-submit-nota:hover:not([disabled]) {
      background-color: var(--accent-hover, #e00038) !important;
    }

    .btn-spinner {
      margin-right: 8px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 60px 0;
      color: #64748b;
    }
  `]
})
export class NovaNotaComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private notaFiscalService = inject(NotaFiscalService);
  private produtoService = inject(ProdutoService);
  private notification = inject(NotificationService);

  private destroy$ = new Subject<void>();

  carregandoInicial = true;
  salvando = false;
  proximoNumero = 1;
  observacao = '';

  produtos: Produto[] = [];
  produtoSelecionado?: Produto;

  itensNota: CriarItemNotaFiscal[] = [];
  colunasItens: string[] = ['codigo', 'descricao', 'quantidade', 'acoes'];

  itemForm: FormGroup;

  constructor() {
    this.itemForm = this.fb.group({
      produtoId: [null, [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });
  }

  get totalQuantidade(): number {
    return this.itensNota.reduce((acc, item) => acc + item.quantidade, 0);
  }

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatNumero(num: number): string {
    return num.toString().padStart(4, '0');
  }

  carregarDadosIniciais(): void {
    this.carregandoInicial = true;

    forkJoin({
      produtos: this.produtoService.obterTodos(),
      numero: this.notaFiscalService.obterProximoNumero()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res) => {
        this.produtos = res.produtos;
        this.proximoNumero = res.numero.proximoNumero;
        this.carregandoInicial = false;
      },
      error: (erro) => {
        this.notification.error('Erro ao carregar dados iniciais: ' + erro.message);
        this.carregandoInicial = false;
      }
    });
  }

  onProdutoSelecionado(): void {
    const id = this.itemForm.get('produtoId')?.value;
    this.produtoSelecionado = this.produtos.find(p => p.id === id);
  }

  adicionarItem(): void {
    if (this.itemForm.invalid || !this.produtoSelecionado) return;

    const quantidade = this.itemForm.get('quantidade')?.value;
    const produto = this.produtoSelecionado;

    // Verifica se o item já foi adicionado na lista
    const indexExistente = this.itensNota.findIndex(i => i.produtoId === produto.id);

    if (indexExistente >= 0) {
      this.itensNota[indexExistente].quantidade += quantidade;
      this.notification.info(`Quantidade do produto '${produto.codigo}' atualizada na nota.`);
    } else {
      this.itensNota.push({
        produtoId: produto.id,
        codigoProduto: produto.codigo,
        descricaoProduto: produto.descricao,
        quantidade
      });
    }

    // Forçar atualização do array para re-render da tabela
    this.itensNota = [...this.itensNota];

    // Resetar formulário do item
    this.itemForm.reset({ quantidade: 1 });
    this.produtoSelecionado = undefined;
  }

  removerItem(index: number): void {
    this.itensNota.splice(index, 1);
    this.itensNota = [...this.itensNota];
  }

  salvarNotaFiscal(): void {
    if (this.itensNota.length === 0) {
      this.notification.warning('Adicione ao menos um item para criar a nota fiscal.');
      return;
    }

    this.salvando = true;

    const payload: CriarNotaFiscal = {
      observacao: this.observacao.trim() || null,
      itens: this.itensNota
    };

    this.notaFiscalService.criar(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notaCriada) => {
          this.salvando = false;
          this.notification.success(`Nota Fiscal Nº ${this.formatNumero(notaCriada.numero)} criada com sucesso no status ABERTA!`);
          this.router.navigate(['/notas-fiscais']);
        },
        error: (erro) => {
          this.salvando = false;
          this.notification.error(erro.message || 'Erro ao criar nota fiscal.');
        }
      });
  }
}
