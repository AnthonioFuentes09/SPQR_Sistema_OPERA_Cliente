import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';

@Component({
  selector: 'opera-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, SelectModule],
  templateUrl: './opera-filters.component.html',
  styleUrl: './opera-filters.component.scss',
})
export class OperaFiltersComponent {
  // ── Inputs ──────────────────────────────────────────────────────────────
  readonly options  = input<BaseItemFilterOptions[]>([]);
  readonly label    = input<string>('Filtrar');
  readonly multiple = input<boolean>(true);
  readonly placeholder = input<string>('Todos');

  // ── Outputs ─────────────────────────────────────────────────────────────
  readonly filterChange = output<string[]>();

  // ── Estado interno ───────────────────────────────────────────────────────
  protected selectedValues = signal<string | string[]>(this.multiple() ? [] : '');

  onSelectionChange(value: string | string[]): void {
    this.selectedValues.set(value);
    const result = Array.isArray(value) ? value : (value ? [value] : []);
    this.filterChange.emit(result);
  }
}
