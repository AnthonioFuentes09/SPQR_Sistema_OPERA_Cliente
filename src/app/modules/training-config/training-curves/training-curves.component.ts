import {
  Component, inject, OnInit, signal, computed, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TrainingConfigService } from 'app/core/services/training-config/training-config.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { CurveDto, BaseCurve_WeeksDto } from 'app/core/interfaces/training-config/training-config.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDialogComponent } from 'app/shared/components/opera-dialog/opera-dialog.component';

interface WeekForm {
  week_Number:        FormControl<number>;
  curve_Level:        FormControl<number>;
  target_Efficiency:  FormControl<number>;
  base_Hours:         FormControl<number>;
  base_Pieces:        FormControl<number>;
}

interface CurveForm {
  curve_Description: FormControl<string>;
  curve_Version: FormControl<number>;
  weeks:         FormArray<FormGroup<WeekForm>>;
}

@Component({
  selector: 'opera-training-curves-config',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule,
    TableModule, TooltipModule, TagModule, ProgressSpinnerModule,
    OperaTableComponent, OperaDialogComponent,
  ],
  templateUrl: './training-curves.component.html',
  styleUrl: './training-curves.component.scss',
})
export class TrainingCurvesConfigComponent implements OnInit {
  private readonly _configService    = inject(TrainingConfigService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _curves = signal<CurveDto[]>([]);

  readonly loading       = signal<boolean>(false);
  readonly saving        = signal<boolean>(false);
  readonly dialogVisible = signal<boolean>(false);
  readonly isEditing     = signal<boolean>(false);
  readonly curves        = this._curves.asReadonly();

  // ── Tabla ──────────────────────────────────────────────────────────────
  readonly columns: Column[] = [
    { field: 'curve_Code',    header: 'Código',  type: 'text',    width: '140px', sortable: true },
    { field: 'curve_Name',    header: 'Nombre',  type: 'text',    sortable: true },
    { field: 'curve_Version', header: 'Versión', type: 'number',  width: '90px' },
    { field: 'total_Weeks',   header: 'Semanas', type: 'number',  width: '90px' },
    { field: 'actions',       header: 'Acciones', type: 'actions', width: '100px' },
  ];

  // ── Formulario ──────────────────────────────────────────────────────────
  readonly form = new FormGroup<CurveForm>({
    curve_Description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    curve_Version: new FormControl(1,  { nonNullable: true, validators: [Validators.required] }),
    weeks:         new FormArray<FormGroup<WeekForm>>([]),
  });

  get weeksArray(): FormArray<FormGroup<WeekForm>> {
    return this.form.controls.weeks;
  }

  private _editingCode: string | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadCurves();
  }

  private async _loadCurves(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this._configService.getCurves$());
      if (res.success) this._curves.set(res.curves ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Weeks FormArray helpers ───────────────────────────────────────────
  private _buildWeekGroup(week?: Partial<BaseCurve_WeeksDto>): FormGroup<WeekForm> {
    return new FormGroup<WeekForm>({
      week_Number:       new FormControl(week?.week_Number ?? (this.weeksArray.length + 1), { nonNullable: true }),
      curve_Level:       new FormControl(week?.curve_Level ?? 1, { nonNullable: true }),
      target_Efficiency: new FormControl(week?.target_Efficiency ?? 0, { nonNullable: true }),
      base_Hours:        new FormControl(week?.base_Hours ?? 40, { nonNullable: true }),
      base_Pieces:       new FormControl(week?.base_Pieces ?? 0, { nonNullable: true }),
    });
  }

  addWeek(): void {
    this.weeksArray.push(this._buildWeekGroup());
  }

  removeWeek(index: number): void {
    this.weeksArray.removeAt(index);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.isEditing.set(false);
    this._editingCode = null;
    this.weeksArray.clear();
    this.form.reset({ curve_Description: '', curve_Version: 1 });
    this.addWeek();
    this.dialogVisible.set(true);
  }

  onEdit(curve: CurveDto): void {
    this.isEditing.set(true);
    this._editingCode = curve.curve_Code;
    this.weeksArray.clear();
    this.form.patchValue({ curve_Description: curve.curve_Description, curve_Version: curve.curve_Version });
    (curve.weeks ?? []).forEach(w => this.weeksArray.push(this._buildWeekGroup(w)));
    this.dialogVisible.set(true);
  }

  async onDelete(curve: CurveDto): Promise<void> {
    const confirmed = await this._exceptionService.askConfirmation(
      `¿Eliminar la curva <b>${curve.curve_Code}</b>?`,
    );
    if (!confirmed) return;
    // Eliminar todas las semanas de la primera operación (simplificado)
    // En producción se haría por cada semana/nivel
    this._exceptionService.showSuccess('Curva eliminada (mock)');
    await this._loadCurves();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    try {
      const { curve_Description, curve_Version, weeks } = this.form.getRawValue();
      const body: Partial<CurveDto> = {
        curve_Description,
        curve_Version,
        weeks: (weeks as Array<{ week_Number: number; curve_Level: number; target_Efficiency: number; base_Hours: number; base_Pieces: number }>).map(w => ({ week_Number: w.week_Number, curve_Level: w.curve_Level, target_Efficiency: w.target_Efficiency, base_Hours: w.base_Hours, base_Pieces: w.base_Pieces })) as BaseCurve_WeeksDto[],
      };

      const res = this.isEditing() && this._editingCode
        ? await firstValueFrom(this._configService.updateCurve$({ ...body, curve_Code: this._editingCode } as CurveDto))
        : await firstValueFrom(this._configService.createCurve$(body as Omit<CurveDto, 'curve_Code'>));

      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.dialogVisible.set(false);
        await this._loadCurves();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
