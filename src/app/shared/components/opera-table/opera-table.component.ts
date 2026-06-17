import { Component, input, output, TemplateRef, contentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

// ── Acción individual de columna ───────────────────────────────────────────────
export interface ColumnAction {
  /** fa-solid icon class, ej: 'fa-solid fa-pencil' o 'pi pi-pencil' */
  icon: string;
  tooltip?: string;
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'dark';
  action: string;
  bgColor?: string;
}

export interface Column {
  field: string;
  header: string;
  type: 'text' | 'badge' | 'number' | 'boolean' | 'actions' | 'template';
  sortable?: boolean;
  /** Muestra filtro de texto por columna en el header */
  filterable?: boolean;
  width?: string;
  badgeClass?: (value: unknown) => string;
  /** Lista de acciones para columnas tipo 'actions'. Si no se define → edit + delete */
  actions?: ColumnAction[];
}

@Component({
  selector: 'opera-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, TooltipModule, InputTextModule],
  templateUrl: './opera-table.component.html',
  styleUrl: './opera-table.component.scss',
})
export class OperaTableComponent<T extends Record<string, unknown>> {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  readonly columns             = input.required<Column[]>();
  readonly data                = input<T[]>([]);
  readonly loading             = input<boolean>(false);
  readonly paginator           = input<boolean>(true);
  readonly rows                = input<number>(25);
  readonly rowsPerPageOptions  = input<number[]>([10, 25, 50]);
  readonly scrollable          = input<boolean>(false);
  readonly scrollHeight        = input<string>('400px');
  /** Habilita redimensionamiento de columnas */
  readonly resizableColumns    = input<boolean>(true);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly editRow     = output<T>();
  readonly deleteRow   = output<T>();
  readonly rowClick    = output<T>();
  readonly actionClick = output<{ action: string; row: T }>();

  readonly actionsTemplate = contentChild<TemplateRef<unknown>>('actionsCell');

  // ── Helpers ─────────────────────────────────────────────────────────────────
  getValue(row: T, field: string): unknown {
    return row[field];
  }

  getBadgeClass(col: Column, value: unknown): string {
    if (col.badgeClass) return col.badgeClass(value);
    return `status-badge ${value}`;
  }

  getActionColorClass(act: ColumnAction): string {
    if (act.bgColor) return '';
    const map: Record<string, string> = {
      primary:   'pw-btn-primary',
      info:      'pw-btn-info',
      success:   'pw-btn-success',
      warning:   'pw-btn-warning',
      danger:    'pw-btn-danger',
      secondary: 'pw-btn-secondary',
      dark:      'pw-btn-dark',
    };
    return map[act.color ?? 'primary'];
  }

  onActionClick(act: ColumnAction, row: T, event: Event): void {
    event.stopPropagation();
    if (act.action === 'edit')   { this.editRow.emit(row); return; }
    if (act.action === 'delete') { this.deleteRow.emit(row); return; }
    this.actionClick.emit({ action: act.action, row });
  }
}
