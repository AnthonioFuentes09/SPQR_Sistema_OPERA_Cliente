import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

// ── Semanas de la curva ──────────────────────────────────────────────────────
export interface BaseCurve_WeeksDto {
  level:             number;
  base_Hours:        number;
  target_Efficiency: number;
  canti_Pieces:      number;
  tolerance:         number;
  editableRow?:      boolean;
  updatedRow?:       boolean;
}

// ── Curva ────────────────────────────────────────────────────────────────────
export interface CurveDto {
  code?:                string;
  name_Curve:           string;
  description?:         string;
  catExenta_AlphaNumId: string;
  canti_Semanas:        number;
  canti_Opers:          number;
  selectedWeeks:        BaseCurve_WeeksDto[];
  selectedOperations:   string[];
  isActive:             boolean;
  cantiCurves?:         string;
}

// ── Categorías de Exenta ─────────────────────────────────────────────────────
export interface OperationsCategoriesDto {
  alphaNumId: string;
  name_Categ: string;
}

// ── Operaciones de Exenta ────────────────────────────────────────────────────
export interface OperationsDto {
  id:                     number;
  alphaNumId:             string;
  name_Oper:              string;
  operationCategory_Name: string;
}

// ── Responses ────────────────────────────────────────────────────────────────
export interface ResponseCurvesDto extends ExecutionResponse {
  curves: CurveDto[];
}

export interface ResponseCategoriesDto extends ExecutionResponse {
  categories: OperationsCategoriesDto[];
}

export interface ResponseOperationsDto extends ExecutionResponse {
  operations: OperationsDto[];
}
