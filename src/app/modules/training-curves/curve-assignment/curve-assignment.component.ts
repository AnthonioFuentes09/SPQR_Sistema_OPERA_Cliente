import {
  Component, computed, HostListener, inject,
  OnDestroy, OnInit, signal, ViewChild, ViewEncapsulation,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';

import { ButtonModule }          from 'primeng/button';
import { SelectModule }          from 'primeng/select';
import { InputTextModule }       from 'primeng/inputtext';
import { InputNumberModule }     from 'primeng/inputnumber';
import { TextareaModule }        from 'primeng/textarea';
import { TooltipModule }         from 'primeng/tooltip';
import { TagModule }             from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ListboxModule }         from 'primeng/listbox';
import { DatePickerModule }      from 'primeng/datepicker';
import { RadioButtonModule }     from 'primeng/radiobutton';
import { OverlayPanelModule }    from 'primeng/overlaypanel';
import { ContextMenuModule }     from 'primeng/contextmenu';
import { ContextMenu as PrimeCtxMenu } from 'primeng/contextmenu';
import { MenuItem }              from 'primeng/api';
import { DividerModule }         from 'primeng/divider';

import { TrainingCurvesService }  from 'app/core/services/training-curves/training-curves.service';
import { TrainingConfigService }  from 'app/core/services/training-config/training-config.service';
import { ExceptionService }       from 'app/core/services/utils/exception.service';
import {
  EmployeeTimelineDto,
  WeekCellDto,
  AssignmentProgressDto,
  WeeklyProgress,
  WeekStatus,
  CurveStatus,
  InstructorDto,
  ContextMenu,
  EmployeeInfo,
  EmployeeAssignment,
  UpdateConfigParams,
  AssignmentCurve_WeeksDto,
  PayWebCalendarWeek,
  CURVE_TYPE_LIST,
  CURVE_STATUS_LIST,
  WeekStatusType,
  CurveTypes,
  EmployeeAssignmentsFilterOpts,
} from 'app/core/interfaces/training-curves/training-curves.interface';
import { CurveDto }              from 'app/core/interfaces/training-config/training-config.interface';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { OperaDialogComponent }      from 'app/shared/components/opera-dialog/opera-dialog.component';
import { OperaFiltersComponent }     from 'app/shared/components/opera-filters/opera-filters.component';
import { OperaPageHeaderComponent }  from 'app/shared/components/opera-page-header/opera-page-header.component';
import { generateCalendarWeeks }     from 'app/core/services/utils/calendar-weeks.util';

// ── Typed FormGroups ───────────────────────────────────────────────────────────
interface AssignmentForm {
  date_Assignment: FormControl<Date>;
  employee_Code:   FormControl<string>;
  curve_Code:      FormControl<string>;
  curve_Version:   FormControl<string>;
  area_AlphaNumId: FormControl<string>;
  curveTypeCode:   FormControl<string>;
  statePeriod:     FormControl<string>;
  initialWeek:     FormControl<number>;
  finalWeek:       FormControl<number>;
  duration:        FormControl<number>;
  lvlStart:        FormControl<number>;
  comments:        FormControl<string>;
}
interface ChangeStatusForm {
  newStatePeriod: FormControl<string>;
  comments:       FormControl<string>;
}
interface InstructorForm {
  trainer_Code: FormControl<string>;
}
interface CommentForm {
  comment: FormControl<string>;
}

@Component({
  selector: 'opera-curve-assignment',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DatePipe,
    ButtonModule, SelectModule, InputTextModule, InputNumberModule,
    TextareaModule, TooltipModule, TagModule, ProgressSpinnerModule,
    ListboxModule, DatePickerModule, RadioButtonModule, OverlayPanelModule,
    DividerModule,
    OperaDialogComponent, OperaFiltersComponent, OperaPageHeaderComponent,
    ContextMenuModule,
  ],
  templateUrl: './curve-assignment.component.html',
  styleUrl: './curve-assignment.component.scss',
})
export class CurveAssignmentComponent implements OnInit, OnDestroy {

