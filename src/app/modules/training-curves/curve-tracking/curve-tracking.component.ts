import {
  Component, computed, inject,
  OnDestroy, OnInit, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

import { ButtonModule }          from 'primeng/button';
import { InputNumberModule }     from 'primeng/inputnumber';
import { TagModule }             from 'primeng/tag';
import { TooltipModule }         from 'primeng/tooltip';
import { TableModule }           from 'primeng/table';

import { TrainingCurvesService }  from 'app/core/services/training-curves/training-curves.service';
import { ExceptionService }       from 'app/core/services/utils/exception.service';
import { UserService }            from 'app/core/services/user/user.service';
import { CurveTrackDto }          from 'app/core/interfaces/training-curves/training-curves.interface';
import { OperaPageHeaderComponent } from 'app/shared/components/opera-page-header/opera-page-header.component';

@Component({
  selector: 'opera-curve-tracking',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputNumberModule, TagModule, TooltipModule, TableModule,
    OperaPageHeaderComponent,
  ],
  templateUrl: './curve-tracking.component.html',
  styleUrl: './curve-tracking.component.scss',
})
export class CurveTrackingComponent implements OnInit, OnDestroy {

  private readonly _trainingService  = inject(TrainingCurvesService);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _userService      = inject(UserService);
  private readonly _destroy$         = new Subject<void>();

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _rows       = signal<CurveTrackDto[]>([]);
  private readonly _searchTerm = signal<string>('');
  private readonly _loading    = signal<boolean>(false);
  private readonly _saving     = signal<boolean>(false);

  // IDs guardados recientemente para feedback visual
  private readonly _savedRowIds = new Set<number>();

  // ── Públicos readonly ────────────────────────────────────────────────────
  readonly loading    = this._loading.asReadonly();
  readonly saving     = this._saving.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly isInstructor = computed(() =>
    this._userService.user?.employee_CategoryFromExenta === 'I',
  );

  readonly trainerCode = computed(() =>
    this._userService.user?.employee_Code ?? 'todos',
  );

  readonly subtitle = computed(() => `Registros: ${this.filteredRows().length}`);

  readonly filteredRows = computed<CurveTrackDto[]>(() => {
    const q = this._searchTerm().toLowerCase();
    if (!q) return this._rows();
    return this._rows().filter(r =>
      r.employee_Name.toLowerCase().includes(q) ||
      r.employee_AltCode.toLowerCase().includes(q) ||
      r.curve_Name.toLowerCase().includes(q) ||
      r.area_AlphaNumId.toLowerCase().includes(q),
    );
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadTracking();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // ── Carga ────────────────────────────────────────────────────────────────
  private _loadTracking(): void {
    this._loading.set(true);
    const code = this.isInstructor() ? this.trainerCode() : 'todos';

    this._trainingService.getCurveTracking$(code)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: res => {
          const rows = (res.tracking ?? []).map(r => ({ ...r })); // copia mutable
          this._rows.set(rows);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });
  }

  reload(): void { this._loadTracking(); }

  // ── Filtro / búsqueda ────────────────────────────────────────────────────
  onSearchChange(term: string): void { this._searchTerm.set(term); }

  // ── Edición inline ───────────────────────────────────────────────────────
  onInputChange(row: CurveTrackDto): void {
    row.editableRow          = true;
    row.editableHour         = true;
    row.editableEfficiency   = true;
    row.editablePieces       = true;
  }

  onClearControls(row: CurveTrackDto): void {
    row.value_Hours      = 0;
    row.real_Efficiency  = 0;
    row.real_Pieces      = 0;
    row.editableRow         = false;
    row.editableHour        = false;
    row.editableEfficiency  = false;
    row.editablePieces      = false;
  }

  // ── Guardar progreso ─────────────────────────────────────────────────────
  async onSaveWeeklyProgress(row: CurveTrackDto): Promise<void> {
    this._saving.set(true);
    try {
      const res = await import('rxjs').then(({ firstValueFrom }) =>
        firstValueFrom(this._trainingService.patchWeekValues$({
          codeId:            row.codeId,
          assignment_CodeId: row.assignment_CodeId,
          base_Hours:        row.base_Hours,
          value_Hours:       row.value_Hours,
          target_Efficiency: row.target_Efficiency,
          real_Efficiency:   row.real_Efficiency,
          real_Pieces:       row.real_Pieces,
          base_Pieces:       row.base_Pieces,
        })),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.onClearControls(row);
        this._savedRowIds.add(row.codeId);
        setTimeout(() => this._savedRowIds.delete(row.codeId), 2500);
      }
    } finally {
      this._saving.set(false);
    }
  }

  // ── Comentario del instructor ─────────────────────────────────────────────
  onShowInstructorComment(row: CurveTrackDto): void {
    Swal.fire({
      title: 'Comentario del instructor',
      input: 'textarea',
      inputLabel: 'Indique el comentario (10–200 caracteres)',
      inputPlaceholder: 'Escribe el comentario aquí...',
      inputValue: row.instructorComments ?? '',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: (value: string) => {
        const v = (value ?? '').trim();
        if (v.length < 10) { Swal.showValidationMessage('Mínimo 10 caracteres'); return false; }
        if (v.length > 200) { Swal.showValidationMessage('Máximo 200 caracteres'); return false; }
        return v;
      },
    }).then(result => {
      if (!result.isConfirmed) return;
      const comment = result.value as string;

      import('rxjs').then(({ firstValueFrom }) =>
        firstValueFrom(this._trainingService.saveInstructorComment$(
          row.assignment_CodeId, row.assignment_Week, comment,
        )),
      ).then(res => {
        this._exceptionService.showToastResult(res);
        if (res.success) {
          // Actualizar en memoria sin recargar todo
          this._rows.update(rows =>
            rows.map(r => r.codeId === row.codeId ? { ...r, instructorComments: comment } : r),
          );
        }
      });
    });
  }

  // ── Helpers de template ───────────────────────────────────────────────────
  isSaved(codeId: number): boolean { return this._savedRowIds.has(codeId); }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'completada':    'status-badge completada',
      'en-progreso':   'status-badge en-progreso',
      'por-hacer':     'status-badge por-hacer',
      'en-pausa':      'status-badge en-pausa',
      'no-completado': 'status-badge no-completado',
      'cancelada':     'status-badge cancelada',
    };
    return map[status] ?? 'status-badge';
  }

}
