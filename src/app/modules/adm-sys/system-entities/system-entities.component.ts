import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { SystemEntityDTO } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDialogComponent } from 'app/shared/components/opera-dialog/opera-dialog.component';

interface EntityForm {
  entity_Code:        FormControl<string>;
  entity_Name:        FormControl<string>;
  entity_Description: FormControl<string>;
}

@Component({
  selector: 'opera-system-entities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, OperaTableComponent, OperaDialogComponent],
  templateUrl: './system-entities.component.html',
  styleUrl: './system-entities.component.scss',
})
export class SystemEntitiesComponent implements OnInit {
  private readonly _exceptionService = inject(ExceptionService);

  private readonly _entities = signal<SystemEntityDTO[]>([]);
  readonly loading       = signal<boolean>(false);
  readonly saving        = signal<boolean>(false);
  readonly dialogVisible = signal<boolean>(false);
  readonly isEditing     = signal<boolean>(false);
  readonly entities      = this._entities.asReadonly();

  readonly columns: Column[] = [
    { field: 'entity_Code',        header: 'Código',      type: 'text', width: '120px' },
    { field: 'entity_Name',        header: 'Nombre',      type: 'text', sortable: true },
    { field: 'entity_Description', header: 'Descripción', type: 'text' },
    { field: 'actions',            header: 'Acciones',    type: 'actions', width: '100px' },
  ];

  readonly form = new FormGroup<EntityForm>({
    entity_Code:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entity_Name:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    entity_Description: new FormControl('', { nonNullable: true }),
  });

  private _editingCode: string | null = null;

  ngOnInit(): void {
    this._entities.set([
      { entity_Id: 1, entity_Code: 'USER',       entity_Name: 'Usuario',    entity_Description: 'Entidad de usuarios del sistema', company_Code: 'HN', is_Active: true },
      { entity_Id: 2, entity_Code: 'ROLE',       entity_Name: 'Rol',        entity_Description: 'Roles de seguridad',              company_Code: 'HN', is_Active: true },
      { entity_Id: 3, entity_Code: 'CURVE',      entity_Name: 'Curva',      entity_Description: 'Curvas de entrenamiento',         company_Code: 'HN', is_Active: true },
      { entity_Id: 4, entity_Code: 'ASSIGNMENT', entity_Name: 'Asignacion', entity_Description: 'Asignaciones de curvas',          company_Code: 'HN', is_Active: true },
    ]);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this._editingCode = null;
    this.form.reset();
    this.dialogVisible.set(true);
  }

  onEdit(e: SystemEntityDTO): void {
    this.isEditing.set(true);
    this._editingCode = e.entity_Code;
    this.form.patchValue(e);
    this.dialogVisible.set(true);
  }

  async onDelete(e: SystemEntityDTO): Promise<void> {
    const ok = await this._exceptionService.askConfirmation(
      `Eliminar entidad <b>${e.entity_Name}</b>?`,
    );
    if (!ok) return;
    this._entities.update(list => list.filter(x => x.entity_Code !== e.entity_Code));
    this._exceptionService.showSuccess('Entidad eliminada');
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    try {
      const v = this.form.getRawValue();
      if (this.isEditing()) {
        const code = this._editingCode;
        this._entities.update(list =>
          list.map(x => (x.entity_Code === code ? { ...x, ...v } : x)),
        );
      } else {
        const newEntity: SystemEntityDTO = {
          entity_Id:          Date.now(),
          entity_Code:        v.entity_Code,
          entity_Name:        v.entity_Name,
          entity_Description: v.entity_Description,
          company_Code:       'HN',
          is_Active:          true,
        };
        this._entities.update(list => [...list, newEntity]);
      }
      this._exceptionService.showSuccess(
        this.isEditing() ? 'Entidad actualizada' : 'Entidad creada',
      );
      this.dialogVisible.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
