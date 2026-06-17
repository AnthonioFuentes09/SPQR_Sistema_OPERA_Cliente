import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import {
  ResponseUsersDto,
  UserDTO,
  ResponseRolesDto,
  RoleDTO,
  ResponseAccessDto,
  AccessDTO,
} from 'app/core/interfaces/security/security.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'Security/';

  // ── Usuarios ──────────────────────────────────────────────────────────────
  getUsers$(): Observable<ResponseUsersDto> {
    return this._http
      .get<ResponseUsersDto>(`${this._apiUrl}Users`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  createUser$(body: Omit<UserDTO, 'user_Id'>): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}Users`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  updateUser$(body: UserDTO): Observable<ExecutionResponse> {
    return this._http
      .put<ExecutionResponse>(`${this._apiUrl}Users`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  deleteUser$(userId: number): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}Users`, { params: { user_Id: userId } })
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Roles ─────────────────────────────────────────────────────────────────
  getRoles$(): Observable<ResponseRolesDto> {
    return this._http
      .get<ResponseRolesDto>(`${this._apiUrl}Roles`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  createRole$(body: Omit<RoleDTO, 'role_Id'>): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}Roles`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  updateRole$(body: RoleDTO): Observable<ExecutionResponse> {
    return this._http
      .put<ExecutionResponse>(`${this._apiUrl}Roles`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  deleteRole$(roleId: number): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}Roles`, { params: { role_Id: roleId } })
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Accesos ───────────────────────────────────────────────────────────────
  getAccess$(): Observable<ResponseAccessDto> {
    return this._http
      .get<ResponseAccessDto>(`${this._apiUrl}Access`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  createAccess$(body: Omit<AccessDTO, 'access_Id'>): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}Access`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  updateAccess$(body: AccessDTO): Observable<ExecutionResponse> {
    return this._http
      .put<ExecutionResponse>(`${this._apiUrl}Access`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  deleteAccess$(accessId: number): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}Access`, { params: { access_Id: accessId } })
      .pipe(this._exceptionService.handleExecutionError());
  }
}
