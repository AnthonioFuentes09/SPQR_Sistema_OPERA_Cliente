import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from 'app/core/services/auth/auth.service';

// Devuelve true solo si NO hay token activo.
// Si hay token, devuelve false (salta la ruta, no redirige con UrlTree)
// porque este guard se evalua en {path: ''} que coincide con TODO,
// y retornar un UrlTree causaria un loop infinito al navegar a /dashboard.
export const noAuthGuard: CanMatchFn = (): boolean => {
  const authService = inject(AuthService);
  return !authService.accessToken;
};
