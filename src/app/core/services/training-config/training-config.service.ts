import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import {
  CurveDto,
  ResponseCurvesDto,
} from 'app/core/interfaces/training-config/training-config.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

@Injectable({ providedIn: 'root' })
export class TrainingConfigService {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'TrainingConfig/';

  getCurves$(): Observable<ResponseCurvesDto> {
    return this._http
      .get<ResponseCurvesDto>(`${this._apiUrl}training-config`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  createCurve$(body: Omit<CurveDto, 'curve_Code'>): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}training-config`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  updateCurve$(body: CurveDto): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}training-config`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  deleteWeek$(curveCode: string, opExentaId: string, level: number): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}training-config-week`, {
        params: {
          curve_Code:          curveCode,
          opExenta_AlphaNumId: opExentaId,
          level:               level,
        },
      })
      .pipe(this._exceptionService.handleExecutionError());
  }
}
