import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';

import { SecurityService } from 'app/core/services/security/security.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { UserDTO } from 'app/core/interfaces/security/security.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDrawerComponent } from 'app/shared/components/opera-drawer/opera-drawer.component';
import { OperaPageHeaderComponent } from 'app/shared/components/opera-page-header/opera-page-header.component';
import { OperaActionsBarComponent } from 'app/shared/components/opera-actions-bar/opera-actions-bar.component';

interface UserForm {
  employee_Code: FormControl<string>;
  user_Name:     FormControl<string>;
  user_Email:    FormControl<string>;
  role_Id:       FormControl<number>;
  is_Active:     FormControl<boolean>;
}

@Component({
  selector: 'opera-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    DropdownModule,
    OperaTableComponent,
    OperaDrawerComponent,
    OperaPageHeaderComponent,
    OperaActionsBarComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly _securityService  = inject(SecurityService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _users  = signal<UserDTO[]>([]);
  private readonly _search = signal<string>('');

  readonly loading        = signal<boolean>(false);
  readonly saving         = signal<boolean>(false);
  readonly drawerVisible  = signal<boolean>(false);
  readonly isEditing      = signal<boolean>(false);
  readonly drawerSubtitle = signal<string>('');
  readonly users          = this._users.asReadonly();

  readonly filteredUsers = computed(() => {
    const q = this._search().toLowerCase();
    if (!q) return this._users();
    return this._users().filter(
      u =>
        u.user_Name.toLowerCase().includes(q) ||
        u.user_Email.toLowerCase().includes(q) ||
        (u.employee_Code ?? '').toLowerCase().includes(q),
    );
  });

  // ── Roles disponibles ─────────────────────────────────────────────────────
  readonly roles = signal([
    { label: 'Admin',       value: 1 },
    { label: 'Instructor',  value: 2 },
    { label: 'Supervisor',  value: 3 },
    { label: 'Viewer',      value: 4 },
  ]);

  // ── Tabla (botones estilo PAYWEB) ────────────────────────────────────────
  readonly columns: Column[] = [
    { field: 'employee_Code', header: 'Código',     type: 'text',    width: '120px' },
    { field: 'user_Name',     header: 'Nombre',     type: 'text',    sortable: true },
    { field: 'user_Email',    header: 'Email',      type: 'text',    sortable: true },
    { field: 'role_Name',     header: 'Rol',        type: 'text',    width: '150px' },
    { field: 'is_Active',     header: 'Estado',     type: 'boolean', width: '90px'  },
    {
      field: 'actions',
      header: 'Acciones',
      type: 'actions',
      width: '120px',
      actions: [
        { icon: 'fa-solid fa-pencil',    tooltip: 'Editar',    color: 'primary',   action: 'edit'   },
        { icon: 'fa-solid fa-trash',     tooltip: 'Eliminar',  color: 'danger',    action: 'delete' },
      ],
    },
  ];

  // ── Formulario ──────────────────────────────────────────────────────────
  readonly form = new FormGroup<UserForm>({
    employee_Code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this._employeeCodeUniqueValidator.bind(this)],
    }),
    user_Name:     new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    user_Email:    new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role_Id:       new FormControl(0,  { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    is_Active:     new FormControl(true, { nonNullable: true }),
  });

  private _editingId: number | null = null;

  private _employeeCodeUniqueValidator(control: AbstractControl): ValidationErrors | null {
    const code = (control.value ?? '').toString().trim();
    if (!code) return null;

    const duplicate = this._users().some(u =>
      u.employee_Code?.trim().toLowerCase() === code.toLowerCase() &&
      u.user_Id !== this._editingId,
    );

    return duplicate ? { duplicateEmployeeCode: true } : null;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadUsers();
  }

  // ── Carga ──────────────────────────────────────────────────────────────
  private async _loadUsers(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this._securityService.getUsers$());
      if (res.success) this._users.set(res.users ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────
  onSearch(term: string): void {
    this._search.set(term);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this._editingId = null;
    this.drawerSubtitle.set('');
    this.form.reset({ is_Active: true });
    this.form.controls.employee_Code.updateValueAndValidity();
    this.drawerVisible.set(true);
  }

  onEdit(user: UserDTO): void {
    this.isEditing.set(true);
    this._editingId = user.user_Id;
    this.drawerSubtitle.set(user.employee_Code ?? user.user_Code ?? '');
    this.form.patchValue({
      employee_Code: user.employee_Code ?? '',
      user_Name:     user.user_Name,
      user_Email:    user.user_Email,
      role_Id:       user.role_Id ?? 0,
      is_Active:     user.is_Active,
    });
    this.form.controls.employee_Code.updateValueAndValidity();
    this.drawerVisible.set(true);
  }

  async onDelete(user: UserDTO): Promise<void> {
    const confirmed = await this._exceptionService.askConfirmation(
      `¿Eliminar al usuario <b>${user.user_Name}</b>?`,
    );
    if (!confirmed) return;

    const res = await firstValueFrom(this._securityService.deleteUser$(user.user_Id));
    this._exceptionService.showToastResult(res);
    if (res.success) await this._loadUsers();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const employee_CodeControl = this.form.controls.employee_Code;
    employee_CodeControl.updateValueAndValidity();

    if (employee_CodeControl.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const res = this.isEditing() && this._editingId !== null
        ? await firstValueFrom(this._securityService.updateUser$({
            ...values,
            user_Id:      this._editingId!,
            user_Code:    values.employee_Code ?? '',
            company_Code: 'HN',
            is_Deleted:   false,
          }))
        : await firstValueFrom(this._securityService.createUser$({
            ...values,
            user_Code:    values.employee_Code ?? '',
            company_Code: 'HN',
            is_Deleted:   false,
          }));

      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.drawerVisible.set(false);
        await this._loadUsers();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
