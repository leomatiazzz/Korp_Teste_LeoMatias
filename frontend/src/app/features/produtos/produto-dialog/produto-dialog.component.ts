import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Produto } from '../../../core/models/produto.model';

export interface ProdutoDialogData {
  modo: 'criar' | 'editar';
  produto?: Produto;
}

@Component({
  selector: 'app-produto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="dialog-title-container">
        <mat-icon class="dialog-icon">{{ data.modo === 'criar' ? 'add_box' : 'edit_note' }}</mat-icon>
        <h2 mat-dialog-title class="dialog-title">
          {{ data.modo === 'criar' ? 'Novo produto' : 'Editar produto' }}
        </h2>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="product-form">
        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Código do produto</mat-label>
            <input matInput formControlName="codigo" placeholder="Ex: PROD-001" uppercase>
            <mat-icon matPrefix>qr_code</mat-icon>
            <mat-error *ngIf="form.get('codigo')?.hasError('required')">
              O código do produto é obrigatório.
            </mat-error>
            <mat-error *ngIf="form.get('codigo')?.hasError('maxlength')">
              Máximo de 50 caracteres.
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Descrição do produto</mat-label>
            <input matInput formControlName="descricao" placeholder="Ex: Teclado Mecânico RGB">
            <mat-icon matPrefix>description</mat-icon>
            <mat-error *ngIf="form.get('descricao')?.hasError('required')">
              A descrição é obrigatória.
            </mat-error>
            <mat-error *ngIf="form.get('descricao')?.hasError('minlength')">
              Mínimo de 2 caracteres.
            </mat-error>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Saldo disponível em estoque</mat-label>
            <input matInput type="number" formControlName="saldo" min="0" placeholder="0">
            <mat-icon matPrefix>inventory</mat-icon>
            <mat-error *ngIf="form.get('saldo')?.hasError('required')">
              O saldo é obrigatório.
            </mat-error>
            <mat-error *ngIf="form.get('saldo')?.hasError('min')">
              O saldo não pode ser negativo.
            </mat-error>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="salvar()">
        <mat-icon>{{ data.modo === 'criar' ? 'save' : 'check' }}</mat-icon>
        {{ data.modo === 'criar' ? 'Cadastrar' : 'Salvar alterações' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 8px;
    }

    .dialog-title-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dialog-icon {
      color: var(--primary-color, #2b485a);
    }

    .dialog-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--primary-dark, #1b3240);
    }

    .close-btn {
      color: var(--text-muted, #688294);
    }

    .dialog-content {
      padding: 16px 24px !important;
      min-width: 380px;
    }

    .product-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .w-full {
      width: 100%;
    }

    .dialog-actions {
      padding: 12px 24px 20px !important;
      gap: 8px;
    }
  `]
})
export class ProdutoDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProdutoDialogComponent>);

  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProdutoDialogData) {
    this.form = this.fb.group({
      codigo: [data.produto?.codigo || '', [Validators.required, Validators.maxLength(50)]],
      descricao: [data.produto?.descricao || '', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      saldo: [data.produto?.saldo ?? 0, [Validators.required, Validators.min(0)]]
    });
  }

  salvar(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
