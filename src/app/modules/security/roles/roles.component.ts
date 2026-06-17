import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

import { SecurityService } from 'app/core/services/security/security.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { RoleDTO } from 'app/core/interfaces/security/security.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDrawerComponent } from 'app/shared/components/opera-drawer/opera-drawer.component';

interface RoleForm {
  role_Name:        FormControl<string>;
  role_Description: FormControl<string>;
  is_Active:        FormControl<boolean>;
}

@Component({
  selector: 'opera-roles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    OperaTableComponent,
    OperaDrawerComponent,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private readonly _securityService  = inject(SecurityService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _roles  = signal<RoleDTO[]>([]);
  private readonly _search = signal<string>('');

  readonly loading        = signal<boolean>(false);
  readonly saving         = signal<boolean>(false);
  readonly drawerVisible  = signal<boolean>(false);
  readonly isEditing      = signal<boolean>(false);
  readonly drawerSubtitle = signal<string>('');
  readonly roles          = this._roles.asReadonly();

  readonly filteredRoles = computed(() => {
    const q = this._search().toLowerCase();
    if (!q) return this._roles();
    return this._roles().filter(
      r =>
        (r.role_Name ?? '').toLowerCase().includes(q) ||
        (r.role_Code ?? '').toLowerCase().includes(q) ||
        (r.role_Description ?? '').toLowerCase().includes(q),
    );
  });

  // ── Tabla ──────────────────────────────────────────────────────────────
  readonly columns: Column[] = [
    { field: 'role_Id',          header: 'ID',          type: 'text',    width: '80px' },
    { field: 'role_Code',        header: 'Código',      type: 'text',    width: '140px' },
    { field: 'role_Name',        header: 'Nombre',      type: 'text',    sortable: true },
    { field: 'role_Description', header: 'Descripción', type: 'text' },
    { field: 'is_Active',        header: 'Activo',      type: 'boolean', width: '90px' },
    {
      field: 'actions', header: 'Acciones', type: 'actions', width: '120px',
      actions: [
        { icon: 'fa-solid fa-pencil', tooltip: 'Editar',   color: 'primary', action: 'edit'   },
        { icon: 'fa-solid fa-trash',  tooltip: 'Eliminar', color: 'danger',  action: 'delete' },
      ],
    },
  ];

  // ── Formulario ──────────────────────────────────────────────────────────
  readonly form = new FormGroup<RoleForm>({
    role_Name:        new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role_Description: new FormControl('', { nonNullable: true }),
    is_Active:        new FormControl(true, { nonNullable: true }),
  });

  private _editingId: number | null = null;

  ngOnInit(): void {
    this._loadRoles();
  }

  private async _loadRoles(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this._securityService.getRoles$());
      if (res.success) this._roles.set(res.roles ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    this._search.set((event.target as HTMLInputElement).value);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this._editingId = null;
    this.drawerSubtitle.set('');
    this.form.reset({ is_Active: true });
    this.drawerVisible.set(true);
  }

  onEdit(role: RoleDTO): void {
    this.isEditing.set(true);
    this._editingId = role.role_Id;
    this.drawerSubtitle.set(role.role_Code ?? '');
    this.form.patchValue({
      role_Name:        role.role_Name ?? role.role_Code,
      role_Description: role.role_Description,
      is_Active:        role.is_Active,
    });
    this.drawerVisible.set(true);
  }

  async onDelete(role: RoleDTO): Promise<void> {
    const confirmed = await this._exceptionService.askConfirmation(
      `¿Eliminar el rol <b>${role.role_Name ?? role.role_Code}</b>?`,
    );
    if (!confirmed) return;

    const res = await firstValueFrom(this._securityService.deleteRole$(role.role_Id));
    this._exceptionService.showToastResult(res);
    if (res.success) await this._loadRoles();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      const roleCode = values.role_Name.toUpperCase().replace(/\s+/g, '_');
      const res = this.isEditing() && this._editingId !== null
        ? await firstValueFrom(this._securityService.updateRole$({
            ...values, role_Id: this._editingId!, role_Code: roleCode, is_Deleted: false,
          }))
        : await firstValueFrom(this._securityService.createRole$({
            ...values, role_Code: roleCode, is_Deleted: false,
          }));

      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.drawerVisible.set(false);
        await this._loadRoles();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
