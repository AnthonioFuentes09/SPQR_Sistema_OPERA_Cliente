import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';
import { environment } from 'environments/environment';
import { AuthSignInRequest, AuthSignInResponse, UserLogged } from 'app/core/interfaces/auth/auth.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { UserService } from 'app/core/services/user/user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http            = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _userService      = inject(UserService);
  private readonly _api              = environment.apiURL;

  // ── Access list ─────────────────────────────────────────────────────────────
  private _accessList: string[] = [];

  get accessList(): string[] { return this._accessList; }

  setAccessList(access: string[] | undefined): void {
    // F-02: filtrar strings vacíos para evitar que '' pase como acceso válido
    this._accessList = (access ?? []).filter(a => a.trim().length > 0);
  }

  hasAccess(code: string): boolean {
    return this._accessList.includes(code);
  }

  // ── Token storage ────────────────────────────────────────────────────────────
  get accessToken(): string  { return localStorage.getItem('accessToken')  ?? ''; }
  get refreshToken(): string { return localStorage.getItem('refreshToken') ?? ''; }

  private _setTokens(access: string, refresh: string): void {
    localStorage.setItem('accessToken',  access);
    localStorage.setItem('refreshToken', refresh);
  }

  private _clearStorage(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessList');
    localStorage.removeItem('userLogged');
  }

  // ── Hidratación de sesión ───────────────────────────────────────────────────
  // F-03: método unificado — antes se duplicaba en signInUser$, signInUsingToken$ y validateToken$
  private _hydrateSession(response: AuthSignInResponse): void {
    if (!response.success) return;

    this._setTokens(response.accessToken ?? '', response.refreshToken ?? '');

    // F-02: .filter() garantiza que no haya strings vacíos en la lista
    const accessList = response.access?.split(',').filter(a => a.trim().length > 0) ?? [];
    this.setAccessList(accessList);
    localStorage.setItem('accessList', JSON.stringify(accessList));

    const userLogged: UserLogged = {
      user_Code:    response.user_Code    ?? '',
      user_Name:    response.user_Name    ?? '',
      user_Email:   response.user_Email   ?? '',
      company_Code: response.company_Code ?? '',
      roles:        response.roles        ?? [],
    };
    this._userService.user = userLogged;
    localStorage.setItem('userLogged', JSON.stringify(userLogged));
  }

  // ── Auth methods ─────────────────────────────────────────────────────────────
  signIn$(credentials: AuthSignInRequest): Observable<AuthSignInResponse> {
    return this._http.post<AuthSignInResponse>(`${this._api}Auth/SignIn`, credentials).pipe(
      tap(response => this._hydrateSession(response)),
      this._exceptionService.handleExecutionError(),
    );
  }

  signInUsingToken$(): Observable<AuthSignInResponse> {
    const token = this.accessToken;
    if (!token) return of({ success: false } as AuthSignInResponse);

    return this._http.post<AuthSignInResponse>(`${this._api}Auth/SignInWithToken`, { token }).pipe(
      tap(response => this._hydrateSession(response)),
      this._exceptionService.handleExecutionError(),
    );
  }

  refreshAccessToken$(): Observable<AuthSignInResponse> {
    return this._http.post<AuthSignInResponse>(`${this._api}Auth/RefreshToken`, {
      accessToken:  this.accessToken,
      refreshToken: this.refreshToken,
    }).pipe(
      tap(response => {
        if (response.success && response.accessToken) {
          this._setTokens(response.accessToken, response.refreshToken ?? this.refreshToken);
        }
      }),
      this._exceptionService.handleExecutionError(),
    );
  }

  signOut$(): Observable<ExecutionResponse> {
    return this._http.post<ExecutionResponse>(`${this._api}Auth/SignOut`, {}).pipe(
      switchMap(response => {
        this._clearStorage();
        this._userService.clear();
        this._accessList = [];
        return of(response);
      }),
      this._exceptionService.handleExecutionError(),
    );
  }

  /** Rehidrata el accessList desde localStorage al inicializar la app (APP_INITIALIZER). */
  getAccessByUser$(userCode: string): Observable<ExecutionResponse> {
    if (!this.accessToken) return of({ success: false } as ExecutionResponse);

    return this._http.get<ExecutionResponse>(`${this._api}Auth/AccessList/${userCode}`).pipe(
      tap((response: any) => {
        if (response.success && response.access) {
          this.setAccessList(response.access.split(','));
        }
      }),
      this._exceptionService.handleExecutionError(),
    );
  }

  check(): Observable<boolean> {
    if (!this.accessToken) return of(false);
    return this.signInUsingToken$().pipe(
      switchMap(r => of(r.success))
    );
  }
}
