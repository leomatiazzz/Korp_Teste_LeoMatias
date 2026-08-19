import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'notas-fiscais',
    pathMatch: 'full'
  },
  {
    path: 'notas-fiscais',
    loadComponent: () => import('./features/notas-fiscais/notas-fiscais.component').then(m => m.NotasFiscaisComponent)
  },
  {
    path: 'notas-fiscais/nova',
    loadComponent: () => import('./features/notas-fiscais/nova-nota/nova-nota.component').then(m => m.NovaNotaComponent)
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/produtos/produtos.component').then(m => m.ProdutosComponent)
  },
  {
    path: '**',
    redirectTo: 'notas-fiscais'
  }
];
