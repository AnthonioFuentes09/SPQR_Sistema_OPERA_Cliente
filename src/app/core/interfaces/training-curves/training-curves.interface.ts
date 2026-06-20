import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';
import { BaseItemFilterOptions } from 'app/core/interfaces/adm-sys/adm-sys.interface';

// ── Enumeraciones (valores en español — así llegan del API) ───────────────────
export type CurveStatus =
  | 'planificada' | 'en-proceso' | 'en-pausa'
  | 'cancelada'   | 'completada' | 'no-completada';

export type WeekStatus =
  | 'cancelada'   | 'completada'   | 'en-pausa'
  | 'en-progreso' | 'no-completado'| 'por-hacer'
  | 'solicitada'  | 'sin-info';

export type CurveTypeCode = 'T' | 'RT' | 'B';

// ── Progreso semanal ──────────────────────────────────────────────────────────
export interface WeeklyProgress {
  codeId:               number;
  assignment_CodeId:    number;
  assignment_Year:      number;
  assignment_Month:     number;
  assignment_Week:      number;
  curve_Level:          number;
  base_Hours:           number;
  training_Hours?:      number;
  target_Efficiency:    number;
  real_Efficiency:      number | null;
  real_Pieces:          number | null;
  real_Hours?:          number;
  base_Pieces:          number;
  assignment_Progress:  WeekStatus;
  weekState:            'added' | 'canceled' | 'moved' | 'requested' | 'none';
  trainer_Code:         string;
  trainer_Name:         string;
  comments:             string;
  instructorComments:   string;
  // UI only — seteados en el cliente
  initialWeekDate?:     Date;
  finalWeekDate?:       Date;
  beforeCurrentWeek?:   boolean;
  isCurrentWeek?:       boolean;
}

// ── DTOs legacy (mantenidos para mock interceptor) ────────────────────────────
/** @deprecated Usar EmployeeTimelineDto. Solo existe para el mock interceptor. */
export interface EmployeeAssignmentDTO {
  codeId:          number;
  employee_Code:   string;
  employee_Name:   string;
  curve_Code:      string;
  curve_Version:   number;
  area_AlphaNumId: string;
  date_Assignment: string;
  statePeriod:     CurveStatus;
  curveTypeCode:   CurveTypeCode;
  initialWeek:     number;
  finalWeek:       number;
  duration:        number;
  lvlStart:        number;
  comments?:       string;
  trainer_Code:    string;
  trainer_Name:    string;
  weeks:           WeeklyProgress[];
}

// ── Timeline: modelos principales ─────────────────────────────────────────────

/** Solicitudes de cambio de estado de semana */
export interface RequestedWeeks {
  codeId:                number;
  assignmentDet_CodeId:  number;
  employee_Code:         string;
  curve_Level:           number;
  assignment_Week:       number;
  assignment_Year:       number;
  initialWeekDate?:      Date;
  trainer_Code:          string;
  trainer_Name:          string;
  request_Status:        'pendiente' | 'aprobada' | 'rechazada';
  comments?:             string;
  create_By:             string;
  creation_Date:         string;
  modified_By?:          string;
}

/** Una asignación resumida (cabecera) dentro de una fila del timeline */
export interface AssignmentProgressDto {
  assignmentCodeId:  number;
  employee_Code:     string;
  employee_AltCode:  string;
  employee_Name:     string;
  area_AlphaNumId:   string;
  curveTypeCode:     string;
  curve_Code:        string;
  curve_Version:     string;
  curve_Name:        string;
  date_Assignment:   string;
  statePeriod:       CurveStatus;
  initialWeek:       number;
  finalWeek:         number;
  duration:          number;
  comments:          string;
  requestedWeeks:    RequestedWeeks[];
}

/** Celda de semana en el timeline */
export interface WeekCellDto {
  weekNumber:           number;
  semesterNumber:       number;
  isCurrentWeek:        boolean;
  isPastWeek:           boolean;
  isFutureWeek:         boolean;
  hasAssignment:        boolean;
  hasInstructorComment: boolean;
  weeklyProgress:       WeeklyProgress | null;
  weekCellClass:        string;
  weekCellContent:      string;  // e.g. "60%\n55%"
}

