import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import {
  ResponseEmployeeAssignments,
  EmployeeAssignmentDTO,
  WeeklyProgress,
  UserTrainingDto,
  ResponseCurveTrackDto,
  InstructorDto,
} from 'app/core/interfaces/training-curves/training-curves.interface';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

@Injectable({ providedIn: 'root' })
export class TrainingCurvesService {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'TrainingCurve/';

  // ── Assignments ───────────────────────────────────────────────────────────
  getEmployeeAssignments$(year: number, semester: number): Observable<ResponseEmployeeAssignments> {
    return this._http
      .get<ResponseEmployeeAssignments>(`${this._apiUrl}employee-assignments/${year}/${semester}`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  createEmployeeAssignment$(body: Partial<EmployeeAssignmentDTO>): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}employee-assignment`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  deleteEmployeeAssignment$(assignmentId: number, employeeCode: string): Observable<ExecutionResponse> {
    return this._http
      .delete<ExecutionResponse>(`${this._apiUrl}employee-assignment`, {
        params: { assignment_Id: assignmentId, employee_Code: employeeCode },
      })
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Weekly Progress ───────────────────────────────────────────────────────
  patchWeekValues$(body: Partial<WeeklyProgress>): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}PatchEmployeeWeekCurveValues`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  patchAssignmentWeeksConfig$(body: unknown): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}assignment-weeks-config`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  postNewWeekLevel$(body: unknown): Observable<ExecutionResponse> {
    return this._http
      .post<ExecutionResponse>(`${this._apiUrl}new-week-level-for-assignment`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  patchInstructorComment$(body: { codeId: number; comment: string }): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}instructors-comment-assignment`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  putWeekStatus$(body: { codeId: number; status: string }): Observable<ExecutionResponse> {
    return this._http
      .put<ExecutionResponse>(`${this._apiUrl}week-status-employee-assignment`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Operators ─────────────────────────────────────────────────────────────
  getEmployeesTraining$(): Observable<UserTrainingDto[]> {
    return this._http
      .get<UserTrainingDto[]>(`${this._apiUrl}employees-training`)
      .pipe(this._exceptionService.handleError<UserTrainingDto[]>([]));
  }

  patchEmployeeTrainer$(body: { employee_Code: string; trainer_Code: string }): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}employee-trainer`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Tracking ──────────────────────────────────────────────────────────────
  getCurveTracking$(trainerCode: string): Observable<ResponseCurveTrackDto> {
    return this._http
      .get<ResponseCurveTrackDto>(`${this._apiUrl}curves/${trainerCode}/current-tracking`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Instructores (Exenta) ─────────────────────────────────────────────────
  getInstructors$(): Observable<InstructorDto[]> {
    return this._http
      .get<InstructorDto[]>(`${environment.apiURL}Exenta/instructors`)
      .pipe(this._exceptionService.handleError<InstructorDto[]>([]));
  }
}
