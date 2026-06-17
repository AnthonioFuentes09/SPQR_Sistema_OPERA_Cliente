import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from 'app/core/services/auth/auth.service';

export const authGuard: CanMatchFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  // Verificar token localmente — la validación real contra el API la hace APP_INITIALIZER
  return !!authService.accessToken || router.createUrlTree(['/sign-in']);
};