  private readonly _trainingService  = inject(TrainingCurvesService);
  private readonly _configService    = inject(TrainingConfigService);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _unsubscribeAll      = new Subject<void>();
  private readonly _unsubscribeWeekRows = new Subject<void>();

  @ViewChild('weekCtxMenu') weekCtxMenu!: PrimeCtxMenu;
  @ViewChild('empCtxMenu')  empCtxMenu!:  PrimeCtxMenu;

  // ── HostListeners ───────────────────────────────────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const t = event.target as HTMLElement;
    if (this._showLegendPopover() && !t.closest('.ca-legend-wrap')) this._showLegendPopover.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.weekCtxMenu?.hide();
    this.empCtxMenu?.hide();
    this._contextMenu.set(null);
    this._empContextMenu.set(null);
    this._showLegendPopover.set(false);
  }


  // ── Señales de estado ───────────────────────────────────────────────────
  private readonly _currentYear     = signal<number>(new Date().getFullYear());
  private readonly _currentSemester = signal<1 | 2 | 0>(1);
  private readonly _loading         = signal<boolean>(false);
  private readonly _saving          = signal<boolean>(false);
  private readonly _searchTerm      = signal<string>('');
  private readonly _allTimelines    = signal<EmployeeTimelineDto[]>([]);
  private readonly _calendarWeeks   = signal<PayWebCalendarWeek[]>([]);
  private readonly _curvesList      = signal<CurveDto[]>([]);
  private readonly _instructors     = signal<InstructorDto[]>([]);
  private readonly _filterAreas         = signal<string[]>([]);
  private readonly _filterInstructors   = signal<string[]>([]);
  private readonly _filterCurveTypes    = signal<string[]>([]);
  private readonly _filterCategories    = signal<string[]>([]);
  private readonly _showFilters         = signal<boolean>(true);
  private readonly _showLegendPopover   = signal<boolean>(false);
  private readonly _filterOpts          = signal<EmployeeAssignmentsFilterOpts | null>(null);
  private readonly _contextMenu         = signal<ContextMenu | null>(null);
  private readonly _empContextMenu      = signal<EmployeeInfo | null>(null);
  private readonly _selectedAssignment  = signal<AssignmentProgressDto | null>(null);
  private readonly _selectedWeekProgress = signal<WeeklyProgress[]>([]);
  private readonly _currentWP           = signal<WeeklyProgress | null>(null);
  private readonly _instructorDialogRow = signal<EmployeeTimelineDto | null>(null);
  private readonly _selectedCurve       = signal<CurveDto | null>(null);
  private readonly _deleteId            = signal<number>(0);
  private readonly _deleteEmpCode       = signal<string>('');
  private readonly _empOverlayRow       = signal<EmployeeTimelineDto | null>(null);

  // ── Paginación ──────────────────────────────────────────────────────────
  readonly pageSize  = signal<number>(20);
  readonly pageIndex = signal<number>(0);

  // ── Modales ─────────────────────────────────────────────────────────────
  readonly showAssignment         = signal<boolean>(false);
  readonly showManageWeeks        = signal<boolean>(false);
  readonly showInstructorComment  = signal<boolean>(false);
  readonly showRequestedWeeks     = signal<boolean>(false);
  readonly showInstructor         = signal<boolean>(false);
  readonly showChangeStatus       = signal<boolean>(false);
  readonly showDelete             = signal<boolean>(false);

  // ── Datos de modal de gestión de semanas ────────────────────────────────
  readonly editableWeeks   = signal<AssignmentCurve_WeeksDto[]>([]);
  readonly managementCurve = signal<CurveDto | null>(null);
  readonly isInitialWeekReadonly = signal<boolean>(false);
  modalTitle = '';

  // ── Listas de referencia ────────────────────────────────────────────────
  readonly curveTypes: CurveTypes[]         = CURVE_TYPE_LIST;
  readonly curveStatusList: WeekStatusType[] = CURVE_STATUS_LIST;

  // ── Públicos (readonly) ─────────────────────────────────────────────────
  readonly loading              = this._loading.asReadonly();
  readonly saving               = this._saving.asReadonly();
  readonly currentYear          = this._currentYear.asReadonly();
  readonly currentSemester      = this._currentSemester.asReadonly();
  readonly calendarWeeks        = this._calendarWeeks.asReadonly();
  readonly contextMenu          = this._contextMenu.asReadonly();
  readonly empContextMenu       = this._empContextMenu.asReadonly();
  readonly selectedAssignment   = this._selectedAssignment.asReadonly();
  readonly selectedWeekProgress = this._selectedWeekProgress.asReadonly();
  readonly currentWP            = this._currentWP.asReadonly();
  readonly instructorDialogRow  = this._instructorDialogRow.asReadonly();
  readonly selectedCurve        = this._selectedCurve.asReadonly();
  readonly searchTerm           = this._searchTerm.asReadonly();
  readonly showFiltersBar       = this._showFilters.asReadonly();
  readonly showLegendPopover    = this._showLegendPopover.asReadonly();
  readonly filterOpts           = this._filterOpts.asReadonly();
  readonly empOverlayRow        = this._empOverlayRow.asReadonly();

  // ── Computed ────────────────────────────────────────────────────────────
  readonly filteredTimelines = computed<EmployeeTimelineDto[]>(() => {
    const q      = this._searchTerm().toLowerCase();
    const areas  = this._filterAreas();
    const instrs = this._filterInstructors();
    const ctypes = this._filterCurveTypes();
    const cats   = this._filterCategories();
    return this._allTimelines().filter(row => {
      const ms = !q ||
        row.employee_Code.toLowerCase().includes(q) ||
        row.employee_Name.toLowerCase().includes(q) ||
        row.area_AlphaNumId.toLowerCase().includes(q);
      const ma = !areas.length  || areas.includes(row.area_AlphaNumId);
      const mi = !instrs.length || instrs.includes(row.trainer_Code);
      const mt = !ctypes.length || ctypes.includes(row.curveTypeCode);
      const mc = !cats.length   || cats.includes(row.userCategory_Code);
      return ms && ma && mi && mt && mc;
    });
  });

  readonly filteredCount = computed(() => this.filteredTimelines().length);
  readonly totalPages    = computed(() => Math.ceil(this.filteredCount() / this.pageSize()));
  readonly subtitle      = computed(() => `Registros: ${this.filteredCount()}`);

  readonly weekMenuItems = computed<MenuItem[]>(() => {
    const ctx = this._contextMenu();
    return [
      { label: ctx?.assignment.employee_Name ?? '',  styleClass: 'ctx-header-name',  disabled: true },
      { label: ctx?.assignment.curve_Name    ?? '',  styleClass: 'ctx-header-curve', disabled: true },
      { separator: true },
      { label: 'Curva Exenta',     icon: 'pi pi-calendar',      command: () => this.openManageWeeks()        },
      { label: 'Mover Semana',     icon: 'pi pi-arrows-h',      command: () => this.openInstructorComments() },
      { label: 'Ver Solicitudes',  icon: 'pi pi-list',          command: () => this.openRequestedWeeks()     },
      { separator: true },
      { label: 'Actualizar Estado',icon: 'pi pi-sync',          command: () => this.openChangeStatus()       },
      { label: 'Eliminar Curva',   icon: 'pi pi-trash',         styleClass: 'ctx-danger-item', command: () => this.openDeleteFromCtx() },
    ];
  });

  readonly empMenuItems = computed<MenuItem[]>(() => {
    const emp = this._empContextMenu();
    return [
      { label: emp?.empItem?.employee_Name ?? '', styleClass: 'ctx-header-name',  disabled: true },
      { label: emp?.empItem?.employee_Code ?? '', styleClass: 'ctx-header-curve', disabled: true },
      { separator: true },
      { label: 'Asignar Curva',      icon: 'pi pi-plus',      command: () => this.openAssignmentFromEmployee() },
      { label: 'Cambiar Instructor', icon: 'pi pi-user-edit', command: () => this.openInstructorModal()        },
    ];
  });

  readonly semesterLabel = computed<string>(() => {
    const sem = this._currentSemester();
    const yr  = this._currentYear();
    if (sem === 0) return `Año completo ${yr}`;
    if (sem === 1) return `Enero - Junio ${yr}`;
    return `Julio - Diciembre ${yr}`;
  });

  readonly paginatedRows = computed<EmployeeTimelineDto[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredTimelines().slice(start, start + this.pageSize());
  });

  readonly curveSelectOpts = computed<CurveDto[]>(() => this._curvesList());

  readonly areaFilterOpts = computed<BaseItemFilterOptions[]>(() => {
    const s = new Set(this._allTimelines().map(r => r.area_AlphaNumId).filter(Boolean));
    return [...s].map(v => ({ valueKey: v, description: v }));
  });

  readonly instructorFilterOpts = computed<BaseItemFilterOptions[]>(() => {
    const m = new Map<string, string>();
    this._allTimelines().filter(r => r.hasInstructor).forEach(r => m.set(r.trainer_Code, r.trainer_Name));
    return [...m.entries()].map(([k, v]) => ({ valueKey: k, description: v }));
  });

  readonly curveTypeFilterOpts = computed<BaseItemFilterOptions[]>(() => {
    const s = new Set(this._allTimelines().map(r => r.curveTypeCode).filter(Boolean));
    return [...s].map(v => ({ valueKey: v, description: v }));
  });

  readonly instructorSelectOpts = computed<{ label: string; value: string }[]>(() => [
    { label: 'Sin asignar', value: '' },
    ...this._instructors().map(i => ({ label: `${i.trainer_Code} | ${i.trainer_Name}`, value: i.trainer_Code })),
  ]);

  readonly statusSelectOpts = CURVE_STATUS_LIST.map(s => ({ label: s.description, value: s.status }));

  // ── Formularios ─────────────────────────────────────────────────────────
  readonly assignmentForm = new FormGroup<AssignmentForm>({
    date_Assignment: new FormControl(new Date(), { nonNullable: true, validators: [Validators.required] }),
    employee_Code:   new FormControl('',         { nonNullable: true }),
    curve_Code:      new FormControl('',         { nonNullable: true, validators: [Validators.required] }),
    curve_Version:   new FormControl('1',        { nonNullable: true }),
    area_AlphaNumId: new FormControl('',         { nonNullable: true, validators: [Validators.required] }),
    curveTypeCode:   new FormControl('',         { nonNullable: true }),
    statePeriod:     new FormControl('en-proceso', { nonNullable: true }),
    initialWeek:     new FormControl(0,          { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    finalWeek:       new FormControl(0,          { nonNullable: true }),
    duration:        new FormControl(0,          { nonNullable: true, validators: [Validators.min(1)] }),
    lvlStart:        new FormControl(1,          { nonNullable: true }),
    comments:        new FormControl('',         { nonNullable: true }),
  });

  readonly changeStatusForm = new FormGroup<ChangeStatusForm>({
    newStatePeriod: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    comments:       new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(5)] }),
  });

  readonly instructorForm = new FormGroup<InstructorForm>({
    trainer_Code: new FormControl('', { nonNullable: true }),
  });

  readonly commentForm = new FormGroup<CommentForm>({
    comment: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
  });

  // ── Opciones de UI ───────────────────────────────────────────────────────
  readonly semesterBtns = [
    { label: 'S1', value: 1 as const },
    { label: 'S2', value: 2 as const },
    { label: 'AÑO', value: 0 as const },
  ];

  readonly yearOpts = [2024, 2025, 2026, 2027].map(y => ({ label: String(y), value: y }));

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // finalWeek auto-calculado
    this.assignmentForm.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(v => {
        const init = Number(v.initialWeek) || 0;
        const dur  = Number(v.duration)    || 0;
        if (init > 0 && dur > 0) {
          let final = init + dur - 1;
          if (final > 52) final -= 52;
          this.assignmentForm.controls.finalWeek.setValue(final, { emitEvent: false });
        }
      });

    this._loadAll();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
    this._unsubscribeWeekRows.next();
    this._unsubscribeWeekRows.complete();
  }

  // ── Carga ────────────────────────────────────────────────────────────────
  private _loadAll(): void {
    this._loading.set(true);
    const year = this._currentYear();
    const sem  = this._currentSemester();

    this._calendarWeeks.set(generateCalendarWeeks(year, sem === 0 ? 1 : sem));

    this._trainingService.getEmployeeTimelines$(year, sem)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: res => {
          this._allTimelines.set(res.employeeTimelines ?? []);
          if (res.ea_FilterOpts) this._filterOpts.set(res.ea_FilterOpts);
          this.pageIndex.set(0);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      });

    this._configService.getCurves$()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(res => this._curvesList.set(res.curves.filter(c => c.isActive)));

    this._trainingService.getInstructors$()
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(list => this._instructors.set(list ?? []));
  }

  reload(): void { this._loadAll(); }

  // ── Semestre / Año ───────────────────────────────────────────────────────
  onSemesterChange(sem: 1 | 2 | 0): void { this._currentSemester.set(sem); this._loadAll(); }
  onYearChange(year: number): void        { this._currentYear.set(year);    this._loadAll(); }

  // ── Filtros ──────────────────────────────────────────────────────────────
  onSearchChange(t: string): void         { this._searchTerm.set(t);    this.pageIndex.set(0); }
  onFilterAreas(v: string[]): void        { this._filterAreas.set(v);   this.pageIndex.set(0); }
  onFilterInstructors(v: string[]): void  { this._filterInstructors.set(v); this.pageIndex.set(0); }
  onFilterCurveTypes(v: string[]): void   { this._filterCurveTypes.set(v);  this.pageIndex.set(0); }
  onFilterCategories(v: string[]): void   { this._filterCategories.set(v);  this.pageIndex.set(0); }
  onToggleFilters(show: boolean): void    { this._showFilters.set(show); }

  // ── Leyenda ──────────────────────────────────────────────────────────────
  toggleLegendPopover(): void  { this._showLegendPopover.update(v => !v); }
  closeLegendPopover(): void   { this._showLegendPopover.set(false); }

  // ── Paginación ───────────────────────────────────────────────────────────
  onPrevPage(): void { if (this.pageIndex() > 0)                       this.pageIndex.update(p => p - 1); }
  onNextPage(): void { if (this.pageIndex() < this.totalPages() - 1)   this.pageIndex.update(p => p + 1); }

  // ── trackBy ──────────────────────────────────────────────────────────────
  trackByRow(_: number, row: EmployeeTimelineDto): string {
    return `${row.employee_Code}_${row.area_AlphaNumId}_${row.curveTypeCode}`;
  }

  // ── Celdas de semana — click ─────────────────────────────────────────────
  onWeekCellClick(event: MouseEvent, row: EmployeeTimelineDto, cell: WeekCellDto, overlay: { toggle: (e: Event) => void }): void {
    event.stopPropagation();
    this._contextMenu.set(null);

    if (cell.hasAssignment && cell.weeklyProgress) {
      const assignDto = row.assignments.find(a => a.assignmentCodeId === cell.weeklyProgress!.assignment_CodeId);
      if (assignDto) {
        this._selectedAssignment.set(assignDto);
        this._currentWP.set(cell.weeklyProgress);
        overlay.toggle(event);
      }
      return;
    }

    if (cell.isPastWeek) return;
    if (!row.hasInstructor) return;
    this._openAssignmentModal(row, cell.weekNumber);
  }

  // ── Celdas de semana — right click ──────────────────────────────────────
  onWeekCellRightClick(event: MouseEvent, row: EmployeeTimelineDto, cell: WeekCellDto): void {
    event.preventDefault();
    event.stopPropagation();
    this._empContextMenu.set(null);
    if (!cell.hasAssignment || !cell.weeklyProgress || cell.isPastWeek) return;

    const assignId  = cell.weeklyProgress.assignment_CodeId;
    const assignDto = row.assignments.find(a => a.assignmentCodeId === assignId);
    if (!assignDto) return;

    const weeklyList = row.weeks
      .filter(w => w.weeklyProgress?.assignment_CodeId === assignId)
      .map(w => w.weeklyProgress!);

    this._contextMenu.set({
      x: event.clientX, y: event.clientY,
      assignment:            assignDto,
      weeklyProgress:        weeklyList,
      currentWeeklyProgress: cell.weeklyProgress,
    });
    this.weekCtxMenu.show(event);
  }

  // ── Empleado — right click ────────────────────────────────────────────────
  onEmployeeCellRightClick(event: MouseEvent, row: EmployeeTimelineDto): void {
    event.preventDefault();
    event.stopPropagation();
    this._contextMenu.set(null);
    this._empContextMenu.set({ x: event.clientX, y: event.clientY, empItem: row });
    this.empCtxMenu.show(event);
  }


  // ── Empleado — click en ícono (abre popover de detalle) ──────────────────
  onEmployeeIconClick(event: MouseEvent, row: EmployeeTimelineDto, overlay: { toggle: (e: Event) => void }): void {
    event.stopPropagation();
    this._empOverlayRow.set(row);
    overlay.toggle(event);
  }

  // ── Menú contextual de semana ─────────────────────────────────────────────
  openManageWeeks(): void {
    const ctx = this._contextMenu();
    if (!ctx) return;
    this._contextMenu.set(null);
    this._unsubscribeWeekRows.next();

    this._selectedAssignment.set(ctx.assignment);
    this._selectedWeekProgress.set(ctx.weeklyProgress);
    this.managementCurve.set(
      this._curvesList().find(c => c.code === ctx.assignment.curve_Code) ?? null,
    );
    this.editableWeeks.set(ctx.weeklyProgress.map(wp => ({
      codeId:            wp.codeId,
      assignment_Year:   wp.assignment_Year,
      assignment_Month:  wp.assignment_Month,
      assignment_Week:   wp.assignment_Week,
      curve_Level:       wp.curve_Level,
      base_Hours:        wp.base_Hours,
      target_Efficiency: wp.target_Efficiency,
      weekState:         wp.weekState,
      comments:          wp.comments,
    })));
    this.modalTitle = `Administrar Semanas — ${ctx.assignment.employee_Code} | ${ctx.assignment.employee_Name}`;
    this.showManageWeeks.set(true);
  }

  openInstructorComments(): void {
    const ctx = this._contextMenu();
    if (!ctx?.currentWeeklyProgress) return;
    this._contextMenu.set(null);
    this._currentWP.set(ctx.currentWeeklyProgress);
    this._selectedAssignment.set(ctx.assignment);
    this.commentForm.reset({ comment: ctx.currentWeeklyProgress.instructorComments || '' });
    this.modalTitle = `Comentario — Semana ${ctx.currentWeeklyProgress.assignment_Week}`;
    this.showInstructorComment.set(true);
  }

  openRequestedWeeks(): void {
    const ctx = this._contextMenu();
    if (!ctx) return;
    this._contextMenu.set(null);
    this._selectedAssignment.set(ctx.assignment);
    this.modalTitle = `Solicitudes — ${ctx.assignment.employee_Name}`;
    this.showRequestedWeeks.set(true);
  }

  openChangeStatus(): void {
    const ctx = this._contextMenu();
    if (!ctx) return;
    this._contextMenu.set(null);
    this._selectedAssignment.set(ctx.assignment);
    this._currentWP.set(ctx.currentWeeklyProgress);
    this.changeStatusForm.reset({ newStatePeriod: ctx.assignment.statePeriod, comments: '' });
    this.modalTitle = `Cambiar Estado — ${ctx.assignment.employee_Name}`;
    this.showChangeStatus.set(true);
  }

  openDeleteFromCtx(): void {
    const ctx = this._contextMenu();
    if (!ctx) return;
    this._contextMenu.set(null);
    this._selectedAssignment.set(ctx.assignment);
    this._deleteId.set(ctx.assignment.assignmentCodeId);
    this._deleteEmpCode.set(ctx.assignment.employee_Code);
    this.modalTitle = `Eliminar Asignación`;
    this.showDelete.set(true);
  }

  // ── Menú contextual de empleado ──────────────────────────────────────────
  openAssignmentFromEmployee(): void {
    const emp = this._empContextMenu()?.empItem ?? this._empOverlayRow();
    this._empContextMenu.set(null);
    this._empOverlayRow.set(null);
    if (!emp) return;
    if (!emp.hasInstructor) return;
    this._openAssignmentModal(emp);
  }

  openInstructorModal(): void {
    const row = this._empContextMenu()?.empItem ?? this._empOverlayRow();
    this._empContextMenu.set(null);
    this._empOverlayRow.set(null);
    if (!row) return;
    this._instructorDialogRow.set(row);
    this.instructorForm.reset({ trainer_Code: row.trainer_Code });
    this.modalTitle = `Asignar Instructor — ${row.employee_Name}`;
    this.showInstructor.set(true);
  }

  private _openAssignmentModal(row: EmployeeTimelineDto, initialWeek?: number): void {
    this._selectedCurve.set(null);
    this.assignmentForm.reset({
      date_Assignment: new Date(),
      employee_Code:   row.employee_Code,
      curve_Code:      '',
      curve_Version:   '1',
      area_AlphaNumId: row.area_AlphaNumId || '',
      curveTypeCode:   row.curveTypeCode || row.userCategory_Code,
      statePeriod:     'en-proceso',
      initialWeek:     initialWeek ?? 0,
      finalWeek:       0,
      duration:        0,
      lvlStart:        1,
      comments:        '',
    });
    this.isInitialWeekReadonly.set(!!initialWeek);
    this.modalTitle = `Asignar Curva — ${row.employee_Code} | ${row.employee_Name}`;
    this.showAssignment.set(true);
  }

  // ── Selección de curva ───────────────────────────────────────────────────
  onSelectCurve(curve: CurveDto | null): void {
    if (!curve) { this._selectedCurve.set(null); return; }
    this._selectedCurve.set(curve);
    this.assignmentForm.patchValue({
      curve_Code:    curve.code ?? '',
      curve_Version: '1',
      duration:      curve.canti_Semanas ?? 0,
    });
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async onSaveAssignment(): Promise<void> {
    if (this.assignmentForm.invalid) { this.assignmentForm.markAllAsTouched(); return; }
    this._saving.set(true);
    try {
      const f = this.assignmentForm.getRawValue();
      const body: EmployeeAssignment = {
        date_Assignment: (f.date_Assignment instanceof Date ? f.date_Assignment : new Date()).toISOString(),
        employee_Code:   f.employee_Code,
        employee_Name:   '',
        curve_Code:      f.curve_Code,
        curve_Version:   f.curve_Version,
        area_AlphaNumId: f.area_AlphaNumId,
        statePeriod:     f.statePeriod,
        initialWeek:     f.initialWeek,
        finalWeek:       f.finalWeek,
        duration:        f.duration,
        lvlStart:        f.lvlStart,
        comments:        f.comments,
        curveTypeCode:   f.curveTypeCode,
        curveWeeks:      this._selectedCurve()?.selectedWeeks ?? [],
      };
      const res = await firstValueFrom(this._trainingService.createAssignment$(body));
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showAssignment.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  async onSaveWeeksConfig(): Promise<void> {
    const assign = this._selectedAssignment();
    if (!assign) return;
    this._saving.set(true);
    try {
      const params: UpdateConfigParams = {
        codeId:          assign.assignmentCodeId,
        employee_Code:   assign.employee_Code,
        date_Assignment: assign.date_Assignment,
        curve_Code:      assign.curve_Code,
        curve_Version:   assign.curve_Version,
        area_AlphaNumId: assign.area_AlphaNumId,
        curveWeeks:      this.editableWeeks(),
      };
      const res = await firstValueFrom(this._trainingService.updateWeeksConfig$(params));
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showManageWeeks.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  async onSaveComment(): Promise<void> {
    if (this.commentForm.invalid) { this.commentForm.markAllAsTouched(); return; }
    const wp = this._currentWP();
    const assign = this._selectedAssignment();
    if (!wp || !assign) return;
    this._saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.saveInstructorComment$(
          assign.assignmentCodeId, wp.assignment_Week, this.commentForm.getRawValue().comment,
        ),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showInstructorComment.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  async onSaveChangeStatus(): Promise<void> {
    if (this.changeStatusForm.invalid) { this.changeStatusForm.markAllAsTouched(); return; }
    const assign = this._selectedAssignment();
    if (!assign) return;
    this._saving.set(true);
    try {
      const f = this.changeStatusForm.getRawValue();
      const res = await firstValueFrom(
        this._trainingService.updateAssignmentStatus$(
          assign.assignmentCodeId, f.newStatePeriod as CurveStatus,
        ),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showChangeStatus.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  async onSaveInstructor(): Promise<void> {
    const row = this._instructorDialogRow();
    if (!row) return;
    this._saving.set(true);
    try {
      const trCode  = this.instructorForm.getRawValue().trainer_Code;
      const instr   = this._instructors().find(i => i.trainer_Code === trCode);
      const res = await firstValueFrom(
        this._trainingService.assignTrainer$(row.employee_Code, trCode, instr?.trainer_Name ?? ''),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showInstructor.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  async onConfirmDelete(): Promise<void> {
    this._saving.set(true);
    try {
      const res = await firstValueFrom(
        this._trainingService.deleteAssignment$(this._deleteId(), this._deleteEmpCode()),
      );
      this._exceptionService.showToastResult(res);
      if (res.success) { this.showDelete.set(false); this._loadAll(); }
    } finally { this._saving.set(false); }
  }

  // ── Semanas editables ────────────────────────────────────────────────────
  removeEditableWeek(index: number): void {
    this.editableWeeks.update(ws => {
      const copy = [...ws];
      copy[index] = { ...copy[index], weekState: 'canceled' };
      return copy;
    });
  }

  restoreEditableWeek(index: number): void {
    this.editableWeeks.update(ws => {
      const copy = [...ws];
      copy[index] = { ...copy[index], weekState: 'none' };
      return copy;
    });
  }

  // ── Helpers de template ──────────────────────────────────────────────────
  getCurveStatusClass(status: CurveStatus): string {
    const map: Partial<Record<CurveStatus, string>> = {
      'completada':    'status-completada',
      'en-proceso':    'status-en-proceso',
      'en-pausa':      'status-en-pausa',
      'cancelada':     'status-cancelada',
      'no-completada': 'status-no-completada',
      'planificada':   'status-planificada',
    };
    return map[status] ?? '';
  }

  getWeekDateLabel(weekNum: number): string {
    const w = this._calendarWeeks().find(c => c.weekNumber === weekNum);
    if (!w) return '';
    const d = w.initialDate;
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}
