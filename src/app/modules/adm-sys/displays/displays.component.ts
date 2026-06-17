import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { DisplayDTO } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDialogComponent } from 'app/shared/components/opera-dialog/opera-dialog.component';

interface DisplayForm {
  display_Code:        FormControl<string>;
  display_Name:        FormControl<string>;
  display_Route:       FormControl<string>;
  display_Icon:        FormControl<string>;
}

@Component({
  selector: 'opera-displays',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, OperaTableComponent, OperaDialogComponent],
  templateUrl: './displays.component.html',
  styleUrl: './displays.component.scss',
})
export class DisplaysComponent implements OnInit {
  private readonly _exceptionService = inject(ExceptionService);

  private readonly _displays = signal<DisplayDTO[]>([]);
  readonly loading       = signal<boolean>(false);
  readonly saving        = signal<boolean>(false);
  readonly dialogVisible = signal<boolean>(false);
  readonly isEditing     = signal<boolean>(false);
  readonly displays      = this._displays.asReadonly();

  readonly columns: Column[] = [
    { field: 'display_Code',  header: 'Código',   type: 'text', width: '120px' },
    { field: 'display_Name',  header: 'Nombre',   type: 'text', sortable: true },
    { field: 'display_Route', header: 'Ruta',     type: 'text' },
    { field: 'display_Icon',  header: 'Ícono',    type: 'text', width: '120px' },
    { field: 'actions',       header: 'Acciones', type: 'actions', width: '100px' },
  ];

  readonly form = new FormGroup<DisplayForm>({
    display_Code:  new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    display_Name:  new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    display_Route: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    display_Icon:  new FormControl('', { nonNullable: true }),
  });

  private _editingCode: string | null = null;

  ngOnInit(): void {
    this._displays.set([
      { display_Id: 1, display_Code: 'SEC', display_Name: 'Seguridad',     display_Description: 'Módulo de seguridad',      display_Route: '/security', display_Icon: 'pi pi-shield',     is_Active: true, is_Deleted: false },
      { display_Id: 2, display_Code: 'TRN', display_Name: 'Entrenamiento', display_Description: 'Módulo de entrenamiento',  display_Route: '/training', display_Icon: 'pi pi-chart-line', is_Active: true, is_Deleted: false },
      { display_Id: 3, display_Code: 'ADM', display_Name: 'Administración', display_Description: 'Módulo de administración', display_Route: '/adm-sys',  display_Icon: 'pi pi-cog',       is_Active: true, is_Deleted: false },
    ]);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this._editingCode = null;
    this.form.reset();
    this.dialogVisible.set(true);
  }

  onEdit(d: DisplayDTO): void {
    this.isEditing.set(true);
    this._editingCode = d.display_Code;
    this.form.patchValue({
      display_Code:  d.display_Code,
      display_Name:  d.display_Name ?? '',
      display_Route: d.display_Route,
      display_Icon:  d.display_Icon ?? '',
    });
    this.dialogVisible.set(true);
  }

  async onDelete(d: DisplayDTO): Promise<void> {
    const ok = await this._exceptionService.askConfirmation(
      `¿Eliminar display <b>${d.display_Name ?? d.display_Code}</b>?`,
    );
    if (!ok) return;
    this._displays.update(list => list.filter(x => x.display_Code !== d.display_Code));
    this._exceptionService.showSuccess('Display eliminado');
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      if (this.isEditing()) {
        this._displays.update(list =>
          list.map(x =>
            x.display_Code === this._editingCode
              ? { ...x, ...v, display_Description: v.display_Name }
              : x,
          ),
        );
      } else {
        const newDisplay: DisplayDTO = {
          display_Id:          Date.now(),
          display_Code:        v.display_Code,
          display_Name:        v.display_Name,
          display_Description: v.display_Name,
          display_Route:       v.display_Route,
          display_Icon:        v.display_Icon || undefined,
          is_Active:           true,
          is_Deleted:          false,
        };
        this._displays.update(list => [...list, newDisplay]);
      }
      this._exceptionService.showSuccess(this.isEditing() ? 'Display actualizado' : 'Display creado');
      this.dialogVisible.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
