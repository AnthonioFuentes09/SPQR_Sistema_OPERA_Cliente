import {
  Component, inject, OnInit, OnDestroy, signal, computed, ViewEncapsulation,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ContextMenuModule } from 'primeng/contextmenu';
import type { MenuItem } from 'primeng/api';
import Swal from 'sweetalert2';

import { TrainingCurvesService } from 'app/core/services/training-curves/training-curves.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import {
  EmployeeAssignmentDTO,
  WeeklyProgress,
  WeekStatus,
  InstructorDto,
} from 'app/core/interfaces/training-curves/training-curves.interface';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { OperaDialogComponent } from 'app/shared/components/opera-dialog/opera-dialog.component';
import { OperaFiltersComponent } from 'app/shared/components/opera-filters/opera-filters.component';

interface AssignmentForm {
  employee_Code: FormControl<string>;
  curve_Code:    FormControl<string>;
  initialWeek:   FormControl<number>;
  lvlStart:      FormControl<number>;
  comments:      FormControl<string>;
}

interface CommentForm {
  comment: FormControl<string>;
}

@Component({
  selector: 'opera-curve-assignment',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, SelectModule, InputTextModule, InputNumberModule,
    TextareaModule, TooltipModule, TagModule, MenuModule,
    ProgressSpinnerModule, ContextMenuModule,
    OperaDialogComponent, OperaFiltersComponent,
  ],
  templateUrl: './curve-assignment.component.html',
  styleUrl: './curve-assignment.component.scss',
})
export class CurveAssignmentComponent implements OnInit, OnDestroy {
  private readonly _trainingService  = inject(TrainingCurvesService);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _unsubscribeAll        = new Subject<void>();
  private readonly _unsubscribeWeekRows   = new Subject<void>();

  // ── Parámetros de vista ─────────────────────────────────────────────────
  readonly currentYear     = signal<number>(new Date().getFullYear());
  readonly currentSemester = signal<number>(1);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _employees   = signal<EmployeeAssignmentDTO[]>([]);
  private readonly _instructors = signal<InstructorDto[]>([]);
  private readonly _statusFilter = signal<string[]>([]);

  readonly loading   = signal<boolean>(false);
  readonly saving    = signal<boolean>(false);

  readonly employees   = this._employees.asReadonly();
  readonly instructors = this._instructors.asReadonly();

  // Fila / semana seleccionada para context menu
  private _selectedEmployee = signal<EmployeeAssignmentDTO | null>(null);
  private _selectedWeek     = signal<WeeklyProgress | null>(null);

  // ── Modales activos ──────────────────────────────────────────────────────
  readonly showAssignment       = signal<boolean>(false);
  readonly showManageWeeks      = signal<boolean>(false);
  readonly showComment          = signal<boolean>(false);
  readonly showInstructor       = signal<boolean>(false);
  readonly showChangeStatus     = signal<boolean>(false);
  readonly showDelete           = signal<boolean>(false);

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly filteredEmployees = computed(() => {
    const f = this._statusFilter();
    const emps = this._employees();
    if (!f.length) return emps;
    return emps.filter(e => f.includes(e.statePeriod));
  });

  /** Semanas únicas del semestre para cabecera de timeline */
  readonly timelineWeeks = computed<number[]>(() => {
    const all = this._employees().flatMap(e => e.weeks ?? []);
    const nums = [...new Set(all.map(w => w.assignment_Week))].sort((a, b) => a - b);
    return nums;
  });

  readonly statusFilterOptions = computed<BaseItemFilterOptions[]>(() => {
    const statuses = [...new Set(this._employees().map(e => e.statePeriod))];
    return statuses.map(s => ({ valueKey: s, description: s }));
  });

  // ── Context menu ─────────────────────────────────────────────────────────
  readonly contextMenuItems = computed<MenuItem[]>(() => {
    const week = this._selectedWeek();
    if (!week) return [];
    return [
      {
        label: 'Cambiar estado',
        icon: 'pi pi-sync',
        command: () => this.showChangeStatus.set(true),
      },
      {
        label: 'Comentario instructor',
        icon: 'pi pi-comment',
        command: () => this.showComment.set(true),
      },
      {
        separator: true,
      },
      {
        label: 'Ver detalle',
        icon: 'pi pi-eye',
        command: () => this.showManageWeeks.set(true),
      },
    ];
  });

