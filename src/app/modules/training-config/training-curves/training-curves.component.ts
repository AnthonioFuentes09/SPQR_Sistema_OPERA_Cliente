import {
  Component, computed, inject, OnInit, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ButtonModule }      from 'primeng/button';
import { InputTextModule }   from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule }      from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule }     from 'primeng/tooltip';

import { TrainingConfigService }   from 'app/core/services/training-config/training-config.service';
import { ExceptionService }        from 'app/core/services/utils/exception.service';
import {
  CurveDto,
  BaseCurve_WeeksDto,
  OperationsCategoriesDto,
  OperationsDto,
} from 'app/core/interfaces/training-config/training-config.interface';

import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDialogComponent }             from 'app/shared/components/opera-dialog/opera-dialog.component';
import { OperaPageHeaderComponent }         from 'app/shared/components/opera-page-header/opera-page-header.component';
import { OperaActionsBarComponent }         from 'app/shared/components/opera-actions-bar/opera-actions-bar.component';
import { OperaFiltersComponent }            from 'app/shared/components/opera-filters/opera-filters.component';
import { BaseItemFilterOptions }            from 'app/core/interfaces/adm-sys/adm-sys.interface';

// ── Tipos de formulario ──────────────────────────────────────────────────────

interface WeekForm {
  level:             FormControl<number>;
  base_Hours:        FormControl<number>;
  target_Efficiency: FormControl<number>;
  canti_Pieces:      FormControl<number>;
  tolerance:         FormControl<number>;
}

interface CurveFormType {
  name_Curve:           FormControl<string>;
  description:          FormControl<string>;
  catExenta_AlphaNumId: FormControl<string>;
  isActive:             FormControl<boolean>;
  selectedWeeks:        FormArray<FormGroup<WeekForm>>;
}

@Component({
  selector: 'opera-training-curves-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ToggleSwitchModule,
    TooltipModule,
    OperaTableComponent,
    OperaDialogComponent,
    OperaPageHeaderComponent,
    OperaActionsBarComponent,
    OperaFiltersComponent,
  ],
  templateUrl: './training-curves.component.html',
  styleUrl: './training-curves.component.scss',
})
export class TrainingCurvesConfigComponent implements OnInit {

