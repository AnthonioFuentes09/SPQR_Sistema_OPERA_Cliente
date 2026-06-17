import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideToastr } from 'ngx-toastr';

import { appRoutes } from 'app/app.routes';
import { authInterceptor } from 'app/core/auth/interceptors/auth.interceptor';
import { mockInterceptor } from 'app/core/mock/mock.interceptor';
import { initApp } from 'app/core/auth/init/app-init';
import { AuthService } from 'app/core/services/auth/auth.service';
import { UserService } from 'app/core/services/user/user.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),

    // Mock interceptor primero — si hay match, cortocircuita antes de llegar a auth
    provideHttpClient(
      withInterceptors([mockInterceptor, authInterceptor])
    ),

    provideAnimationsAsync(),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix:      'p',
          darkModeSelector: '.opera-dark',
          cssLayer:    false,
        },
      },
    }),

    provideToastr({
      timeOut:          3000,
      positionClass:    'toast-bottom-right',
      preventDuplicates: true,
      progressBar:      true,
    }),

    {
      provide:    APP_INITIALIZER,
      useFactory: initApp,
      deps:       [AuthService, UserService],
      multi:      true,
    },
  ],
};
