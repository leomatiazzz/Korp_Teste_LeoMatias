import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Fechar', {
      duration,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  error(message: string, duration: number = 6000): void {
    this.snackBar.open(message, 'Fechar', {
      duration,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  warning(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Fechar', {
      duration,
      panelClass: ['snackbar-warning'],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  info(message: string, duration: number = 4000): void {
    this.snackBar.open(message, 'Fechar', {
      duration,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
