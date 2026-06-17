import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';

import { SecurityService } from 'app/core/services/security/security.service';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { AccessDTO } from 'app/core/interfaces/security/security.interface';
import { OperaTableComponent, type Column } from 'app/shared/components/opera-table/opera-table.component';
import { OperaDrawerComponent } from 'app/shared/components/opera-drawer/opera-drawer.component';
import { OperaFiltersComponent } from 'app/shared/components/opera-filters/opera-filters.component';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';

interface AccessForm {
  access_Code:   FormControl<string>;
  access_Name:   FormControl<string>;
  access_Module: FormControl<string>;
  role_Id:       FormControl<number>;
}

@Component({
  selector: 'opera-access',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    OperaTableComponent,
    OperaDrawerComponent,
    OperaFiltersComponent,
  ],
  templateUrl: './access.component.html',
  styleUrl: './access.component.scss',
})
export class AccessComponent implements OnInit {
  private readonly _securityService  = inject(SecurityService);
  private readonly _exceptionService = inject(ExceptionService);

  // ── Estado ──────────────────────────────────────────────────────────────
  private readonly _accesses      = signal<AccessDTO[]>([]);
  private readonly _moduleFilters = signal<string[]>([]);
  private readonly _search        = signal<string>('');

  readonly loading        = signal<boolean>(false);
  readonly saving         = signal<boolean>(false);
  readonly drawerVisible  = signal<boolean>(false);
  readonly isEditing      = signal<boolean>(false);
  readonly drawerSubtitle = signal<string>('');

  readonly filteredAccesses = computed(() => {
    const filters = this._moduleFilters();
    const q       = this._search().toLowerCase();
    let data = this._accesses();
    if (filters.length) data = data.filter(a => filters.includes(a.access_Module ?? ''));
    if (q) data = data.filter(
      a =>
        (a.access_Name ?? '').toLowerCase().includes(q) ||
        (a.access_Code ?? '').toLowerCase().includes(q) ||
        (a.access_Module ?? '').toLowerCase().includes(q),
    );
    return data;
  });

  readonly moduleOptions = computed<BaseItemFilterOptions[]>(() => {
    const modules = [...new Set(
      this._accesses()
        .map(a => a.access_Module)
        .filter((m): m is string => !!m),
    )];
    return modules.map(m => ({ valueKey: m, description: m }));
  });

  // ── Tabla ──────────────────────────────────────────────────────────────
  readonly columns: Column[] = [
    { field: 'access_Code',      header: 'Código',   type: 'text',    width: '130px' },
    { field: 'access_Name',      header: 'Nombre',   type: 'text',    sortable: true },
    { field: 'access_Module',    header: 'Módulo',   type: 'badge',   width: '140px',
      badgeClass: () => 'status-badge planificada' },
    { field: 'role_Description', header: 'Rol',      type: 'text',    width: '130px' },
    {
      field: 'actions', header: 'Acciones', type: 'actions', width: '120px',
      actions: [
        { icon: 'fa-solid fa-pencil', tooltip: 'Editar',   color: 'primary', action: 'edit'   },
        { icon: 'fa-solid fa-trash',  tooltip: 'Eliminar', color: 'danger',  action: 'delete' },
      ],
    },
  ];

  // ── Formulario ──────────────────────────────────────────────────────────
  readonly form = new FormGroup<AccessForm>({
    access_Code:   new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    access_Name:   new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    access_Module: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    role_Id:       new FormControl(0,  { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
  });

  private _editingId: number | null = null;

  ngOnInit(): void {
    this._loadAccess();
  }

  private async _loadAccess(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this._securityService.getAccess$());
      if (res.success) this._accesses.set(res.accesses ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(event: Event): void {
    this._search.set((event.target as HTMLInputElement).value);
  }

  onModuleFilter(values: string[]): void {
    this._moduleFilters.set(values);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this._editingId = null;
    this.drawerSubtitle.set('');
    this.form.reset();
    this.drawerVisible.set(true);
  }

  onEdit(access: AccessDTO): void {
    this.isEditing.set(true);
    this._editingId = access.access_Id;
    this.drawerSubtitle.set(access.access_Code ?? '');
    this.form.patchValue({
      access_Code:   access.access_Code,
      access_Name:   access.access_Name ?? access.access_Description,
      access_Module: access.access_Module ?? '',
      role_Id:       access.role_Id,
    });
    this.drawerVisible.set(true);
  }

  async onDelete(access: AccessDTO): Promise<void> {
    const confirmed = await this._exceptionService.askConfirmation(
      `¿Eliminar el acceso <b>${access.access_Name ?? access.access_Description}</b>?`,
    );
    if (!confirmed) return;

    const res = await firstValueFrom(this._securityService.deleteAccess$(access.access_Id));
    this._exceptionService.showToastResult(res);
    if (res.success) await this._loadAccess();
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    try {
      const values = this.form.getRawValue();
      const res = this.isEditing() && this._editingId !== null
        ? await firstValueFrom(this._securityService.updateAccess$({
            ...values,
            access_Id:          this._editingId!,
            access_Description: values.access_Name,
            access_Route:       '/' + values.access_Code.toLowerCase(),
            is_Active:          true,
          }))
        : await firstValueFrom(this._securityService.createAccess$({
            ...values,
            access_Description: values.access_Name,
            access_Route:       '/' + values.access_Code.toLowerCase(),
            is_Active:          true,
          }));

      this._exceptionService.showToastResult(res);
      if (res.success) {
        this.drawerVisible.set(false);
        await this._loadAccess();
      }
    } finally {
      this.saving.set(false);
    }
  }
}
