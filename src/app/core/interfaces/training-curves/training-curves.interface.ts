import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

// ── Enumeraciones (valores en español — así llegan del API) ───────────────────
export type CurveStatus =
  | 'planificada' | 'en-proceso' | 'en-pausa'
  | 'cancelada'   | 'completada' | 'no-completada';

export type WeekStatus =
  | 'cancelada'   | 'completada'   | 'en-pausa'
  | 'en-progreso' | 'no-completado'| 'por-hacer'
  | 'solicitada'  | 'sin-info';

export type CurveTypeCode = 'T' | 'RT' | 'B';

// ── DTOs de asignación ────────────────────────────────────────────────────────
export interface WeeklyProgress {
  codeId:               number;
  assignment_CodeId:    number;
  assignment_Year:      number;
  assignment_Month:     number;
  assignment_Week:      number;
  curve_Level:          number;
  base_Hours:           number;
  target_Efficiency:    number;
  real_Efficiency:      number | null;
  real_Pieces:          number | null;
  real_Hours?:          number;
  base_Pieces:          number;
  assignment_Progress:  WeekStatus;
  trainer_Code:         string;
  trainer_Name:         string;
  comments:             string;
  instructorComments:   string;
  weekState:            'added' | 'canceled' | 'moved' | 'none';
}

export interface EmployeeAssignmentDTO {
  codeId:              number;
  employee_Code:       string;
  employee_Name:       string;
  curve_Code:          string;
  curve_Version:       number;
  area_AlphaNumId:     string;
  date_Assignment:     string;
  statePeriod:         CurveStatus;
  curveTypeCode:       CurveTypeCode;
  initialWeek:         number;
  finalWeek:           number;
  duration:            number;
  lvlStart:            number;
  comments?:           string;
  trainer_Code:        string;
  trainer_Name:        string;
  weeks:               WeeklyProgress[];
  // UI only
  isExpanded?:         boolean;
}

export interface ResponseEmployeeAssignments extends ExecutionResponse {
  assignments: EmployeeAssignmentDTO[];
  filterOptions?: AssignmentFilterOptions;
}

export interface AssignmentFilterOptions {
  areas:       { valueKey: string; description: string }[];
  instructors: { valueKey: string; description: string }[];
  statuses:    { valueKey: string; description: string }[];
}

// ── Tracking ──────────────────────────────────────────────────────────────────
/** Fila aplanada para la tabla de seguimiento. El API devuelve un objeto por semana activa. */
export interface CurveTrackDto {
  // Datos del empleado
  employee_Code:       string;
  employee_Name:       string;
  curve_Code:          string;
  assignment_Id:       number;
  // Datos de la semana (aplanados de WeeklyProgress para facilitar edición inline)
  codeId:              number;
  assignment_Week:     number;
  curve_Level:         number;
  target_Efficiency:   number;
  real_Efficiency:     number | null;
  real_Pieces:         number | null;
  real_Hours?:         number;
  assignment_Progress: WeekStatus;
  isCurrentWeek:       boolean;
  trainer_Code:        string;
}

export interface ResponseCurveTrackDto extends ExecutionResponse {
  tracking: CurveTrackDto[];
}

// ── Operarios ─────────────────────────────────────────────────────────────────
export interface UserTrainingDto {
  employee_Code:  string;
  employee_Name:  string;
  trainer_Code:   string;
  trainer_Name:   string;
  curve_Code:     string;
  status:         CurveStatus;
}

export interface ResponseUserTrainingDto extends ExecutionResponse {
  operators: UserTrainingDto[];
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
  // Campos opcionales adicionales
  curve_Code?:          string;
  curve_Level?:         number;
}

export interface ResponseCurveRequestsDto extends ExecutionResponse {
  requests: CurveRequestDto[];
}
