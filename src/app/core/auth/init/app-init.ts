import { firstValueFrom } from 'rxjs'; // F-01: firstValueFrom en lugar del deprecated .toPromise()
import { AuthService } from 'app/core/services/auth/auth.service';
import { UserService } from 'app/core/services/user/user.service';
import { UserLogged } from 'app/core/interfaces/auth/auth.interface';

/**
 * APP_INITIALIZER — se ejecuta antes de que Angular levante cualquier ruta.
 * Rehidrata la sesión desde localStorage si existe un token.
 */
export function initApp(authService: AuthService, userService: UserService): () => Promise<void> {
  return async () => {
    const token    = localStorage.getItem('accessToken');
    const rawUser  = localStorage.getItem('userLogged');
    const rawAccess = localStorage.getItem('accessList');

    if (!token || !rawUser) return;

    try {
      // Rehidratar usuario en memoria
      const user: UserLogged = JSON.parse(rawUser);
      userService.user = user;

      // Rehidratar lista de accesos en memoria
      const accessList: string[] = rawAccess ? JSON.parse(rawAccess) : [];
      authService.setAccessList(accessList);

      // Validar token contra el API (silencioso — si falla, la sesión se limpia en el AuthInterceptor)
      await firstValueFrom(authService.signInUsingToken$());
    } catch {
      // Si JSON.parse falla o el token es inválido, la app arranca sin sesión
    }
  };
}