  // ── Formularios ──────────────────────────────────────────────────────────
  readonly assignmentForm = new FormGroup<AssignmentForm>({
    employee_Code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    curve_Code:    new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    initialWeek:   new FormControl(1,  { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    lvlStart:      new FormControl(1,  { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    comments:      new FormControl('', { nonNullable: true }),
  });

  readonly commentForm = new FormGroup<CommentForm>({
    comment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  // ── Semestre options ──────────────────────────────────────────────────────
  readonly semesterOptions = [
    { label: 'Semestre 1', value: 1 },
    { label: 'Semestre 2', value: 2 },
    { label: 'Año completo', value: 0 },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadAll();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this._unsubscribeWeekRows.next();
    this._unsubscribeWeekRows.complete();
  }

  // ── Carga ───────────────────────────────────────────────────────────────
  private async _loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [assignmentsRes, instructors] = await firstValueFrom(
        forkJoin([
          this._trainingService.getEmployeeAssignments$(
            this.currentYear(),
            this.currentSemester(),
          ),
          this._trainingService.getInstructors$(),
        ]),
      );
      if (assignmentsRes.success) {
        this._employees.set(assignmentsRes.assignments ?? []);
      }
      this._instructors.set(instructors ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  async reload(): Promise<void> {
    await this._loadAll();
  }

  // ── Handlers — filtros ───────────────────────────────────────────────────
  onStatusFilter(values: string[]): void {
    this._statusFilter.set(values);
  }

  onSemesterChange(value: number): void {
    this.currentSemester.set(value);
    this._loadAll();
  }

  // ── Handlers — timeline cells ────────────────────────────────────────────
  getWeekForEmployee(employee: EmployeeAssignmentDTO, weekNum: number): WeeklyProgress | undefined {
    return employee.weeks?.find(w => w.assignment_Week === weekNum);
  }

  onWeekRightClick(event: MouseEvent, employee: EmployeeAssignmentDTO, week: WeeklyProgress): void {
    event.preventDefault();
    this._selectedEmployee.set(employee);
    this._selectedWeek.set(week);
  }

  // ── Handlers — modales ───────────────────────────────────────────────────
  openCreate(): void {
    this.assignmentForm.reset({ initialWeek: 1, lvlStart: 1 });
    this.showAssignment.set(true);
  }

  openManageWeeks(employee: EmployeeAssignmentDTO): void {
    this._selectedEmployee.set(employee);
    // Reset subscripciones de semanas al abrir
    this._unsubscribeWeekRows.next();
    this.showManageWeeks.set(true);
  }

  openDelete(employee: EmployeeAssignmentDTO): void {
    this._selectedEmployee.set(employee);
    this.showDelete.set(true);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────
  async onSaveAssignment(): Promise<void> {
    if (this.assignmentForm.invalid) { this.assignmentForm.markAllAsTouched(); return; }

    this.saving.set(true);
    try {
      const values = this.assignmentForm.getRawValue();
      const res = await firstValueFrom(
        this._trainingService.createEmployeeAssignment$({
          ...values,
          date_Assignment: new Date().toISOString(),
          curveTypeCode: 'T',
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.showAssignment.set(false);
        await this._loadAll();
      }
    } finally {
      this.saving.set(false);
    }
  }

  async onSaveComment(): Promise<void> {
    if (this.commentForm.invalid) { this.commentForm.markAllAsTouched(); return; }

    const week = this._selectedWeek();
    if (!week) return;

    this.saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.patchInstructorComment$({
          codeId:  week.codeId,
          comment: this.commentForm.getRawValue().comment,
        }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.showComment.set(false);
        this.commentForm.reset();
      }
    } finally {
      this.saving.set(false);
    }
  }

  async onConfirmDelete(): Promise<void> {
    const employee = this._selectedEmployee();
    if (!employee) return;

    this.saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.deleteEmployeeAssignment$(
          employee.codeId,
          employee.employee_Code,
        ),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.showDelete.set(false);
        await this._loadAll();
      }
    } finally {
      this.saving.set(false);
    }
  }

  async onChangeWeekStatus(newStatus: WeekStatus): Promise<void> {
    const week = this._selectedWeek();
    if (!week) return;

    this.saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.putWeekStatus$({ codeId: week.codeId, status: newStatus }),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.showChangeStatus.set(false);
        await this._loadAll();
      }
    } finally {
      this.saving.set(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  get selectedEmployee(): EmployeeAssignmentDTO | null { return this._selectedEmployee(); }
  get selectedWeek(): WeeklyProgress | null { return this._selectedWeek(); }

  readonly weekStatusOptions: WeekStatus[] = [
    'por-hacer', 'en-progreso', 'en-pausa', 'completada', 'cancelada', 'no-completado',
  ];

  trackByCode(_: number, emp: EmployeeAssignmentDTO): string {
    return emp.employee_Code;
  }
}
