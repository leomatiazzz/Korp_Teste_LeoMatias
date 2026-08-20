import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatBadgeModule],
  template: `
    <mat-toolbar class="main-navbar">
      <div class="nav-container">
        <div class="brand" routerLink="/notas-fiscais">
          <img src="assets/logo.png" alt="Korp ERP by Viasoft" class="brand-logo" />
        </div>

        <nav class="nav-links">
          <a mat-button routerLink="/notas-fiscais" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: false}">
            <mat-icon>description</mat-icon>
            <span>Notas fiscais</span>
          </a>

          <a mat-button routerLink="/produtos" routerLinkActive="active-link">
            <mat-icon>inventory_2</mat-icon>
            <span>Produtos e estoque</span>
          </a>
        </nav>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .main-navbar {
      background: var(--primary-color, #2b485a);
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(27, 50, 64, 0.25);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0;
      height: 64px;
      border-bottom: 2px solid rgba(255, 12, 70, 0.4);
    }

    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
    }

    .brand {
      display: flex;
      align-items: center;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    .nav-links {
      display: flex;
      gap: 6px;
    }

    .nav-links a {
      color: rgba(255, 255, 255, 0.85);
      font-weight: 500;
      font-size: 0.875rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      padding: 0 14px;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-links a:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    .active-link {
      background: rgba(255, 255, 255, 0.14) !important;
      color: #ffffff !important;
      font-weight: 600 !important;
    }

    .active-link::after {
      content: '';
      position: absolute;
      bottom: -12px;
      left: 14px;
      right: 14px;
      height: 3px;
      background-color: var(--accent-color, #ff0c46);
      border-radius: 2px 2px 0 0;
    }
  `]
})
export class NavbarComponent {}