/** Fila del timeline (una por combinación empleado × área × tipoDecrva) */
export interface EmployeeTimelineDto {
  // Rowspan
  isFirstEmployeeLog:    boolean;
  isFirstAreaLog:        boolean;
  isFirstTypeLog:        boolean;
  columnEmployeeSize:    number;
  columnAreaSize:        number;
  columnCurveTypeSize:   number;
  timelineRow:           number;
  // Empleado
  employee_Code:         string;
  employee_Name:         string;
  employee_AltCode:      string;
  userCategory_Code:     string;
  userCategory_Name:     string;
  canBeAssigned:         boolean;
  // Instructor
  hasInstructor:         boolean;
  trainer_Code:          string;
  trainer_Name:          string;
  // Área
  area_AlphaNumId:       string;
  hasAreas:              boolean;
  totalAreas:            number;
  // Tipo de curva
  curveTypeCode:         string;
  curveTypeDescription:  string;
  totalCurveTypes:       number;
  // Datos
  assignments:           AssignmentProgressDto[];
  weeks:                 WeekCellDto[];  // 26 celdas para el semestre seleccionado
}

/** Semana del calendario con fechas reales */
export interface PayWebCalendarWeek {
  year:           number;
  month:          number;
  monthName:      string;
  weekNumber:     number;
  semesterNumber: number;
  initialDate:    Date;
  finalDate:      Date;
  isCurrentWeek:  boolean;
  isPastWeek:     boolean;
  isFutureWeek:   boolean;
}

/** Opciones de filtro que vienen del servidor junto al timeline */
export interface EmployeeAssignmentsFilterOpts {
  instructorOpts:  BaseItemFilterOptions[];
  areaOpts:        BaseItemFilterOptions[];
  areaModalOpts:   BaseItemFilterOptions[];
  yearOpts:        BaseItemFilterOptions[];
  curveTypeOpts:   BaseItemFilterOptions[];
  categoryUserOpts: BaseItemFilterOptions[];
}

export interface ResponseEmployeeAssignments extends ExecutionResponse {
  employeeTimelines: EmployeeTimelineDto[];
  ea_FilterOpts:     EmployeeAssignmentsFilterOpts;
}

// ── Parámetros de operaciones CRUD ────────────────────────────────────────────

/** Semana individual de curva para crear/editar asignación */
export interface AssignmentCurve_WeeksDto {
  codeId:            number;
  assignment_Year:   number;
  assignment_Month:  number;
  assignment_Week?:  number;
  initialWeekDate?:  Date | string;
  finalWeekDate?:    Date | string;
  beforeCurrentWeek?: boolean;
  curve_Level?:      number;
  base_Hours?:       number;
  training_Hours?:   number;
  target_Efficiency: number;
  weekState?:        'added' | 'canceled' | 'moved' | 'requested' | 'none';
  comments?:         string;
}

/** Body para crear una nueva asignación */
export interface EmployeeAssignment {
  date_Assignment: string;
  employee_Code:   string;
  employee_Name:   string;
  curve_Code:      string;
  curve_Version:   string;
  area_AlphaNumId: string;
  statePeriod:     string;
  initialWeek:     number;
  finalWeek:       number;
  duration:        number;
  lvlStart:        number;
  comments?:       string;
  curveTypeCode:   string;
  // UI only — datos de la curva para que el mock pueda construir semanas correctas
  curveWeeks?: { level: number; base_Hours: number; target_Efficiency: number; canti_Pieces: number }[];
}

/** Body para actualizar semanas de una asignación */
export interface UpdateConfigParams {
  codeId:          number;
  employee_Code:   string;
  date_Assignment: string;
  curve_Code:      string;
  curve_Version:   string;
  area_AlphaNumId: string;
  curveWeeks:      AssignmentCurve_WeeksDto[];
}

/** Body para cambiar estado de una semana */
export interface UpdateAssignmentStatusParams {
  assignment_DetId: number;
  newStatePeriod:   string;
  comments:         string;
}

