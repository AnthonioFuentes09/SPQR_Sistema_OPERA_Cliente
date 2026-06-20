import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from 'environments/environment';
import { ExceptionService } from 'app/core/services/utils/exception.service';
import { generateCalendarWeeks } from 'app/core/services/utils/calendar-weeks.util';
import {
  ResponseEmployeeAssignments,
  EmployeeTimelineDto,
  AssignmentProgressDto,
  WeekCellDto,
  WeeklyProgress,
  WeekStatus,
  CurveStatus,
  UserTrainingDto,
  ResponseCurveTrackDto,
  InstructorDto,
  EmployeeAssignment,
  UpdateConfigParams,
  EmployeeAssignmentsFilterOpts,
} from 'app/core/interfaces/training-curves/training-curves.interface';
import {
  MOCK_TIMELINE_EMPLOYEES,
  MOCK_INSTRUCTORS,
  MockTimelineEmployee,
  MockAssignment,
} from 'app/core/mock/data/training.mock';
import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';

type CalWeeks = ReturnType<typeof generateCalendarWeeks>;

@Injectable({ providedIn: 'root' })
export class TrainingCurvesService {
  private readonly _http             = inject(HttpClient);
  private readonly _exceptionService = inject(ExceptionService);
  private readonly _apiUrl           = environment.apiURL + 'TrainingCurve/';

  // ── In-memory store para asignaciones ────────────────────────────────────
  private _nextId = 900;
  private readonly _employees = signal<MockTimelineEmployee[]>(
    MOCK_TIMELINE_EMPLOYEES.map(e => ({
      ...e,
      assignments: e.assignments.map(a => ({ ...a, weekProgress: [...a.weekProgress] })),
    })),
  );

  // ── Lectura timeline ──────────────────────────────────────────────────────

  getEmployeeTimelines$(year: number, semester: 1 | 2 | 0): Observable<ResponseEmployeeAssignments> {
    const calWeeks   = generateCalendarWeeks(year, semester === 0 ? 1 : semester);
    const timelines  = this._buildTimelines(this._employees(), calWeeks);
    const filterOpts = this._buildFilterOpts(this._employees());
    return of({ success: true, employeeTimelines: timelines, ea_FilterOpts: filterOpts });
  }

  // ── Escritura asignaciones ────────────────────────────────────────────────

