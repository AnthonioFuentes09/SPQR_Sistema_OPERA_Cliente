import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PageHeaderIconColor = 'primary' | 'success' | 'warning' | 'danger' | 'orange' | 'gray';

@Component({
  selector: 'opera-page-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opera-page-header.component.html',
  styleUrl: './opera-page-header.component.scss',
})
export class OperaPageHeaderComponent {
  // ── Inputs ────────────────────────────────────────────────────────────────
  /** Clase del icono PrimeIcons, ej: 'pi pi-users' */
  readonly icon        = input<string>('pi pi-circle');
  /** Color del círculo del icono */
  readonly iconColor   = input<PageHeaderIconColor>('primary');
  /** Título principal */
  readonly title       = input<string>('');
  /** Subtítulo / contador de registros */
  readonly subtitle    = input<string>('');
  /** Mostrar input de búsqueda */
  readonly showSearch  = input<boolean>(true);
  /** Placeholder del input */
  readonly placeholder = input<string>('Buscar registro...');

  // ── Outputs ───────────────────────────────────────────────────────────────
  readonly searchChange = output<string>();

  // ── Internal ──────────────────────────────────────────────────────────────
  private readonly _searchTerm = signal<string>('');
  readonly searchTerm = this._searchTerm.asReadonly();

  onSearch(value: string): void {
    this._searchTerm.set(value);
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this._searchTerm.set('');
    this.searchChange.emit('');
  }
}
