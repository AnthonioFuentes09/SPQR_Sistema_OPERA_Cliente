import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClient } from '@angular/common/http';

import { ExceptionService } from 'app/core/services/utils/exception.service';
import { ActionDTO } from 'app/core/interfaces/adm-sys/adm-sys.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDialogComponent } from 'app/shared/components/opera-dialog/opera-dialog.component';
import { environment } from 'environments/environment';

interface ActionForm {
  action_Code: FormControl<string>;
  action_Name: FormControl<string>;
  action_Description: FormControl<string>;
}

@Component({
  selector: 'opera-actions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, OperaTableComponent, OperaDialogComponent],
  templateUrl: './actions.component.html',
  styleUrl: './actions.component.scss',
})
export class ActionsComponent implements OnInit {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'AdmSys/';

  private readonly _actions = signal<ActionDTO[]>([]);
  readonly loading       = signal<boolean>(false);
  readonly saving        = signal<boolean>(false);
  readonly dialogVisible = signal<boolean>(false);
  readonly isEditing     = signal<boolean>(false);
  readonly actions       = this._actions.asReadonly();

  readonly columns: Column[] = [
    { field: 'action_Code',        header: 'Código',      type: 'text', width: '120px' },
    { field: 'action_Name',        header: 'Nombre',      type: 'text', sortable: true },
    { field: 'action_Description', header: 'Descripción', type: 'text' },
    { field: 'actions',            header: 'Acciones',    type: 'actions', width: '100px' },
  ];

  readonly form = new FormGroup<ActionForm>({
    action_Code:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    action_Name:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    action_Description: new FormControl('', { nonNullable: true }),
  });

  private _editingCode: string | null = null;

  ngOnInit(): void { this._load(); }

  private async _load(): Promise<void> {
    this.loading.set(true);
    try {
      // Mock: devuelve array vacío hasta conectar al API real
      this._actions.set([
        { action_Id: 1, action_Code: 'VIEW',   action_Name: 'Ver',      action_Description: 'Permiso de lectura',      action_Route: '/view',   is_Active: true, is_Deleted: false },
        { action_Id: 2, action_Code: 'CREATE', action_Name: 'Crear',    action_Description: 'Permiso de creación',     action_Route: '/create', is_Active: true, is_Deleted: false },
        { action_Id: 3, action_Code: 'EDIT',   action_Name: 'Editar',   action_Description: 'Permiso de edición',      action_Route: '/edit',   is_Active: true, is_Deleted: false },
        { action_Id: 4, action_Code: 'DELETE', action_Name: 'Eliminar', action_Description: 'Permiso de eliminación',  action_Route: '/delete', is_Active: true, is_Deleted: false },
      ]);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.isEditing.set(false); this._editingCode = null;
    this.form.reset(); this.dialogVisible.set(true);
  }

  onEdit(action: ActionDTO): void {
    this.isEditing.set(true); this._editingCode = action.action_Code;
    this.form.patchValue(action); this.dialogVisible.set(true);
  }

  async onDelete(action: ActionDTO): Promise<void> {
    const ok = await this._exceptionService.askConfirmation(`¿Eliminar acción <b>${action.action_Name}</b>?`);
    if (!ok) return;
    this._actions.update(list => list.filter(a => a.action_Code !== action.action_Code));
    this._exceptionService.showSuccess('Acción eliminada');
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      if (this.isEditing()) {
        this._actions.update(list => list.map(a =>
          a.action_Code === this._editingCode ? { ...a, ...values } : a,
        ));
      } else {
        const newAction: ActionDTO = {
          action_Id:          Date.now(),
          action_Code:        values.action_Code,
          action_Name:        values.action_Name,
          action_Description: values.action_Description,
          action_Route:       '/' + values.action_Code.toLowerCase(),
          is_Active:          true,
          is_Deleted:         false,
        };
        this._actions.update(list => [...list, newAction]);
      }
      this._exceptionService.showSuccess(this.isEditing() ? 'Acción actualizada' : 'Acción creada');
      this.dialogVisible.set(false);
    } finally {
      this.saving.set(false);
    }
  }
}