  createAssignment$(body: EmployeeAssignment): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e => {
        if (e.employee_Code !== body.employee_Code) return e;
        const newId = ++this._nextId;
        // Ordenar las semanas de la curva por nivel para asignación progresiva
        const sortedCurveWeeks = [...(body.curveWeeks ?? [])].sort((a, b) => a.level - b.level);
        const startIdx = Math.max(0, body.lvlStart - 1);
        const weekProgress = Array.from({ length: body.duration }, (_, i) => {
          const curveWeek = sortedCurveWeeks[startIdx + i] ?? sortedCurveWeeks[sortedCurveWeeks.length - 1];
          const wk = body.initialWeek + i;
          return {
            week:              wk,
            level:             curveWeek?.level ?? (body.lvlStart + i),
            month:             Math.ceil(wk / 4),
            base_Hours:        curveWeek?.base_Hours  ?? 44,
            target_Efficiency: curveWeek?.target_Efficiency ?? 0,
            real_Efficiency:   null as number | null,
            real_Pieces:       null as number | null,
            base_Pieces:       curveWeek?.canti_Pieces ?? 0,
            status:            'por-hacer' as WeekStatus,
            instructorComment: body.comments ?? '',
            weekState:         'none' as const,
          };
        });
        const newA: MockAssignment = {
          id: newId, curve_Code: body.curve_Code, curve_Version: body.curve_Version,
          curve_Name: body.curve_Code, area_AlphaNumId: body.area_AlphaNumId,
          curveTypeCode: body.curveTypeCode, curveTypeDescription: body.curveTypeCode,
          date_Assignment: body.date_Assignment, initialWeek: body.initialWeek,
          duration: body.duration, statePeriod: (body.statePeriod || 'en-proceso') as CurveStatus,
          comments: body.comments ?? '', weekProgress,
        };
        return { ...e, assignments: [...e.assignments, newA] };
      }),
    );
    return of({ success: true, successMessage: 'Asignación creada correctamente.' });
  }

  deleteAssignment$(assignmentId: number, employeeCode: string): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e =>
        e.employee_Code !== employeeCode
          ? e
          : { ...e, assignments: e.assignments.filter(a => a.id !== assignmentId) },
      ),
    );
    return of({ success: true, successMessage: 'Asignación eliminada correctamente.' });
  }

  updateWeeksConfig$(params: UpdateConfigParams): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e => {
        if (e.employee_Code !== params.employee_Code) return e;
        return {
          ...e,
          assignments: e.assignments.map(a => {
            if (a.id !== params.codeId) return a;
            const weekProgress = params.curveWeeks.map(cw => ({
              week:              cw.assignment_Week ?? 0,
              level:             cw.curve_Level ?? 1,
              month:             Math.ceil((cw.assignment_Week ?? 0) / 4),
              base_Hours:        cw.base_Hours ?? 48,
              target_Efficiency: cw.target_Efficiency,
              real_Efficiency:   null as number | null,
              real_Pieces:       null as number | null,
              base_Pieces:       0,
              status:            (cw.weekState === 'canceled' ? 'cancelada' : 'por-hacer') as WeekStatus,
              instructorComment: cw.comments ?? '',
              weekState:         (cw.weekState ?? 'none') as 'added' | 'canceled' | 'moved' | 'requested' | 'none',
            }));
            return { ...a, weekProgress };
          }),
        };
      }),
    );
    return of({ success: true, successMessage: 'Semanas actualizadas correctamente.' });
  }

  updateAssignmentStatus$(assignmentId: number, newStatus: CurveStatus): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e => ({
        ...e,
        assignments: e.assignments.map(a =>
          a.id === assignmentId ? { ...a, statePeriod: newStatus } : a,
        ),
      })),
    );
    return of({ success: true, successMessage: 'Estado actualizado correctamente.' });
  }

  updateWeekStatus$(assignmentId: number, week: number, newStatus: WeekStatus): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e => ({
        ...e,
        assignments: e.assignments.map(a => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            weekProgress: a.weekProgress.map(wp =>
              wp.week === week ? { ...wp, status: newStatus } : wp,
            ),
          };
        }),
      })),
    );
    return of({ success: true, successMessage: 'Estado de semana actualizado.' });
  }

  saveInstructorComment$(assignmentId: number, week: number, comment: string): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e => ({
        ...e,
        assignments: e.assignments.map(a => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            weekProgress: a.weekProgress.map(wp =>
              wp.week === week ? { ...wp, instructorComment: comment } : wp,
            ),
          };
        }),
      })),
    );
    return of({ success: true, successMessage: 'Comentario guardado.' });
  }

  assignTrainer$(employeeCode: string, trainerCode: string, trainerName: string): Observable<ExecutionResponse> {
    this._employees.update(emps =>
      emps.map(e =>
        e.employee_Code === employeeCode
          ? { ...e, hasInstructor: !!trainerCode, trainer_Code: trainerCode, trainer_Name: trainerName }
          : e,
      ),
    );
    return of({ success: true, successMessage: 'Instructor asignado correctamente.' });
  }

  // ── HTTP: tracking (curve-tracking via interceptor) ───────────────────────

  getCurveTracking$(trainerCode: string): Observable<ResponseCurveTrackDto> {
    return this._http
      .get<ResponseCurveTrackDto>(`${this._apiUrl}curves/${trainerCode}/current-tracking`)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── HTTP: operarios (operators-management via interceptor) ────────────────

  getEmployeesTraining$(): Observable<{ success: boolean; operators: UserTrainingDto[]; instructors: InstructorDto[] }> {
    return this._http
      .get<{ success: boolean; operators: UserTrainingDto[]; instructors: InstructorDto[] }>(
        `${this._apiUrl}employees-training`,
      )
      .pipe(this._exceptionService.handleError<{ success: boolean; operators: UserTrainingDto[]; instructors: InstructorDto[] }>(
        { success: false, operators: [], instructors: [] },
      ));
  }

  patchEmployeeTrainer$(body: { employee_Code: string; trainer_Code: string }): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}employee-trainer`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Instructores (in-memory, igual que el resto del servicio) ────────────

  getInstructors$(): Observable<InstructorDto[]> {
    return of([...MOCK_INSTRUCTORS]);
  }

  // ── HTTP: progreso semanal (curve-tracking patch, via interceptor) ────────

  patchWeekValues$(body: Partial<WeeklyProgress>): Observable<ExecutionResponse> {
    return this._http
      .patch<ExecutionResponse>(`${this._apiUrl}PatchEmployeeWeekCurveValues`, body)
      .pipe(this._exceptionService.handleExecutionError());
  }

  // ── Builders ──────────────────────────────────────────────────────────────

  private _buildTimelines(employees: MockTimelineEmployee[], calWeeks: CalWeeks): EmployeeTimelineDto[] {
    const rows: EmployeeTimelineDto[] = [];
    let rowIndex = 0;

    for (const emp of employees) {
      // Agrupar asignaciones por área → curveType
      const areaMap = new Map<string, Map<string, MockAssignment[]>>();

      if (emp.assignments.length === 0) {
        areaMap.set('', new Map([['', []]]));
      } else {
        for (const a of emp.assignments) {
          if (!areaMap.has(a.area_AlphaNumId)) areaMap.set(a.area_AlphaNumId, new Map());
          const ctMap = areaMap.get(a.area_AlphaNumId)!;
          if (!ctMap.has(a.curveTypeCode)) ctMap.set(a.curveTypeCode, []);
          ctMap.get(a.curveTypeCode)!.push(a);
        }
      }

      let empRowCount = 0;
      for (const ctMap of areaMap.values()) empRowCount += ctMap.size;

      let isFirstEmp = true;

      for (const [area, ctMap] of areaMap.entries()) {
        const areaRowCount = ctMap.size;
        let isFirstArea    = true;

        for (const [curveType, assigns] of ctMap.entries()) {
          const ctDesc = assigns[0]?.curveTypeDescription ?? curveType;

          const assignmentDtos: AssignmentProgressDto[] = assigns.map(a => ({
            assignmentCodeId: a.id,
            employee_Code:    emp.employee_Code,
            employee_AltCode: emp.employee_AltCode,
            employee_Name:    emp.employee_Name,
            area_AlphaNumId:  a.area_AlphaNumId,
            curveTypeCode:    a.curveTypeCode,
            curve_Code:       a.curve_Code,
            curve_Version:    a.curve_Version,
            curve_Name:       a.curve_Name,
            date_Assignment:  a.date_Assignment,
            statePeriod:      a.statePeriod,
            initialWeek:      a.initialWeek,
            finalWeek:        a.initialWeek + a.duration - 1,
            duration:         a.duration,
            comments:         a.comments,
            requestedWeeks:   [],
          }));

          const weekCells = this._buildWeekCells(assigns, emp, calWeeks);

          rows.push({
            isFirstEmployeeLog:   isFirstEmp,
            isFirstAreaLog:       isFirstArea,
            isFirstTypeLog:       true,
            columnEmployeeSize:   empRowCount,
            columnAreaSize:       areaRowCount,
            columnCurveTypeSize:  1,
            timelineRow:          rowIndex++,
            employee_Code:        emp.employee_Code,
            employee_Name:        emp.employee_Name,
            employee_AltCode:     emp.employee_AltCode,
            userCategory_Code:    emp.userCategory_Code,
            userCategory_Name:    emp.userCategory_Name,
            canBeAssigned:        emp.canBeAssigned,
            hasInstructor:        emp.hasInstructor,
            trainer_Code:         emp.trainer_Code,
            trainer_Name:         emp.trainer_Name,
            area_AlphaNumId:      area,
            hasAreas:             areaMap.size > 1,
            totalAreas:           areaMap.size,
            curveTypeCode:        curveType,
            curveTypeDescription: ctDesc,
            totalCurveTypes:      ctMap.size,
            assignments:          assignmentDtos,
            weeks:                weekCells,
          });

          isFirstEmp  = false;
          isFirstArea = false;
        }
      }
    }
    return rows;
  }

  private _buildWeekCells(
    assigns:  MockAssignment[],
    emp:      MockTimelineEmployee,
    calWeeks: CalWeeks,
  ): WeekCellDto[] {
    return calWeeks.map(cw => {
      const wk     = cw.weekNumber;
      const assign = assigns.find(a => wk >= a.initialWeek && wk <= a.initialWeek + a.duration - 1);

      if (!assign) {
        return {
          weekNumber: wk, semesterNumber: cw.semesterNumber,
          isCurrentWeek: cw.isCurrentWeek, isPastWeek: cw.isPastWeek, isFutureWeek: cw.isFutureWeek,
          hasAssignment: false, hasInstructorComment: false,
          weeklyProgress: null, weekCellClass: '', weekCellContent: '',
        };
      }

      const mockWp = assign.weekProgress.find(wp => wp.week === wk);
      if (!mockWp) {
        return {
          weekNumber: wk, semesterNumber: cw.semesterNumber,
          isCurrentWeek: cw.isCurrentWeek, isPastWeek: cw.isPastWeek, isFutureWeek: cw.isFutureWeek,
          hasAssignment: true, hasInstructorComment: false,
          weeklyProgress: null, weekCellClass: 'cell-por-hacer', weekCellContent: '',
        };
      }

      let effectiveStatus = mockWp.status;
      if (cw.isCurrentWeek && mockWp.status === 'por-hacer') effectiveStatus = 'en-progreso';

      const wp: WeeklyProgress = {
        codeId:              assign.id * 100 + (wk - assign.initialWeek),
        assignment_CodeId:   assign.id,
        assignment_Year:     cw.year,
        assignment_Month:    cw.month,
        assignment_Week:     wk,
        curve_Level:         mockWp.level,
        base_Hours:          mockWp.base_Hours,
        target_Efficiency:   mockWp.target_Efficiency,
        real_Efficiency:     mockWp.real_Efficiency,
        real_Pieces:         mockWp.real_Pieces,
        base_Pieces:         mockWp.base_Pieces,
        assignment_Progress: effectiveStatus,
        weekState:           mockWp.weekState,
        trainer_Code:        emp.trainer_Code,
        trainer_Name:        emp.trainer_Name,
        comments:            '',
        instructorComments:  mockWp.instructorComment,
        isCurrentWeek:       cw.isCurrentWeek,
        beforeCurrentWeek:   cw.isPastWeek,
      };

      const cellContent = mockWp.real_Efficiency != null
        ? `${mockWp.target_Efficiency}%\n${mockWp.real_Efficiency}%`
        : `${mockWp.target_Efficiency}%`;

      return {
        weekNumber:           wk,
        semesterNumber:       cw.semesterNumber,
        isCurrentWeek:        cw.isCurrentWeek,
        isPastWeek:           cw.isPastWeek,
        isFutureWeek:         cw.isFutureWeek,
        hasAssignment:        true,
        hasInstructorComment: !!mockWp.instructorComment,
        weeklyProgress:       wp,
        weekCellClass:        this._cellClass(effectiveStatus, mockWp.real_Efficiency, mockWp.target_Efficiency),
        weekCellContent:      cellContent,
      };
    });
  }

  /**
   * Determina el color de la celda:
   * - Si tiene eficiencia real → comparar vs objetivo (verde ≥ objetivo, rojo < objetivo)
   * - Sin eficiencia real     → usar el estado de la semana
   */
  private _cellClass(status: WeekStatus, realEfficiency: number | null, targetEfficiency: number): string {
    // Semanas pasadas/en pausa/canceladas con dato real: comparar eficiencia
    if (realEfficiency !== null && realEfficiency !== undefined) {
      return realEfficiency >= targetEfficiency ? 'cell-completada' : 'cell-no-completado';
    }

    // Sin dato real: usar estado
    const map: Partial<Record<WeekStatus, string>> = {
      'completada':    'cell-completada',
      'en-progreso':   'cell-en-progreso',
      'por-hacer':     'cell-por-hacer',
      'en-pausa':      'cell-en-pausa',
      'no-completado': 'cell-no-completado',
      'cancelada':     'cell-cancelada',
      'solicitada':    'cell-solicitada',
      'sin-info':      'cell-sin-info',
    };
    return map[status] ?? 'cell-sin-info';
  }

  private _buildFilterOpts(employees: MockTimelineEmployee[]): EmployeeAssignmentsFilterOpts {
    const instructors = new Map<string, string>();
    const areas       = new Set<string>();
    const ctypes      = new Set<string>();
    const cats        = new Map<string, string>();

    for (const e of employees) {
      if (e.hasInstructor) instructors.set(e.trainer_Code, e.trainer_Name);
      cats.set(e.userCategory_Code, e.userCategory_Name);
      for (const a of e.assignments) { areas.add(a.area_AlphaNumId); ctypes.add(a.curveTypeCode); }
    }

    const arr = (s: Set<string>): BaseItemFilterOptions[] =>
      [...s].map(v => ({ valueKey: v, description: v }));

    return {
      instructorOpts:   [...instructors.entries()].map(([k, v]) => ({ valueKey: k, description: v })),
      areaOpts:          arr(areas),
      areaModalOpts:     arr(areas),
      yearOpts:          ['2025', '2026', '2027'].map(y => ({ valueKey: y, description: y })),
      curveTypeOpts:     arr(ctypes),
      categoryUserOpts: [...cats.entries()].map(([k, v]) => ({ valueKey: k, description: `${k} - ${v}` })),
    };
  }
}
