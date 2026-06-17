import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { CurveRequestDto } from 'app/core/interfaces/training-curves/training-curves.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

@Injectable({ providedIn: 'root' })
export class CurveRequestService {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'CurveRequest/';

  getAssignmentRequests$(): Observable<CurveRequestDto[]> {
    return this._http
      .get<CurveRequestDto[]>(`${this._apiUrl}assignment-requests`)
      .pipe(this._exceptionService.handleError<CurveRequestDto[]>([]));
  }

  deleteRequest$(codeId: number, detCodeId: number): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}assignment-request/${codeId}/${detCodeId}`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  updateRequestState$(
    codeId: number,
    detCodeId: number,
    body: { state: string; comment?: string },
  ): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}assignment-request/${codeId}/${detCodeId}/state`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }
}