/** Body para guardar comentario del instructor */
export interface InstructorCommentsParams {
  codeId:  number;
  comment: string;
}

// ── UI: Context menus y popovers ──────────────────────────────────────────────

export interface ContextMenu {
  x:                    number;
  y:                    number;
  assignment:           AssignmentProgressDto;
  weeklyProgress:       WeeklyProgress[];
  currentWeeklyProgress: WeeklyProgress | null;
}

export interface EmployeeInfo {
  x:        number;
  y:        number;
  empItem?: EmployeeTimelineDto;
}

export type ModalType =
  | 'assignment' | 'manageWeeks' | 'instructorComments'
  | 'requestedWeeks' | 'instructor' | 'changeStatus' | 'delete';

// ── Tipos de curva y estados ─────────────────────────────────────────────────

export interface CurveTypes {
  curveTypeCode:        string;
  curveTypeDescription: string;
}

export interface WeekStatusType {
  status:      WeekStatus;
  description: string;
}

export const CURVE_TYPE_LIST: CurveTypes[] = [
  { curveTypeCode: 'T',  curveTypeDescription: 'ENTRENAMIENTO'   },
  { curveTypeCode: 'RT', curveTypeDescription: 'RE-ENTRENAMIENTO'},
  { curveTypeCode: 'B',  curveTypeDescription: 'TITULAR'         },
];

export const CURVE_STATUS_LIST: WeekStatusType[] = [
  { status: 'en-progreso',   description: 'En Progreso'   },
  { status: 'por-hacer',     description: 'Por Hacer'     },
  { status: 'en-pausa',      description: 'En Pausa'      },
  { status: 'completada',    description: 'Completada'    },
  { status: 'no-completado', description: 'No Completado' },
  { status: 'cancelada',     description: 'Cancelada'     },
];

// ── Tracking ──────────────────────────────────────────────────────────────────
export interface CurveTrackDto {
  // Identificadores
  codeId:              number;
  assignment_CodeId:   number;
  // Empleado
  employee_Code:       string;
  employee_AltCode:    string;
  employee_Name:       string;
  // Curva / Área
  curve_Code:          string;
  curve_Name:          string;
  area_AlphaNumId:     string;
  // Instructor
  trainer_Code:        string;
  trainer_Name:        string;
  // Semana
  assignment_Week:     number;
  curve_Level:         number;
  assignment_Progress: WeekStatus;
  isCurrentWeek:       boolean;
  // Valores meta (solo lectura)
  base_Hours:          number;
  target_Efficiency:   number;
  base_Pieces:         number;
  // Valores reales (editables)
  value_Hours:         number;
  real_Efficiency:     number;
  real_Pieces:         number;
  // Comentario instructor
  instructorComments?: string;
  // UI only — seteados en el cliente, no se envían al API
  editableRow:         boolean;
  editableHour:        boolean;
  editableEfficiency:  boolean;
  editablePieces:      boolean;
}

export interface ResponseCurveTrackDto extends ExecutionResponse {
  tracking: CurveTrackDto[];
}

// ── Operarios ─────────────────────────────────────────────────────────────────
export interface UserTrainingDto {
  employee_Code: string;
  employee_Name: string;
  trainer_Code:  string;
  trainer_Name:  string;
  curve_Code:    string;
  status:        CurveStatus;
}

export interface ResponseUserTrainingDto extends ExecutionResponse {
  operators:   UserTrainingDto[];
  instructors: InstructorDto[];
}

export interface InstructorDto {
  trainer_Code: string;
  trainer_Name: string;
}

// ── Solicitudes ───────────────────────────────────────────────────────────────
export interface CurveRequestDto {
  codeId:               number;
  assignmentDet_CodeId: number;
  employee_Code:        string;
  employee_Name:        string;
  week_Number:          number;
  current_Status:       WeekStatus;
  requested_Status:     WeekStatus;
  request_Date:         string;
  comments:             string;
  trainer_Code:         string;
  trainer_Name:         string;
  curve_Code?:          string;
  curve_Level?:         number;
}

export interface ResponseCurveRequestsDto extends ExecutionResponse {
  requests: CurveRequestDto[];
}
