import {
  Component, inject, OnInit, OnDestroy, signal, computed, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TrainingCurvesService } from 'app/core/services/training-curves/training-curves.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { UserService } from 'app/core/services/user/user.service';
import { CurveTrackDto } from 'app/core/interfaces/training-curves/training-curves.interface';

@Component({
  selector: 'opera-curve-tracking',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, InputNumberModule, TagModule, TooltipModule, ProgressSpinnerModule,
  ],
  templateUrl: './curve-tracking.component.html',
  styleUrl: './curve-tracking.component.scss',
})
export class CurveTrackingComponent implements OnInit, OnDestroy {
  private readonly _trainingService  = inject(TrainingCurvesService);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _userService      = inject(UserService);
  private readonly _unsubscribeAll   = new Subject<void>();

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _rows = signal<CurveTrackDto[]>([]);

  readonly loading = signal<boolean>(false);
  readonly saving  = signal<boolean>(false);
  readonly rows    = this._rows.asReadonly();

  // IDs de filas guardadas recientemente para feedback visual (sin signal — no necesita reactividad)
  private _savedRowIds = new Set<number>();

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly isInstructor = computed(() =>
    this._userService.user?.employee_CategoryFromExenta === 'I',
  );

  readonly trainerCode = computed(() =>
    this._userService.user?.employee_Code ?? 'todos',
  );

  ngOnInit(): void {
    this._loadTracking();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private async _loadTracking(): Promise<void> {
    this.loading.set(true);
    try {
      const code = this.isInstructor() ? this.trainerCode() : 'todos';
      const res = await firstValueFrom(this._trainingService.getCurveTracking$(code));
      if (res.success) this._rows.set(res.tracking ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async saveRow(row: CurveTrackDto): Promise<void> {
    this.saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.patchWeekValues$({
          codeId:          row.codeId,
          real_Efficiency: row.real_Efficiency,
          real_Pieces:     row.real_Pieces,
          real_Hours:      row.real_Hours,
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this._savedRowIds.add(row.codeId);
        // Limpiar feedback después de 2s
        setTimeout(() => this._savedRowIds.delete(row.codeId), 2000);
      }
    } finally {
      this.saving.set(false);
    }
  }

  isSaved(rowId: number): boolean {
    return this._savedRowIds.has(rowId);
  }

  isCurrentWeek(row: CurveTrackDto): boolean {
    return row.isCurrentWeek === true;
  }

  trackByCodeId(_: number, row: CurveTrackDto): number {
    return row.codeId;
  }
}
