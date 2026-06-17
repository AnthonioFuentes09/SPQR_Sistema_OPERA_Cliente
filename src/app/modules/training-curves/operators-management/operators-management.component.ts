import {
  Component, inject, OnInit, OnDestroy, signal, computed, effect, ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, firstValueFrom, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TrainingCurvesService } from 'app/core/services/training-curves/training-curves.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { UserTrainingDto, InstructorDto } from 'app/core/interfaces/training-curves/training-curves.interface';

@Component({
  selector: 'opera-operators-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, SelectModule, InputTextModule, TooltipModule, TagModule, ProgressSpinnerModule,
  ],
  templateUrl: './operators-management.component.html',
  styleUrl: './operators-management.component.scss',
})
export class OperatorsManagementComponent implements OnInit, OnDestroy {
  private readonly _trainingService  = inject(TrainingCurvesService);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _unsubscribeAll   = new Subject<void>();

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _operators   = signal<UserTrainingDto[]>([]);
  private readonly _instructors = signal<InstructorDto[]>([]);
  private readonly _search      = signal<string>('');

  readonly loading  = signal<boolean>(false);
  readonly savingId = signal<string | null>(null);

  // Computed filtrado
  readonly filteredOperators = computed(() => {
    const q = this._search().toLowerCase();
    const ops = this._operators();
    if (!q) return ops;
    return ops.filter(
      o =>
        o.employee_Name.toLowerCase().includes(q) ||
        o.employee_Code.toLowerCase().includes(q),
    );
  });

  readonly instructors = this._instructors.asReadonly();

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadAll();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  private async _loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [operators, instructors] = await firstValueFrom(
        forkJoin([
          this._trainingService.getEmployeesTraining$(),
          this._trainingService.getInstructors$(),
        ]),
      );
      this._operators.set(operators ?? []);
      this._instructors.set(instructors ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  private async _reloadOperators(): Promise<void> {
    const list = await firstValueFrom(this._trainingService.getEmployeesTraining$());
    this._operators.set(list ?? []);
  }

  // ── Handlers ──────────────────────────────────────────────────────────
  onSearch(event: Event): void {
    this._search.set((event.target as HTMLInputElement).value);
  }

  async onInstructorChange(operator: UserTrainingDto, newTrainerCode: string): Promise<void> {
    this.savingId.set(operator.employee_Code);
    try {
      const res = await firstValueFrom(
        this._trainingService.patchEmployeeTrainer$({
          employee_Code: operator.employee_Code,
          trainer_Code:  newTrainerCode,
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) await this._reloadOperators();
    } finally {
      this.savingId.set(null);
    }
  }

  trackByCode(_: number, op: UserTrainingDto): string {
    return op.employee_Code;
  }
}
