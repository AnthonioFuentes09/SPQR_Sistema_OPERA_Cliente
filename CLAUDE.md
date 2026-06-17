# CLAUDE.md — SPQR Sistema OPERA Cliente

Instrucciones para Claude al trabajar en este repositorio.

## Descripción del proyecto

Cliente Angular 18 **standalone** (sin NgModules) para el sistema OPERA.
Migración completa de PAYWEB (Fuse + Angular Material) a **PrimeNG 18 + Aura theme**.
Funciona con **mocks** (`environment.useMocks = true`) — listo para conectar al API real.

## Comandos de desarrollo

```bash
# Instalar dependencias (solo primera vez o al cambiar package.json)
npm install --legacy-peer-deps

# Servidor de desarrollo
npm start         # http://localhost:4200

# Build de producción
npm run build

# Tests
npm test
```

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 18 standalone — `bootstrapApplication()` |
| UI | PrimeNG 18 + Aura theme (`@primeng/themes`) |
| CSS | Tailwind CSS (`preflight: false`) + SCSS |
| Estado | Angular Signals (`signal`, `computed`) |
| HTTP | `HttpClient` + functional interceptors |
| Notificaciones | ngx-toastr + sweetalert2 |

## Estructura del proyecto

```
src/app/
├── core/
│   ├── auth/             # Guards (CanMatchFn), interceptors, app-init
│   ├── interfaces/       # Todas las interfaces TypeScript por dominio
│   │   ├── auth/
│   │   ├── security/
│   │   ├── training-curves/
│   │   ├── training-config/
│   │   ├── adm-sys/
│   │   └── exceptions/
│   ├── mock/             # Mock data + mock interceptor
│   │   └── data/         # auth.mock, security.mock, training.mock
│   └── services/         # Servicios por dominio
│       ├── auth/
│       ├── user/
│       ├── utils/        # ExceptionService
│       ├── security/
│       ├── training-curves/
│       └── training-config/
├── layout/               # Shell: layout, sidebar, header
├── modules/
│   ├── auth/             # sign-in, sign-out
│   ├── dashboard/
│   ├── not-found/
│   ├── security/         # users, roles, access
│   ├── training-curves/  # curve-assignment (timeline), curve-tracking,
│   │                     # curve-requests, operators-management
│   ├── training-config/  # training-curves (FormArray)
│   └── adm-sys/          # actions, displays, system-entities
└── shared/
    └── components/       # opera-table, opera-dialog, opera-filters
```

## Patrones obligatorios

### Signals
```typescript
// Privado con prefijo _ + readonly público
private readonly _items = signal<Item[]>([]);
readonly items = this._items.asReadonly();
```

### HTTP — nunca en constructor
```typescript
ngOnInit(): void { this._loadData(); }
private async _loadData(): Promise<void> { ... }
```

### inject() — nunca constructor injection
```typescript
private readonly _service = inject(MyService);
```

### Cleanup
```typescript
private readonly _unsubscribeAll = new Subject<void>(); // Subject<void> no Subject<any>
ngOnDestroy(): void { this._unsubscribeAll.next(); this._unsubscribeAll.complete(); }
```

### firstValueFrom — no .toPromise()
```typescript
const result = await firstValueFrom(this._service.doSomething$());
```

### Typed FormGroup (F-18)
```typescript
interface MyForm { field: FormControl<string>; }
readonly form = new FormGroup<MyForm>({
  field: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
});
```

### Error handling en el servicio (nunca en el componente)
```typescript
getSomething$(): Observable<ResponseDto> {
  return this._http.get<ResponseDto>(url).pipe(
    this._exceptionService.handleExecutionError()
  );
}
```

### ViewEncapsulation.None — selectores SIEMPRE acotados
```scss
// Si el componente tiene encapsulation: ViewEncapsulation.None:
opera-curve-assignment {
  .mi-clase { ... } // correcto — acotado al host
}
// NUNCA sin acotar:
.mi-clase { ... } // incorrecto — fuga global
```

## Mocks disponibles

Activar/desactivar en `src/environments/environment.ts`:
```typescript
export const environment = { production: false, apiURL: '...', useMocks: true };
```

El `mockInterceptor` cubre todos los endpoints del módulo de entrenamiento y seguridad.
Ver `src/app/core/mock/mock.interceptor.ts` para la lista completa.

## Shared Components

### OperaTableComponent
```html
<opera-table
  [columns]="columns"   <!-- Column[] -->
  [data]="data()"
  [loading]="loading()"
  (editRow)="onEdit($any($event))"
  (deleteRow)="onDelete($any($event))"
/>
```

### OperaDialogComponent
```html
<opera-dialog [(visible)]="dialogVisible" header="Título" width="480px">
  <!-- body -->
  <div footer class="flex justify-end gap-2">
    <p-button label="Cancelar" ... />
    <p-button label="Guardar" ... />
  </div>
</opera-dialog>
```

### OperaFiltersComponent
```html
<opera-filters
  [options]="options()"   <!-- BaseItemFilterOptions[] -->
  label="Filtrar por"
  [multiple]="true"
  (filterChange)="onFilter($event)"
/>
```

## Correcciones de PAYWEB aplicadas (F-01 a F-20)

Ver `OPERA_plan_implementacion.md` sección 10 para el listado completo.
Las más críticas:
- F-01: `firstValueFrom()` en vez de `.toPromise()`
- F-02: filtro de strings vacíos en accessList
- F-03: `_hydrateSession()` unificado
- F-04: sin PayWebService en AuthService
- F-06: `Subject<void>` no `Subject<any>`
- F-07: `@HostListener` no `window.addEventListener`
- F-09: sin métodos muertos (forgotPassword, signUp, etc.)
- F-18: `FormGroup<T>` tipado, no UntypedFormGroup

## Contexto para continuar

Ver `CONTINUACION.md` en la raíz del proyecto para estado detallado de tareas.
