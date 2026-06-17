import { ExecutionResponse } from 'app/core/interfaces/exceptions/exceptions.interface';

export interface BaseCurve_WeeksDto {
  week_Number:       number;
  curve_Level:       number;
  base_Hours:        number;
  target_Efficiency: number;
  base_Pieces:       number;
}

export interface CurveDto {
  curve_Code:         string;
  curve_Version:      number;
  curve_Description:  string;
  curve_Category:     string;
  opExenta_AlphaNumId?: string;
  operation_Name?:    string;
  is_Active:          boolean;
  weeks:              BaseCurve_WeeksDto[];
}

export interface ResponseCurvesDto extends ExecutionResponse {
  curves: CurveDto[];
}

export interface OperationDto {
  opExenta_AlphaNumId: string;
  operation_Name:      string;
  category_Code:       string;
  category_Name:       string;
}

export interface ResponseOperationsDto extends ExecutionResponse {
  operations: OperationDto[];
}
