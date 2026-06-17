import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, filter, take, switchMap, catchError } from 'rxjs';
import { AuthService } from 'app/core/services/auth/auth.service';
import { AuthSignInResponse } from 'app/core/interfaces/auth/auth.interface';

// Estado compartido del interceptor (fuera de la función para que sea singleton)
let _isRefreshing  = false;
const _refreshToken$ = new BehaviorSubject<string | null>(null);

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    // Si no tiene forma de JWT (header.payload.signature), no intentar decodificar
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Considerar expirado si quedan menos de 30 segundos
    return Date.now() >= (payload.exp * 1000) - 30_000;
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<any> => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // No interceptar las rutas de autenticación
  if (req.url.includes('Auth/SignIn') || req.url.includes('Auth/RefreshToken')) {
    return next(req);
  }

  const token = authService.accessToken;

  // Refresh proactivo: si el token está próximo a expirar, renovar antes de enviar
  if (token && isTokenExpired(token)) {
    return handleRefresh(req, next, authService, router);
  }

  return next(token ? addToken(req, token) : req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return handleRefresh(req, next, authService, router);
      }
      return throwError(() => error);
    }),
  );
};

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<any> {
  if (_isRefreshing) {
    // Serializar refreshes concurrentes: esperar al nuevo token
    return _refreshToken$.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addToken(req, token!))),
    );
  }

  _isRefreshing = true;
  _refreshToken$.next(null);

  return authService.refreshAccessToken$().pipe(
    switchMap((response: AuthSignInResponse) => {
      _isRefreshing = false;
      if (!response.success || !response.accessToken) {
        router.navigate(['/sign-out']);
        return throwError(() => new Error('Refresh failed'));
      }
      _refreshToken$.next(response.accessToken);
      return next(addToken(req, response.accessToken));
    }),
    catchError(err => {
      _isRefreshing = false;
      router.navigate(['/sign-out']);
      return throwError(() => err);
    }),
  );
}
