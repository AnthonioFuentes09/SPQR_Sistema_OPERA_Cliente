import { Routes } from '@angular/router';
import { authGuard }   from 'app/core/auth/guards/auth.guard';
import { noAuthGuard } from 'app/core/auth/guards/no-auth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

  // ── Rutas públicas ──────────────────────────────────────────────────────────
  {
    path: '',
    canMatch: [noAuthGuard],
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('app/modules/auth/sign-in/sign-in.component')
          .then(m => m.SignInComponent),
      },
    ],
  },

  // Sign-out siempre accesible
  {
    path: 'sign-out',
    loadComponent: () => import('app/modules/auth/sign-out/sign-out.component')
      .then(m => m.SignOutComponent),
  },

  // ── Rutas protegidas ────────────────────────────────────────────────────────
  {
    path: '',
    canMatch: [authGuard],
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('app/modules/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
      },

      // Seguridad
      {
        path: 'security',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'users' },
          {
            path: 'users',
            loadComponent: () => import('app/modules/security/users/users.component')
              .then(m => m.UsersComponent),
          },
          {
            path: 'roles',
            loadComponent: () => import('app/modules/security/roles/roles.component')
              .then(m => m.RolesComponent),
          },
          {
            path: 'access',
            loadComponent: () => import('app/modules/security/access/access.component')
              .then(m => m.AccessComponent),
          },
        ],
      },

      // Training: Ejecución
      {
        path: 'training',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'curve-assignment' },
          {
            path: 'curve-assignment',
            loadComponent: () => import('app/modules/training-curves/curve-assignment/curve-assignment.component')
              .then(m => m.CurveAssignmentComponent),
          },
          {
            path: 'curve-tracking',
            loadComponent: () => import('app/modules/training-curves/curve-tracking/curve-tracking.component')
              .then(m => m.CurveTrackingComponent),
          },
          {
            path: 'curve-requests',
            loadComponent: () => import('app/modules/training-curves/curve-requests/curve-requests.component')
              .then(m => m.CurveRequestsComponent),
          },
          {
            path: 'operators-management',
            loadComponent: () => import('app/modules/training-curves/operators-management/operators-management.component')
              .then(m => m.OperatorsManagementComponent),
          },

          // Training: Configuración
          {
            path: 'config',
            children: [
              { path: '', pathMatch: 'full', redirectTo: 'training-curves' },
              {
                path: 'training-curves',
                loadComponent: () => import('app/modules/training-config/training-curves/training-curves.component')
                  .then(m => m.TrainingCurvesConfigComponent),
              },
            ],
          },
        ],
      },

      // Administración del Sistema
      {
        path: 'adm-sys',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'actions' },
          {
            path: 'actions',
            loadComponent: () => import('app/modules/adm-sys/actions/actions.component')
              .then(m => m.ActionsComponent),
          },
          {
            path: 'displays',
            loadComponent: () => import('app/modules/adm-sys/displays/displays.component')
              .then(m => m.DisplaysComponent),
          },
          {
            path: 'system-entities',
            loadComponent: () => import('app/modules/adm-sys/system-entities/system-entities.component')
              .then(m => m.SystemEntitiesComponent),
          },
        ],
      },

      // 404
      {
        path: '404',
        loadComponent: () => import('app/modules/not-found/not-found.component')
          .then(m => m.NotFoundComponent),
      },
      { path: '**', redirectTo: '404' },
    ],
  },
];