  private readonly _configService    = inject(TrainingConfigService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado global ────────────────────────────────────────────────────────
  private readonly _curves      = signal<CurveDto[]>([]);
  private readonly _categories  = signal<OperationsCategoriesDto[]>([]);
  private readonly _operations  = signal<OperationsDto[]>([]);
  private readonly _search      = signal<string>('');
  private readonly _catFilter   = signal<string[]>([]);

  readonly loading        = signal<boolean>(false);
  readonly saving         = signal<boolean>(false);
  readonly dialogVisible  = signal<boolean>(false);
  readonly editingCurve   = signal<CurveDto | null>(null);

  // ── Estado del modal ─────────────────────────────────────────────────────
  readonly operationsSearch    = signal<string>('');
  readonly selectedOperations  = signal<string[]>([]);
  // Necesario porque FormControl.value no es un Signal (computed no lo detecta)
  private readonly _selectedCategory = signal<string>('');
  readonly selectedCategory          = this._selectedCategory.asReadonly();

  // ── Computed ─────────────────────────────────────────────────────────────

  readonly filteredData = computed(() => {
    const q    = this._search().toLowerCase();
    const cats = this._catFilter();
    return this._curves().filter(c => {
      const matchCat = cats.length === 0 || cats.includes(c.catExenta_AlphaNumId);
      const matchQ   = !q
        || (c.code ?? '').toLowerCase().includes(q)
        || c.name_Curve.toLowerCase().includes(q)
        || (c.description ?? '').toLowerCase().includes(q)
        || c.catExenta_AlphaNumId.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  readonly categoryOptions = computed<BaseItemFilterOptions[]>(() =>
    [...new Set(this._curves().map(c => c.catExenta_AlphaNumId))]
      .map(id => ({ valueKey: id, description: id })),
  );

  readonly categorySelectOptions = computed(() =>
    this._categories().map(cat => ({ label: cat.alphaNumId, value: cat.alphaNumId })),
  );

  readonly filteredOperations = computed(() => {
    const cat  = this._selectedCategory();
    const term = this.operationsSearch().toLowerCase();
    if (!cat) return [];
    return this._operations()
      .filter(op => op.operationCategory_Name === cat)
      .filter(op =>
        !term ||
        op.alphaNumId.toLowerCase().includes(term) ||
        op.name_Oper.toLowerCase().includes(term),
      );
  });

  // ── Tabla ────────────────────────────────────────────────────────────────

  readonly columns: Column[] = [
    { field: 'code',                 header: 'Código',      type: 'text',    width: '150px', sortable: true },
    { field: 'name_Curve',           header: 'Nombre',      type: 'text',    sortable: true },
    { field: 'catExenta_AlphaNumId', header: 'Categoría',   type: 'badge',   width: '130px',
      badgeClass: () => 'status-badge en-proceso' },
    { field: 'canti_Semanas',        header: 'Semanas',     type: 'number',  width: '90px'  },
    { field: 'canti_Opers',          header: 'Operaciones', type: 'number',  width: '110px' },
    { field: 'isActive',             header: 'Estado',      type: 'boolean', width: '90px'  },
    {
      field: 'actions', header: 'Acciones', type: 'actions', width: '120px',
      actions: [
        { icon: 'fa-solid fa-pencil', tooltip: 'Editar',   color: 'primary', action: 'edit'   },
        { icon: 'fa-solid fa-trash',  tooltip: 'Eliminar', color: 'danger',  action: 'delete' },
      ],
    },
  ];

  // ── Formulario ────────────────────────────────────────────────────────────

  readonly curveForm = new FormGroup<CurveFormType>({
    name_Curve:           new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description:          new FormControl('', { nonNullable: true }),
    catExenta_AlphaNumId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    isActive:             new FormControl(true, { nonNullable: true }),
    selectedWeeks:        new FormArray<FormGroup<WeekForm>>([]),
  });

  get weeksArray(): FormArray<FormGroup<WeekForm>> {
    return this.curveForm.controls.selectedWeeks;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this._loadAll();
  }

  private async _loadAll(): Promise<void> {
    this.loading.set(true);
    try {
      const [curvesRes, categories, operations] = await Promise.all([
        firstValueFrom(this._configService.getCurves$()),
        firstValueFrom(this._configService.getCategories$()),
        firstValueFrom(this._configService.getOperationsByCategory$()),
      ]);
      if (curvesRes.success) this._curves.set(curvesRes.curves ?? []);
      this._categories.set(categories);
      this._operations.set(operations);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Handlers de la tabla ──────────────────────────────────────────────────

  onSearch(term: string): void { this._search.set(term); }

  onCategoryFilter(values: string[]): void { this._catFilter.set(values); }

  async onConsult(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this._configService.getCurves$());
      if (res.success) this._curves.set(res.curves ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Semanas (FormArray) ───────────────────────────────────────────────────

  private _buildWeekGroup(week?: Partial<BaseCurve_WeeksDto>): FormGroup<WeekForm> {
    const nextLevel = this.weeksArray.length + 1;
    return new FormGroup<WeekForm>({
      level:             new FormControl(week?.level ?? nextLevel,   { nonNullable: true }),
      base_Hours:        new FormControl(week?.base_Hours ?? 44,     { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      target_Efficiency: new FormControl(week?.target_Efficiency ?? 0, { nonNullable: true, validators: [Validators.required] }),
      canti_Pieces:      new FormControl(week?.canti_Pieces ?? 0,   { nonNullable: true, validators: [Validators.required] }),
      tolerance:         new FormControl(week?.tolerance ?? 10,      { nonNullable: true, validators: [Validators.required] }),
    });
  }

  addWeekRow(): void {
    this.weeksArray.push(this._buildWeekGroup());
  }

  onDeleteWeekRow(index: number): void {
    this.weeksArray.removeAt(index);
    // Renumber levels
    this.weeksArray.controls.forEach((g, i) => {
      g.controls.level.setValue(i + 1);
    });
  }

  // ── Operaciones (single-select) ───────────────────────────────────────────

  onOperationToggle(alphaNumId: string): void {
    const current = this.selectedOperations();
    const isSelected = current[0] === alphaNumId;
    this.selectedOperations.set(isSelected ? [] : [alphaNumId]);
  }

  isOperationSelected(alphaNumId: string): boolean {
    return this.selectedOperations()[0] === alphaNumId;
  }

  onCategoryChange(newCat: string): void {
    this._selectedCategory.set(newCat ?? '');
    this.selectedOperations.set([]);
    this.operationsSearch.set('');
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  openCreate(): void {
    this.editingCurve.set(null);
    this.weeksArray.clear();
    this.selectedOperations.set([]);
    this.operationsSearch.set('');
    this._selectedCategory.set('');
    this.curveForm.reset({ isActive: true });
    this.curveForm.controls.catExenta_AlphaNumId.enable();
    this.addWeekRow();
    this.dialogVisible.set(true);
  }

  onEdit(curve: CurveDto): void {
    this.editingCurve.set(curve);
    this.weeksArray.clear();
    this.selectedOperations.set([...(curve.selectedOperations ?? [])]);
    this.operationsSearch.set('');

    this.curveForm.patchValue({
      name_Curve:           curve.name_Curve,
      description:          curve.description ?? '',
      catExenta_AlphaNumId: curve.catExenta_AlphaNumId,
      isActive:             curve.isActive,
    });

    // Disable category on edit (same as PAYWEB) + sync signal
    this._selectedCategory.set(curve.catExenta_AlphaNumId);
    this.curveForm.controls.catExenta_AlphaNumId.disable();

    (curve.selectedWeeks ?? []).forEach(w => this.weeksArray.push(this._buildWeekGroup(w)));

    this.dialogVisible.set(true);
  }

  onCloseDialog(): void {
    this.dialogVisible.set(false);
    this.curveForm.controls.catExenta_AlphaNumId.enable();
    this._selectedCategory.set('');
    this.selectedOperations.set([]);
    this.weeksArray.clear();
  }

  async onDelete(curve: CurveDto): Promise<void> {
    const confirmed = await this._exceptionService.askConfirmation(
      `¿Eliminar la curva <b>${curve.code} - ${curve.name_Curve}</b>?`,
    );
    if (!confirmed) return;

    const res = await firstValueFrom(this._configService.deleteCurve$(curve.code!));
    this._exceptionService.showToastResult(res);
    if (res.success) {
      const updated = await firstValueFrom(this._configService.getCurves$());
      if (updated.success) this._curves.set(updated.curves);
    }
  }

  async onSave(): Promise<void> {
    if (this.curveForm.invalid) { this.curveForm.markAllAsTouched(); return; }
    if (this.selectedOperations().length === 0) {
      this._exceptionService.showError('Debe seleccionar al menos una operación.');
      return;
    }
    if (this.weeksArray.length === 0) {
      this._exceptionService.showError('Debe agregar al menos una semana.');
      return;
    }

    this.saving.set(true);
    try {
      const raw   = this.curveForm.getRawValue();
      const weeks = this.weeksArray.getRawValue() as BaseCurve_WeeksDto[];
      const body: Omit<CurveDto, 'code'> = {
        name_Curve:           raw.name_Curve,
        description:          raw.description,
        catExenta_AlphaNumId: raw.catExenta_AlphaNumId,
        isActive:             raw.isActive,
        selectedWeeks:        weeks,
        selectedOperations:   this.selectedOperations(),
        canti_Semanas:        weeks.length,
        canti_Opers:          this.selectedOperations().length,
      };

      const editing = this.editingCurve();
      const res = editing
        ? await firstValueFrom(this._configService.updateCurve$({ ...body, code: editing.code }))
        : await firstValueFrom(this._configService.createCurve$(body));

      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.onCloseDialog();
        const updated = await firstValueFrom(this._configService.getCurves$());
        if (updated.success) this._curves.set(updated.curves);
      }
    } finally {
      this.saving.set(false);
    }
  }
}
